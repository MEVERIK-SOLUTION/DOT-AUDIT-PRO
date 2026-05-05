import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Caching
  const cache = new Map<string, { data: any, timestamp: number }>();
  const CACHE_TTL = 3600000; // 1 hour

  // 1. ARES Proxy
  app.get("/api/ares/:ico", async (req, res) => {
    const { ico } = req.params;
    try {
      const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`, {
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) return res.status(response.status).json({ error: "ARES unreachable" });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Proxy error" });
    }
  });

  // 2. Hlídac Státu Proxy
  app.get("/api/risk/:ico", async (req, res) => {
    const { ico } = req.params;
    const token = process.env.HLIDAC_STATU_TOKEN;
    if (!token) return res.json({ score: 0, flags: [] });

    try {
      const response = await fetch(`https://api.hlidacstatu.cz/Api/v2/osoba/stats/${ico}`, {
        headers: { "Authorization": `Token ${token}` }
      });
      if (!response.ok) return res.json({ score: 0, flags: [] });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.json({ score: 0, flags: [] });
    }
  });

  // 3. CZSO VDB Proxy for Population
  app.get("/api/czso/population/:kodObce", async (req, res) => {
    const { kodObce } = req.params;
    try {
      // VDB API v1 call for DEM0004 (Population)
      const url = `https://vdb.czso.cz/vdbvo2/api/v1/vystup-objekt?id=5121&p_id=DEM0004&k_id=3049&u_id=${kodObce}`;
      const response = await fetch(url, {
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) return res.json({ population: 500 }); // Fallback
      const data = await response.json();
      
      // Extracting the value from the complex VDB JSON structure
      // Usually data.vystup.data[0].hodnota
      const value = data.vystup?.data?.[0]?.hodnota || 500;
      res.json({ population: Math.round(value) });
    } catch (error) {
      res.json({ population: 500 });
    }
  });

  // 4. Municipality Search Proxy (ARES-based search for faster lookup than LLM)
  app.get("/api/municipality/search", async (req, res) => {
    const query = req.query.q as string;
    if (!query || query.length < 2) return res.json([]);

    if (cache.has(query)) {
      const cached = cache.get(query)!;
      if (Date.now() - cached.timestamp < CACHE_TTL) return res.json(cached.data);
    }

    try {
      // Searching ARES for municipalities is robust and fast
      const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ obchodniJmeno: query, pravniForma: ["801"], start: 0, pocet: 10 })
      });
      
      if (!response.ok) return res.json([]);
      const data = await response.json();
      
      // Map to our internal format
      const results = data.ekonomickeSubjekty?.map((e: any) => ({
        name: e.obchodniJmeno,
        ico: e.ico,
        region: e.sidlo?.nazevKraje || "Česká republika",
        address: e.sidlo?.textovaAdresa,
        kodObce: e.sidlo?.kodObce,
        kodCastiObce: e.sidlo?.kodCastiObce
      })) || [];

      cache.set(query, { data: results, timestamp: Date.now() });
      res.json(results);
    } catch (e) {
      res.json([]);
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
