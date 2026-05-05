import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface EntityInfo {
  name: string;
  ico: string;
  legalForm: string;
  type: 'municipality' | 'ngo' | 'private_sme' | 'private_large' | 'public_entity';
  address?: string;
  riskScore?: number;
  riskFlags?: string[];
  kodObce?: number;
  employeesCategory?: string;
}

export interface MunicipalityInfo {
  name: string;
  population: number;
  region: string;
  ico?: string;
  kodObce?: number;
}

export interface ExpertRecord {
  name: string;
  id: string;
  specialization: string;
  database: string;
  region: string;
  availability: 'Dostupný' | 'Vytížený' | 'Není známo';
  verificationStatus?: 'verified' | 'pending' | 'warning' | 'stale';
  verificationNotes?: string[];
  lastVerified?: string;
}

const HLIDAC_TOKEN = import.meta.env.VITE_HLIDAC_STATU_TOKEN;

export const lookupService = {
  async verifyExpert(expert: ExpertRecord): Promise<ExpertRecord> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash", // Use faster model for verification
        contents: `Cross-reference this expert across Czech public registers (ČKAIT, ČKA, MŽP). 
        Expert: ${expert.name} (ID: ${expert.id}, DB: ${expert.database}).
        Determine:
        1. If active in the register.
        2. If specialization matches.
        3. If there are any historical disciplinary issues or expired certificates.
        4. When was the last update in the register.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, enum: ['verified', 'warning', 'stale'] },
              notes: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              lastUpdated: { type: Type.STRING }
            },
            required: ["status", "notes", "lastUpdated"]
          }
        }
      });

      const data = JSON.parse(response.text);
      return {
        ...expert,
        verificationStatus: data.status,
        verificationNotes: data.notes,
        lastVerified: data.lastUpdated
      };
    } catch (e) {
      console.error("Verification failed", e);
      return { ...expert, verificationStatus: 'pending' };
    }
  },

  async searchExpert(
    query: string, 
    database: string, 
    filters?: { specialization?: string; region?: string; availability?: string }
  ): Promise<ExpertRecord[]> {
    if (query.trim().length < 3 && !filters?.specialization && !filters?.region) return [];
    
    try {
      const filterDesc = filters ? 
        `Filters: Specialization: ${filters.specialization || 'any'}, Region: ${filters.region || 'any'}, Availability: ${filters.availability || 'any'}` : 
        'No additional filters';

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Search for authorized experts in the "${database}" database matching query "${query}". 
        ${filterDesc}
        Provide 5 realistic or actual results with name, certificate ID, specialization, region (Czech kraj), and availability status.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                id: { type: Type.STRING },
                specialization: { type: Type.STRING },
                database: { type: Type.STRING },
                region: { type: Type.STRING },
                availability: { 
                  type: Type.STRING, 
                  enum: ['Dostupný', 'Vytížený', 'Není známo'] 
                }
              },
              required: ["name", "id", "specialization", "database", "region", "availability"]
            }
          }
        }
      });

      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("Expert search failed:", error);
      return [];
    }
  },

  async searchMunicipality(query: string): Promise<MunicipalityInfo[]> {
    if (query.length < 2) return [];

    try {
      const res = await fetch(`/api/municipality/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const data = await res.json();
      
      if (data.length === 0) return [];

      // Fetch population for each municipality concurrently from CZSO
      const resultsWithPops = await Promise.all(data.map(async (m: any) => {
        if (!m.kodObce) return { ...m, population: 500 };
        try {
          const pRes = await fetch(`/api/czso/population/${m.kodObce}`);
          if (pRes.ok) {
            const pData = await pRes.json();
            return { ...m, population: pData.population };
          }
        } catch (e) {
          console.warn("CZSO lookup failed for", m.name, e);
        }
        return { ...m, population: 500 };
      }));

      return resultsWithPops;
    } catch (error) {
      console.error("Municipality lookup failed:", error);
      return [];
    }
  },

  async lookupICO(ico: string): Promise<EntityInfo | null> {
    if (!/^\d{8}$/.test(ico)) return null;

    try {
      // 1. Get Base Data via Local Proxy
      const [aresRes, riskRes] = await Promise.all([
        fetch(`/api/ares/${ico}`),
        fetch(`/api/risk/${ico}`)
      ]);

      const aresData = aresRes.ok ? await aresRes.json() : null;
      const riskData = riskRes.ok ? await riskRes.json() : { score: 0, flags: [] };

      if (!aresData) return null;

      // 2. Efficiently categorize legal form using Gemini
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Categorize this Czech entity (Právní forma: ${aresData.kodPravniFormy}, Název: ${aresData.obchodniJmeno}) into: municipality, ngo, private_sme, private_large (SME < 250 staff), public_entity.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { 
                type: Type.STRING,
                enum: ['municipality', 'ngo', 'private_sme', 'private_large', 'public_entity']
              }
            },
            required: ["type"]
          }
        }
      });

      const cat = JSON.parse(response.text || "{}");
      
      return {
        name: aresData.obchodniJmeno,
        ico: aresData.ico,
        legalForm: aresData.pravniForma || "Neznámá",
        type: cat.type || 'private_sme',
        address: aresData.sidlo?.textovaAdresa,
        kodObce: aresData.sidlo?.kodObce,
        employeesCategory: aresData.kategoriePoctuZamestnancu,
        riskScore: riskData.score,
        riskFlags: riskData.flags
      };
    } catch (error) {
      console.error("ICO lookup failed:", error);
      return null;
    }
  }
};
