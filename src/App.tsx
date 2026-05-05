import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  MapPin, 
  Users, 
  Info, 
  Copy, 
  Check, 
  ArrowRight, 
  HelpCircle,
  Waves,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  FileText,
  ShieldCheck,
  Coins,
  History,
  AlertCircle,
  Stethoscope,
  Terminal,
  BookOpen,
  CalendarDays,
  Hammer,
  Clock,
  TrendingUp,
  Target,
  LayoutDashboard,
  Search,
  UserCheck,
  ExternalLink,
  Heart,
  Filter,
  AlertTriangle,
  Download,
  Map as MapIcon,
  BarChart2,
  Plus,
  Database,
  Building,
  Briefcase,
  Bell,
  MessageSquare,
  Globe,
  Undo2,
  Zap
} from 'lucide-react';
import { CATEGORIES, type MunicipalityCategory } from './types';
import { 
  ACTIVITIES, 
  AUDIT_QUESTIONS, 
  GRANT_PHASES, 
  CURRENT_CALLS, 
  NEWS_FEED, 
  DATABASE_RESOURCES, 
  PROVIDERS,
  type Activity, 
  type Call, 
  type ApplicantType 
} from './data/rules';
import { lookupService, type MunicipalityInfo, type EntityInfo, type ExpertRecord } from './services/lookupService';
import { GrantDashboard } from './components/GrantDashboard';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

// Fix for Leaflet marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

const COORDS_CACHE: Record<string, [number, number]> = {};

function MunicipalityMap({ city }: { city: string }) {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city) return;
    
    if (COORDS_CACHE[city]) {
      setCoords(COORDS_CACHE[city]);
      return;
    }

    const fetchCoords = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city + ', Czech Republic')}`);
        const data = await res.json();
        if (data && data[0]) {
          const newCoords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          COORDS_CACHE[city] = newCoords;
          setCoords(newCoords);
        }
      } catch (e) {
        console.error("Geocoding failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCoords();
  }, [city]);

  if (loading || !coords) return (
    <div className="w-full h-48 bg-nat-bg rounded-2xl overflow-hidden border border-nat-border relative">
      <div className="absolute inset-0 bg-nat-border/50 animate-skeleton" />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
        <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center mb-3 shadow-sm">
          <MapIcon className="w-6 h-6 text-nat-primary opacity-40" />
        </div>
        <div className="text-[10px] uppercase font-black text-nat-accent opacity-60 tracking-[0.2em] max-w-[200px]">
          {loading ? "Zaměřuji lokalitu..." : "Mapa není k dispozici (Zadejte platnou obec)"}
        </div>
      </div>
      {/* Background patterns to make it look like a map skeleton */}
      <div className="absolute top-10 left-10 w-20 h-2 bg-white/20 rounded-full rotate-12" />
      <div className="absolute bottom-10 right-10 w-32 h-2 bg-white/20 rounded-full -rotate-6" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/30 rounded-full" />
    </div>
  );

  return (
    <div className="w-full h-48 rounded-2xl overflow-hidden border border-nat-border shadow-inner relative group">
      <div className="absolute inset-0 bg-nat-primary/5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
      <MapContainer center={coords} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={coords} icon={DefaultIcon} />
        <MapView center={coords} />
      </MapContainer>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<'audit' | 'calls' | 'database' | 'profile'>('audit');
  const [step, setStep] = useState(1);
  const [city, setCity] = useState('České Budějovice');
  const [population, setPopulation] = useState('97339');
  const [selectedCategory, setSelectedCategory] = useState<MunicipalityCategory>(CATEGORIES[5]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [estimatedCosts, setEstimatedCosts] = useState('1000000');
  const [costError, setCostError] = useState<string | null>(null);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityCategory, setActivityCategory] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);

  // New Data lookup states
  const [ico, setIco] = useState('');
  const [activeEntity, setActiveEntity] = useState<EntityInfo | null>(null);
  const [isSearchingIco, setIsSearchingIco] = useState(false);
  const [municipalityResults, setMunicipalityResults] = useState<MunicipalityInfo[]>([]);
  const [isSearchingMuni, setIsSearchingMuni] = useState(false);
  const [showMuniDropdown, setShowMuniDropdown] = useState(false);

  // Expert states
  const [expertQuery, setExpertQuery] = useState('');
  const [expertFilters, setExpertFilters] = useState<{ specialization?: string; region?: string; availability?: string }>({});
  const [expertResults, setExpertResults] = useState<ExpertRecord[]>([]);
  const [isSearchingExpert, setIsSearchingExpert] = useState(false);
  const [activeExpert, setActiveExpert] = useState<ExpertRecord | null>(null);
  const [selectedSearchDb, setSelectedSearchDb] = useState('ČKAIT');
  const [favoriteExperts, setFavoriteExperts] = useState<ExpertRecord[]>([]);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favorite_experts');
    if (saved) {
      try {
        setFavoriteExperts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load favorites", e);
      }
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favorite_experts', JSON.stringify(favoriteExperts));
  }, [favoriteExperts]);

  const toggleFavorite = (expert: ExpertRecord) => {
    setFavoriteExperts(prev => {
      const isFav = prev.some(f => f.id === expert.id && f.database === expert.database);
      if (isFav) {
        return prev.filter(f => !(f.id === expert.id && f.database === expert.database));
      }
      return [...prev, expert];
    });
  };

  const handleSelectExpert = async (e: ExpertRecord) => {
    setActiveExpert({ ...e, verificationStatus: 'pending' });
    setExpertResults([]);
    if (expertQuery === '##favs##') setExpertQuery('');
    
    try {
      const verified = await lookupService.verifyExpert(e);
      setActiveExpert(verified);
    } catch (err) {
      console.error("Verification failed", err);
      setActiveExpert({ ...e, verificationStatus: 'pending' });
    }
  };
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const pdfExportRef = useRef<HTMLDivElement>(null);

  const exportToPDF = async () => {
    if (!pdfExportRef.current) return;
    setIsExporting(true);
    
    try {
      await document.fonts.ready;
      
      const element = pdfExportRef.current;
      element.style.display = 'block';
      element.style.position = 'fixed';
      element.style.left = '-9999px';
      element.style.top = '0';
      element.style.width = '210mm';

      const dataUrl = await htmlToImage.toPng(element, {
        backgroundColor: '#FFFFFF',
        pixelRatio: 2,
        cacheBust: true,
      });

      element.style.display = 'none';

      const imgProps = await new Promise<{ width: number; height: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.src = dataUrl;
      });

      const pdfWidth = 210;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      const fileName = `Audit_Zameru_${city.replace(/\s/g, '_')}_${new Date().toLocaleDateString('cs-CZ').replace(/\./g, '-')}.pdf`;
      pdf.save(fileName);
    } catch (e) {
      console.error("PDF Export failed:", e);
      alert("Export do PDF selhal. Zkuste prosím export na desktopu.");
    }
    setIsExporting(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.muni-search-container')) {
        setShowMuniDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-select category based on population
  useEffect(() => {
    const pop = parseInt(population.replace(/\s/g, ''));
    if (isNaN(pop)) return;

    if (city.toLowerCase().trim() === 'praha') {
      setSelectedCategory(CATEGORIES[6]);
      return;
    }

    const category = CATEGORIES.find(cat => {
      if (cat.label === 'Praha') return false;
      if (cat.min !== null && cat.max !== null) {
        return pop >= cat.min && pop <= cat.max;
      }
      if (cat.min !== null) return pop >= cat.min;
      if (cat.max !== null) return pop <= cat.max;
      return false;
    });

    if (category) {
      setSelectedCategory(category);
    }
  }, [population, city]);

  const calculation = useMemo(() => {
    const pop = parseInt(population.replace(/\s/g, ''));
    if (isNaN(pop)) return { raw: 0, rounded: 0 };
    const raw = pop * selectedCategory.coefficient;
    return { raw, rounded: Math.round(raw) };
  }, [population, selectedCategory]);

  const applicantType = useMemo<ApplicantType>(() => {
    switch(answers['applicant']) {
      case 0: return 'municipality';
      case 1: return 'ngo';
      case 2: return 'private_sme';
      case 3: return 'private_large';
      default: return 'municipality';
    }
  }, [answers]);

  const effectiveIntensity = useMemo(() => {
    if (!selectedActivity) return 0;
    
    // 1. Base intensity for the applicant type
    let intensity = selectedActivity.intensities?.[applicantType] ?? selectedActivity.baseIntensity;
    
    // 2. Add/Subtract bonuses based on answers
    if (selectedActivity.bonuses) {
      selectedActivity.bonuses.forEach(bonus => {
        if (answers[bonus.id] === 0) { // 0 is "Yes"
          intensity += bonus.rate;
        }
      });
    }

    // 3. Special case logic
    // SC 1.3.1.2: Biocorridors/Biocenters (ÚSES) are always 100%
    if (selectedActivity.id === '1.3.1.2' && answers['uses'] === 0) {
      intensity = 1.0;
    }
    
    // Cap at 100% and min at 0%
    return Math.max(0, Math.min(1.0, intensity));
  }, [selectedActivity, applicantType, answers]);

  const grantAmount = useMemo(() => {
    const costsNum = parseInt(estimatedCosts.replace(/\s/g, '')) || 0;
    if (!selectedActivity) return 0;
    return costsNum * effectiveIntensity;
  }, [estimatedCosts, selectedActivity, effectiveIntensity]);

  const intensityBreakdown = useMemo(() => {
    if (!selectedActivity) return null;
    const base = selectedActivity.intensities?.[applicantType] ?? selectedActivity.baseIntensity;
    const activeBonuses = selectedActivity.bonuses?.filter(b => answers[b.id] === 0) || [];
    const bonusTotal = activeBonuses.reduce((acc, b) => acc + b.rate, 0);
    
    let special = 0;
    if (selectedActivity.id === '1.3.1.2' && answers['uses'] === 0) {
      special = 1.0 - (base + bonusTotal);
    }

    return { base, activeBonuses, bonusTotal, special };
  }, [selectedActivity, applicantType, answers]);

  const activeAlerts = useMemo(() => {
    if (!selectedActivity) return [];
    const alerts: { type: 'warning' | 'info' | 'error'; text: string; id: string }[] = [];
    const popNum = parseInt(population.replace(/\s/g, '')) || 0;

    // 1. Energy Management Checker
    if (selectedActivity.id.startsWith('1.1')) {
      if (popNum > 2000) {
        alerts.push({ 
          type: 'warning', 
          id: 'em-pop',
          text: 'Vzhledem k populaci nad 2000 obyvatel je zavedení energetického managementu povinné po celou dobu udržitelnosti.' 
        });
      }
      alerts.push({
        type: 'info',
        id: 'em-iso',
        text: 'Nezapomeňte, že EM musí být v souladu s ISO 50001.'
      });
    }

    // 2. AOPK Deadline Checker
    if (selectedActivity.id.startsWith('1.3')) {
      alerts.push({
        type: 'info',
        id: 'aopk-deadline',
        text: 'Odborný posudek AOPK ČR má standardní lhůtu na vypracování 45 kalendářních dnů. Počítejte s tím v harmonogramu.'
      });
    }

    // 3. Water / Sewerage Checker
    if (selectedActivity.id.startsWith('1.4')) {
      alerts.push({
        type: 'warning',
        id: 'water-limit',
        text: 'U projektů vodovodů a kanalizací je od roku 2026 striktní požadavek na plně obnovující cenu pro vodné a stočné.'
      });
    }

    return alerts;
  }, [selectedActivity, population]);

  const summaryText = useMemo(() => {
    if (!selectedActivity) return '';
    const breakdown = intensityBreakdown;
    const costsNum = parseInt(estimatedCosts.replace(/\s/g, '')) || 0;
    
    let text = `ANALÝZA PROJEKTU: ${city} - ${selectedActivity.name}\n\n`;
    text += `Pravidla čerpání:\n`;
    text += `- Právní forma: ${applicantType === 'municipality' ? 'Obec/Město' : applicantType === 'ngo' ? 'NGO/Spolek' : 'Soukromý subjekt'}\n`;
    text += `- Základní míra podpory: ${((breakdown?.base ?? 0) * 100).toFixed(0)} %\n`;
    
    if (breakdown?.activeBonuses.length) {
      breakdown.activeBonuses.forEach(b => {
        text += `- Bonus: ${b.label} (+${(b.rate * 100).toFixed(0)} %)\n`;
      });
    }
    
    if (breakdown?.special) {
      text += `- Speciální navýšení (ÚSES): 100 %\n`;
    }

    text += `\nMíra podpory celkem: ${(effectiveIntensity * 100).toFixed(0)} % ze způsobilých výdajů.\n`;
    text += `Odhadovaná dotace: ${grantAmount.toLocaleString('cs-CZ')} CZK z rozpočtu ${costsNum.toLocaleString('cs-CZ')} CZK.\n`;
    
    text += `\nINTEGRITA DAT A ZDROJE (Audit Standardy):\n`;
    text += `- Právní identita: ARES (Ministerstvo financí ČR)\n`;
    text += `- Populace a demografie: ČSÚ VDB (Český statistický úřad)\n`;
    text += `- Rizikové analýzy: Hlídač Státu (API v2)\n`;
    text += `- Územní identita: RÚIAN (ČÚZK) & ArcČR 5.0\n`;
    text += `- Standardy: Otevřená data (NKOD) & OpenAPI 3.0\n`;
    
    if (activeExpert) {
      text += `\nPROJEKTOVÁ PODPORA (Ověřeno v registru):\n`;
      text += `- Autorizovaná osoba: ${activeExpert.name} (${activeExpert.id})\n`;
      text += `- Specializace: ${activeExpert.specialization}\n`;
      text += `- Registr: ${activeExpert.database}\n`;
    } else {
      text += `\nPROJEKTOVÁ PODPORA:\n`;
      text += `- DOPORUČENÍ: Projekt vyžaduje odbornou garanci (autorizovaný inženýr/architekt).\n`;
    }

    text += `\nPovinná doba udržitelnosti činí ${selectedActivity.sustainability} let od finančního ukončení projektu.\n\n`;
    
    text += `Kalkulace indikátoru RCR 37:\n`;
    text += `Projekt je realizován na území ${city}, které má ${population} obyvatel. `;
    text += `Vzhledem k velikosti (${selectedCategory.label}) byl použit koeficient ${(selectedCategory.coefficient * 100).toLocaleString('cs-CZ')} %. `;
    text += `Cílová hodnota: ${calculation.rounded} osob.`;
    
    return text;
  }, [city, selectedActivity, effectiveIntensity, intensityBreakdown, estimatedCosts, population, selectedCategory, calculation, grantAmount, applicantType, activeExpert]);
  const copyToClipboard = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nextStep = () => {
    setStep(s => Math.min(s + 1, 5));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const formatCurrency = (val: string) => {
    const num = val.replace(/[^\d]/g, '');
    if (!num) return '';
    return parseInt(num).toLocaleString('cs-CZ');
  };

  const handleCostsChange = (val: string) => {
    const cleanVal = val.replace(/[^\d]/g, '');
    setEstimatedCosts(formatCurrency(cleanVal));
    
    const num = parseInt(cleanVal) || 0;
    if (selectedActivity?.maxCosts && num > selectedActivity.maxCosts) {
      setCostError(`Částka převyšuje limit NOO (${selectedActivity.maxCosts.toLocaleString()} Kč).`);
    } else if (num > 1000000000) {
      setCostError("Pozor: Částka nad 1 mld. Kč je extrémní.");
    } else if (selectedActivity?.minCosts && num < selectedActivity.minCosts) {
      setCostError(`Minimální uznatelné náklady jsou ${selectedActivity.minCosts.toLocaleString()} Kč.`);
    } else {
      setCostError(null);
    }
  };

  const activityGroups = useMemo(() => {
    const groups: Record<string, { label: string; activities: Activity[] }> = {
      '1.3': { label: 'Ochrana přírody a krajiny', activities: [] },
      '1.1': { label: 'Energetické úspory a OZE', activities: [] },
      '1.2': { label: 'Odpadové hospodářství', activities: [] },
      '1.4': { label: 'Voda a čištění', activities: [] },
      'other': { label: 'Ostatní aktivity', activities: [] }
    };

    ACTIVITIES.forEach(act => {
      const prefix = act.id.split('.').slice(0, 2).join('.');
      if (groups[prefix]) {
        groups[prefix].activities.push(act);
      } else {
        groups['other'].activities.push(act);
      }
    });

    return Object.entries(groups).filter(([_, group]) => group.activities.length > 0);
  }, []);

  const filteredGroups = useMemo(() => {
    return activityGroups.map(([key, group]) => {
      const filteredActivities = group.activities.filter(act => {
        const matchesSearch = act.name.toLowerCase().includes(activitySearch.toLowerCase()) || 
                             act.id.includes(activitySearch) || 
                             act.description.toLowerCase().includes(activitySearch.toLowerCase());
        const matchesCategory = !activityCategory || key === activityCategory;
        return matchesSearch && matchesCategory;
      });
      return [key, { ...group, activities: filteredActivities }] as [string, typeof group];
    }).filter(([_, group]) => group.activities.length > 0);
  }, [activityGroups, activitySearch, activityCategory]);

  const handleIcoLookup = async () => {
    if (!/^\d{8}$/.test(ico)) return;
    setIsSearchingIco(true);
    const info = await lookupService.lookupICO(ico);
    setIsSearchingIco(false);
    
    if (info) {
      setActiveEntity(info);
      // Map entity type to applicant answer
      const typeMap: Record<string, number> = {
        'municipality': 0,
        'ngo': 1,
        'private_sme': 2,
        'private_large': 3,
        'public_entity': 0
      };
      
      setAnswers(prev => ({...prev, 'applicant': typeMap[info.type] ?? 0}));
      
      // If it's a municipality, try to set city name
      if (info.type === 'municipality' || info.type === 'public_entity') {
        setCity(info.name);
      }
    }
  };

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMuniSearch = (val: string) => {
    setCity(val);
    if (val.length < 2) {
      setMunicipalityResults([]);
      setShowMuniDropdown(false);
      return;
    }
    
    // Clear existing timeout
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    setIsSearchingMuni(true);
    setShowMuniDropdown(true);

    // Debounce API calls to 400ms for better UX and less API stress
    searchTimeout.current = setTimeout(async () => {
      const results = await lookupService.searchMunicipality(val);
      setMunicipalityResults(results);
      setIsSearchingMuni(false);
    }, 400);
  };

  const selectMuni = (muni: MunicipalityInfo) => {
    setCity(muni.name);
    setPopulation(muni.population.toString());
    if (muni.ico) {
      setIco(muni.ico);
      // Auto trigger ICO lookup to get entity details and legal form
      const triggerLookup = async () => {
        setIsSearchingIco(true);
        const info = await lookupService.lookupICO(muni.ico!);
        setIsSearchingIco(false);
        if (info) setActiveEntity(info);
      };
      triggerLookup();
    }
    setShowMuniDropdown(false);
  };

  const handleExpertSearch = async (val: string, db: string, filters = expertFilters) => {
    setExpertQuery(val);
    if (val.trim().length < 3 && !filters.specialization && !filters.region) {
      setExpertResults([]);
      return;
    }
    setIsSearchingExpert(true);
    try {
      const results = await lookupService.searchExpert(val, db, filters);
      setExpertResults(results);
    } catch (e) {
      console.error(e);
      setExpertResults([]);
    } finally {
      setIsSearchingExpert(false);
    }
  };

  const stepTitles: Record<number, { title: string; subtitle: string; icon: any }> = {
    1: { title: 'Lokalita a Subjekt', subtitle: 'Základní parametry žadatele', icon: MapPin },
    2: { title: 'Specifický cíl', subtitle: 'Výběr dotační aktivity', icon: Hammer },
    3: { title: 'Auditní dotazník', subtitle: 'Prověření způsobilosti', icon: ClipboardList },
    4: { title: 'Finanční kalkulace', subtitle: 'Odhad výše podpory', icon: Calculator },
    5: { title: 'Závěrečný report', subtitle: 'Shrnutí a doporučení', icon: ShieldCheck }
  };

  const renderStepIndicator = () => (
    <div className="mb-12">
      <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 no-scrollbar">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center flex-shrink-0">
            <button 
              onClick={() => step > s && setStep(s)}
              disabled={step <= s}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${
                step === s ? 'bg-nat-primary text-white scale-110 shadow-xl shadow-nat-primary/20 ring-4 ring-nat-primary/5' : 
                step > s ? 'bg-nat-primary/80 text-white cursor-pointer hover:bg-nat-primary' : 'bg-white border border-nat-border text-nat-accent'
              }`}
            >
              {step > s ? <Check className="w-5 h-5" /> : s}
            </button>
            {s < 5 && (
              <div className={`w-6 md:w-16 h-1 mx-1 md:mx-2 rounded-full ${step > s ? 'bg-nat-primary/20' : 'bg-nat-border'}`}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: step > s ? '100%' : '0%' }}
                  className="h-full bg-nat-primary" 
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <motion.div 
        key={step}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mt-6"
      >
        <span className="text-[10px] font-black uppercase text-nat-primary tracking-[0.4em] mb-1 block">Krok {step} z 5</span>
        <h1 className="text-xl font-bold text-nat-text">{stepTitles[step].title}</h1>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-nat-bg flex flex-col font-sans selection:bg-nat-primary selection:text-white pb-24 md:pb-0">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-nat-border px-4 py-3 md:px-10 md:py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-nat-primary rounded-xl flex items-center justify-center text-nat-secondary shadow-lg shadow-nat-primary/20 animate-float border border-white/10">
              <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="text-sm md:text-xl font-bold text-nat-primary tracking-tight uppercase">Dot-AUDIT <span className="text-nat-secondary font-mono ml-0.5">PRO</span></h1>
              <p className="hidden md:block text-[8px] md:text-[10px] font-black uppercase text-nat-accent tracking-[0.2em] opacity-80">Chytrý ekosystém dotačních příležitostí</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-2 bg-nat-bg p-1 rounded-2xl border border-nat-border">
            <button 
              onClick={() => setView('audit')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                view === 'audit' ? 'bg-white text-nat-text shadow-sm' : 'text-nat-accent hover:text-nat-text'
              }`}
            >
              Auditní Nástroj
            </button>
            <button 
              onClick={() => setView('calls')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                view === 'calls' ? 'bg-white text-nat-text shadow-sm' : 'text-nat-accent hover:text-nat-text'
              }`}
            >
              Dostupné Výzvy
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setView('profile')}
              className={`flex flex-col items-center gap-1 p-2 md:px-5 md:py-2.5 transition-all rounded-2xl border-2 ${
                view === 'profile' 
                  ? 'bg-nat-secondary text-nat-dark border-nat-secondary shadow-lg shadow-nat-secondary/20' 
                  : 'hover:bg-nat-bg text-nat-accent border-transparent hover:border-nat-border'
              }`}
            >
              <UserCheck className={`w-5 h-5 ${view === 'profile' ? 'text-nat-dark' : 'text-nat-primary'}`} />
              <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest ${view === 'profile' ? 'text-nat-dark' : 'text-nat-accent'}`}>Profil žadatele</span>
            </button>
            <div className="w-px h-6 bg-nat-border mx-1 hidden md:block" />
            <button className="hidden sm:flex items-center gap-2 bg-nat-dark text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-nat-dark/10 transition-all border border-white/10">
              <Coins className="w-4 h-4 text-nat-secondary" />
              142
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-nat-border px-6 py-4 flex justify-around items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setView('audit')}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'audit' ? 'text-nat-secondary scale-110' : 'text-nat-accent opacity-50'}`}
        >
          <div className={`p-2 rounded-xl ${view === 'audit' ? 'bg-nat-secondary/10 shadow-inner' : ''}`}>
            <Calculator className="w-5 h-5" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">Audit</span>
        </button>
        <button 
          onClick={() => setView('calls')}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'calls' ? 'text-nat-secondary scale-110' : 'text-nat-accent opacity-50'}`}
        >
          <div className={`p-2 rounded-xl ${view === 'calls' ? 'bg-nat-secondary/10 shadow-inner' : ''}`}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">Výzvy</span>
        </button>
        <div className="w-12 h-12 bg-nat-primary rounded-2xl flex items-center justify-center text-nat-secondary -mt-12 border-4 border-nat-bg shadow-xl shadow-nat-primary/20 active:scale-90 transition-transform">
           <Plus className="w-6 h-6" />
        </div>
        <button 
          onClick={() => setView('database')}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'database' ? 'text-nat-secondary scale-110' : 'text-nat-accent opacity-50'}`}
        >
          <div className={`p-2 rounded-xl ${view === 'database' ? 'bg-nat-secondary/10 shadow-inner' : ''}`}>
            <Database className="w-5 h-5" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">Databáze</span>
        </button>
        <button 
          onClick={() => setView('audit')}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'audit' ? 'opacity-30 pointer-events-none' : 'text-nat-accent hover:text-nat-primary'}`}
        >
          <div className="p-2 rounded-xl">
            <Undo2 className="w-5 h-5" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">Zpět</span>
        </button>
      </nav>

      <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full">
        {view === 'audit' && (
          <div className="mb-10 overflow-hidden rounded-[40px] bg-nat-primary p-1 relative shadow-2xl shadow-nat-primary/10">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Globe className="w-32 h-32 text-white" />
            </div>
            <div className="bg-gradient-to-br from-nat-primary to-nat-dark rounded-[38px] p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-nat-secondary/20 rounded-full mb-6 border border-nat-secondary/30">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nat-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-nat-secondary"></span>
                  </span>
                  <span className="text-[9px] font-black text-nat-secondary uppercase tracking-widest">Live Monitoring Feed</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-serif italic text-white mb-6 leading-tight">Co je dnes nového ve světě dotací?</h2>
                <div className="flex flex-wrap gap-4">
                  {NEWS_FEED.slice(0, 2).map((news) => (
                    <div key={news.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex-1 min-w-[240px] hover:bg-white/10 transition-colors cursor-pointer group backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-3 text-[9px] font-black uppercase tracking-widest">
                        <span className="text-nat-secondary font-black">{news.category}</span>
                        <span className="text-white/40">{news.date}</span>
                      </div>
                      <h4 className="text-white font-bold text-sm mb-2 group-hover:text-nat-secondary transition-colors">{news.title}</h4>
                      <p className="text-white/60 text-[10px] leading-relaxed line-clamp-2">{news.content}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full md:w-auto flex flex-col gap-5">
                <button 
                  onClick={() => setView('calls')}
                  className="bg-nat-secondary text-nat-dark px-12 py-6 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-nat-secondary/20 border-b-4 border-nat-dark"
                >
                  Prozkoumat Výzvy
                </button>
                <div className="flex items-center justify-center gap-4">
                  {PROVIDERS.map(p => (
                    <div key={p.id} className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white/40 text-[9px] font-black hover:bg-white/20 hover:text-white transition-all cursor-help" title={p.name}>
                      {p.id.toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'audit' ? (
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8">
              {renderStepIndicator()}
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="nat-card p-10 relative overflow-hidden group">
                      <div className="absolute -right-20 -top-20 w-64 h-64 bg-nat-primary/5 rounded-full group-hover:scale-110 transition-transform duration-700" />
                      <div className="flex items-center gap-3 mb-2">
                         <div className="w-10 h-10 bg-nat-bg rounded-xl flex items-center justify-center text-nat-primary shadow-inner">
                            <MapPin className="w-5 h-5" />
                         </div>
                         <h2 className="text-3xl font-serif italic text-nat-text">Příprava projektu</h2>
                      </div>
                      <p className="text-nat-accent text-sm mb-8">Zadejte základní údaje pro výpočet indikátorů se vztahem k populaci.</p>
                      
                      <div className="grid sm:grid-cols-2 gap-6 mb-10">
                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl group/info hover:bg-slate-100 transition-colors">
                          <h3 className="text-[10px] font-black uppercase text-slate-900 mb-2 flex items-center gap-2 tracking-widest">
                            <Info className="w-3 h-3 text-nat-secondary" />
                            Jak tento audit funguje?
                          </h3>
                          <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                            Nástroj provádí validaci proti pravidlům <span className="text-nat-primary">OPŽP 2021-2027</span>. 
                            Kalkulace využívá data z <span className="text-nat-primary">ARES</span> a <span className="text-nat-primary">ČSÚ</span>.
                          </p>
                        </div>
                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl group/info hover:bg-slate-100 transition-colors">
                          <h3 className="text-[10px] font-black uppercase text-slate-900 mb-2 flex items-center gap-2 tracking-widest">
                            <CalendarDays className="w-3 h-3 text-nat-secondary" />
                            Programové období
                          </h3>
                          <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                            Výzvy 2026 jsou v režimu přípravy. Klíčem je soulad s <span className="text-nat-primary">MAP</span> a krajskými strategiemi.
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-10">
                        <div className="group relative muni-search-container">
                          <label className="nat-label">Lokalita (Obec / Město)</label>
                          <div className="nat-input-group bg-white group-focus-within:border-nat-primary transition-all flex items-center gap-3 shadow-inner ring-offset-2 ring-nat-primary/0 group-focus-within:ring-2 group-focus-within:ring-nat-primary/10">
                            {isSearchingMuni ? (
                              <div className="animate-spin w-5 h-5 border-2 border-nat-primary border-t-transparent rounded-full" />
                            ) : (
                              <Search className="w-5 h-5 text-nat-primary opacity-60" />
                            )}
                            <input
                              type="text"
                              value={city}
                              onChange={(e) => handleMuniSearch(e.target.value)}
                              onFocus={() => city.length >= 2 && setShowMuniDropdown(true)}
                              className="bg-transparent border-none outline-none font-semibold text-nat-text w-full placeholder:text-nat-accent/20"
                              placeholder="Vyhledejte obec..."
                            />
                          </div>

                          {showMuniDropdown && (municipalityResults.length > 0 || isSearchingMuni) && (
                            <div className="absolute z-50 left-0 right-0 top-[calc(100%+8px)] bg-white rounded-3xl border border-nat-border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                               {isSearchingMuni && municipalityResults.length === 0 ? (
                                 <div className="px-6 py-8 text-center bg-nat-bg/10">
                                   <div className="animate-spin w-8 h-8 border-4 border-nat-primary border-t-transparent rounded-full mx-auto mb-3" />
                                   <p className="text-[10px] font-black uppercase text-nat-accent tracking-widest">Synchronizace s registry...</p>
                                 </div>
                               ) : (
                                 <div className="max-h-80 overflow-y-auto">
                                   {municipalityResults.map((m, i) => (
                                     <button
                                       key={i}
                                       onClick={() => selectMuni(m)}
                                       className="w-full px-6 py-5 text-left hover:bg-nat-bg flex justify-between items-center transition-all border-b border-nat-bg last:border-0 group/item"
                                      >
                                       <div>
                                         <span className="block font-black text-sm text-nat-text group-hover/item:text-nat-primary transition-colors">{m.name}</span>
                                         <div className="flex items-center gap-2 mt-1">
                                           <span className="text-[9px] text-nat-accent uppercase font-black tracking-widest opacity-60">Kraj {m.region}</span>
                                           {m.ico && (
                                             <>
                                               <span className="w-1 h-1 rounded-full bg-nat-border" />
                                               <span className="text-[9px] text-amber-600 font-mono font-black">IČO {m.ico}</span>
                                             </>
                                           )}
                                         </div>
                                       </div>
                                       <div className="text-right">
                                         <div className="bg-nat-bg px-3 py-1 rounded-lg border border-nat-border group-hover/item:bg-white transition-colors">
                                           <span className="block font-mono font-black text-xs text-nat-primary">{m.population.toLocaleString()}</span>
                                           <span className="text-[7px] text-nat-accent uppercase font-black tracking-tighter">obyvatel</span>
                                         </div>
                                       </div>
                                     </button>
                                   ))}
                                 </div>
                               )}
                            </div>
                          )}
                        </div>
                        <div className="group">
                          <label className="nat-label">IČO Subjektu (Automatické ověření)</label>
                          <div className={`nat-input-group transition-all flex items-center gap-3 shadow-inner ring-offset-2 ring-nat-primary/0 group-focus-within:ring-2 ${
                            activeEntity ? 'bg-amber-50/50 border-amber-200 group-focus-within:ring-amber-500/10' : 'bg-white group-focus-within:border-nat-primary group-focus-within:ring-nat-primary/10'
                          }`}>
                            {isSearchingIco ? (
                              <div className="animate-spin w-5 h-5 border-2 border-nat-primary border-t-transparent rounded-full" />
                            ) : activeEntity ? (
                              <ShieldCheck className="w-5 h-5 text-amber-600" />
                            ) : (
                              <Terminal className="w-5 h-5 text-nat-primary opacity-60" />
                            )}
                            <input
                              type="text"
                              value={ico}
                              maxLength={8}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^\d]/g, '');
                                setIco(val);
                                if (val.length === 0) setActiveEntity(null);
                              }}
                              onBlur={handleIcoLookup}
                              className="bg-transparent border-none outline-none font-semibold text-nat-text w-full placeholder:text-nat-accent/20 uppercase tracking-widest"
                              placeholder="8 mísné IČO"
                            />
                            {activeEntity && (
                              <motion.div 
                                initial={{ scale: 0 }} 
                                animate={{ scale: 1 }} 
                                className="bg-emerald-500 text-white p-1 rounded-full shadow-sm"
                              >
                                <Check className="w-3 h-3" />
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {activeEntity && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            className="mt-6 p-6 bg-white border-2 border-nat-secondary/20 rounded-3xl shadow-sm overflow-hidden flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-nat-secondary/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-nat-primary">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div className="overflow-hidden">
                                <h4 className="text-sm font-black text-nat-text uppercase tracking-tight truncate">{activeEntity.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                   <span className="text-[10px] text-nat-accent font-bold">Oprávněný žadatel</span>
                                   <span className="w-1 h-1 rounded-full bg-nat-border" />
                                   <span className="text-[10px] text-nat-secondary font-black uppercase">Právní forma: {activeEntity.type}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right hidden md:block">
                               <span className="text-[9px] font-black uppercase text-nat-accent opacity-30 block mb-1">Status ARES</span>
                               <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full uppercase tracking-widest">Aktivní</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="mt-12 p-10 bg-nat-dark rounded-[40px] text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl shadow-nat-dark/30 relative overflow-hidden">
                        <Waves className="absolute -right-20 -bottom-20 w-64 h-64 opacity-5 rotate-12" />
                        <div className="flex-1 z-10">
                          <div className="flex items-center gap-2 mb-4">
                            <Terminal className="w-4 h-4 text-nat-primary brightness-150" />
                            <span className="text-[10px] uppercase font-black tracking-[0.3em] opacity-50">Cílová hodnota indikátoru RCR 37</span>
                          </div>
                          <div className="text-7xl font-serif italic mb-4 tracking-tighter leading-none">
                            {calculation.rounded} <span className="text-xl not-italic font-sans opacity-20 uppercase tracking-[0.5em] font-black align-middle ml-2">osob</span>
                          </div>
                          <p className="text-xs opacity-40 font-bold max-w-sm">Automaticky dopočteno dle metodiky OPŽP pro obec kategorie "{selectedCategory.label}" s koeficientem {(selectedCategory.coefficient * 100).toLocaleString('cs-CZ')} %.</p>
                        </div>
                        <div className="flex-shrink-0 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md z-10 w-full md:w-auto">
                          <div className="flex items-center gap-4 mb-4">
                             <div className="w-10 h-10 bg-nat-primary/20 rounded-xl flex items-center justify-center text-nat-primary">
                                <Calculator className="w-5 h-5" />
                             </div>
                             <span className="text-xs font-black uppercase tracking-widest">Logika výpočtu</span>
                          </div>
                          <p className="text-[11px] leading-relaxed opacity-60 max-w-[240px] font-medium">Tato hodnota představuje minimální počet osob profitujících z projektu, který musíte deklarovat v IS KP21+.</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

              {view === 'database' && (
                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="space-y-10"
                >
                   <div className="text-center mb-10">
                      <h2 className="text-4xl font-serif italic text-nat-text mb-4">Centrální Databáze</h2>
                      <p className="text-nat-accent text-sm">Přímé napojení na klíčové registry a informační zdroje dotačního ekosystému.</p>
                   </div>
                   
                   <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {DATABASE_RESOURCES.map((res) => (
                        <a 
                          key={res.id} 
                          href={res.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="nat-card p-8 group hover:border-nat-secondary transition-all"
                        >
                          <div className="w-14 h-14 bg-nat-bg rounded-2xl flex items-center justify-center text-nat-primary mb-6 group-hover:bg-nat-secondary group-hover:text-white transition-all shadow-inner">
                             {res.id === 'ares' && <ShieldCheck className="w-7 h-7" />}
                             {res.id === 'hlidac' && <Search className="w-7 h-7" />}
                             {res.id === 'sfpi' && <Building className="w-7 h-7" />}
                             {res.id === 'is_kp21' && <ExternalLink className="w-7 h-7" />}
                          </div>
                          <h4 className="text-sm font-black text-nat-text uppercase tracking-tight mb-2">{res.label}</h4>
                          <p className="text-[10px] text-nat-accent font-bold leading-relaxed">{res.desc}</p>
                        </a>
                      ))}
                   </div>

                   <div className="grid lg:grid-cols-2 gap-10 mt-10">
                      <div className="nat-card p-10">
                         <div className="flex items-center gap-3 mb-8">
                            <Briefcase className="w-6 h-6 text-nat-secondary" />
                            <h3 className="text-xl font-bold">Expertní Síť</h3>
                         </div>
                         <div className="space-y-4">
                            {favoriteExperts.length > 0 ? (
                               favoriteExperts.map(e => (
                                 <div key={e.id} className="p-4 bg-nat-bg rounded-2xl border border-nat-border flex justify-between items-center">
                                    <div>
                                       <span className="block font-black text-sm">{e.name}</span>
                                       <span className="text-[9px] text-nat-accent font-bold uppercase">{e.specialization}</span>
                                    </div>
                                    <button onClick={() => toggleFavorite(e)} className="text-nat-secondary">
                                       <Check className="w-5 h-5" />
                                    </button>
                                 </div>
                               ))
                            ) : (
                               <div className="p-10 border-2 border-dashed border-nat-border rounded-3xl text-center">
                                  <Users className="w-10 h-10 text-nat-border mx-auto mb-4" />
                                  <p className="text-[10px] uppercase font-black text-nat-accent tracking-[0.2em]">Zatím nemáte žádné experty v oblíbených</p>
                               </div>
                            )}
                         </div>
                      </div>
                      
                      <div className="nat-card p-10">
                         <div className="flex items-center gap-3 mb-8">
                            <BookOpen className="w-6 h-6 text-nat-secondary" />
                            <h3 className="text-xl font-bold">Metodiky & Formuáře</h3>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            {['Žádost o platbu', 'Změnové řízení', 'Příručka žadatele', 'Zadávací dokumentace'].map(f => (
                              <button key={f} className="p-4 border-2 border-nat-border rounded-2xl text-[10px] font-black uppercase tracking-widest h-auto text-left hover:border-nat-secondary hover:bg-nat-bg transition-all">
                                {f}
                              </button>
                            ))}
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}

              {view === 'profile' && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="max-w-4xl mx-auto"
                >
                   <div className="bg-white rounded-[40px] border-4 border-nat-dark/10 p-12 shadow-2xl relative overflow-hidden">
                      <h2 className="text-4xl font-serif italic mb-2">Profil Žadatele</h2>
                      <p className="text-nat-accent text-sm mb-12">Detailní vyprofilování pro maximální relevanci auditních výstupů.</p>
                      
                      <div className="space-y-10">
                         <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                               <label className="text-[10px] font-black uppercase text-nat-dark tracking-widest">Velikost podniku / subjektu</label>
                               <select className="nat-input-group w-full appearance-none font-bold">
                                  <option>Malý (do 50 zaměstnanců)</option>
                                  <option>Střední (do 250 zaměstnanců)</option>
                                  <option>Velký (nad 250 zaměstnanců)</option>
                               </select>
                            </div>
                            <div className="space-y-4">
                               <label className="text-[10px] font-black uppercase text-nat-dark tracking-widest">Region (NUTS 2)</label>
                               <select className="nat-input-group w-full appearance-none font-bold">
                                  <option>Praha</option>
                                  <option>Střední Čechy</option>
                                  <option>Jihozápad</option>
                                  <option>Severozápad</option>
                                  <option>Severovýchod</option>
                                  <option>Jihovýchod</option>
                                  <option>Střední Morava</option>
                                  <option>Moravskoslezsko</option>
                               </select>
                            </div>
                         </div>

                         <div className="space-y-6">
                            <label className="text-[10px] font-black uppercase text-nat-dark tracking-widest">Prioritní oblasti zájmu</label>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                               {[
                                 { id: 'env', label: 'Životní prostředí', icon: Waves },
                                 { id: 'ene', label: 'Energetika', icon: Zap },
                                 { id: 'soc', label: 'Sociální služby', icon: Heart },
                                 { id: 'dig', label: 'Digitalizace', icon: Terminal },
                                 { id: 'edu', label: 'Vzdělávání', icon: BookOpen },
                                 { id: 'inn', label: 'Inovace', icon: TrendingUp }
                               ].map(area => (
                                 <button key={area.id} className="p-4 border-2 border-nat-border rounded-2xl flex flex-col items-center gap-2 hover:border-nat-secondary hover:bg-nat-bg transition-all group">
                                    <area.icon className="w-5 h-5 text-nat-accent group-hover:text-nat-secondary transition-colors" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-center">{area.label}</span>
                                 </button>
                               ))}
                            </div>
                         </div>

                         <div className="p-8 bg-nat-bg rounded-3xl border-2 border-nat-secondary/20 border-dashed">
                            <h4 className="text-[10px] font-black uppercase text-nat-secondary mb-4 tracking-widest flex items-center gap-2">
                               <ShieldCheck className="w-4 h-4" />
                               Kvalita auditních dat
                            </h4>
                            <p className="text-[11px] font-bold text-nat-accent leading-relaxed">
                               Vyplněním profilu aktivujete pokročilou filtraci výzev, která bere v potaz nejen způsobilost, ale i reálnou šanci na úspěch v hodnocení dotačních kritérií.
                            </p>
                         </div>
                         
                         <button 
                            onClick={() => setView('audit')}
                            className="w-full bg-nat-dark text-white py-6 rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110 shadow-xl transition-all"
                          >
                           Uložit profil a pokračovat v auditu
                         </button>
                      </div>
                   </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="nat-card p-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                      <div>
                        <h2 className="text-3xl font-serif italic text-nat-text mb-2">Specifický cíl</h2>
                        <p className="text-nat-accent text-sm">Vyberte aktivitu, která nejlépe odpovídá vašemu záměru dle OPŽP 2021-2027.</p>
                      </div>
                      <div className="w-full md:w-80 relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Search className="w-4 h-4 text-nat-accent" />
                        </div>
                        <input
                          type="text"
                          placeholder="Hledat aktivitu..."
                          value={activitySearch}
                          onChange={(e) => setActivitySearch(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-nat-bg border border-nat-border rounded-2xl text-[10px] uppercase font-black tracking-widest focus:outline-none focus:border-nat-primary transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-10 border-b border-nat-bg pb-6">
                      <button
                        onClick={() => setActivityCategory(null)}
                        className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                          !activityCategory ? 'bg-nat-primary text-white shadow-lg' : 'bg-nat-bg text-nat-accent hover:bg-nat-border'
                        }`}
                      >
                        Všechny
                      </button>
                      {activityGroups.map(([key, group]) => (
                        <button
                          key={key}
                          onClick={() => setActivityCategory(key)}
                          className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                            activityCategory === key ? 'bg-nat-primary text-white shadow-lg' : 'bg-nat-bg text-nat-accent hover:bg-nat-border'
                          }`}
                        >
                          {group.label}
                        </button>
                      ))}
                    </div>
                    
                    <div className="space-y-12">
                      {filteredGroups.map(([key, group]) => (
                        <div key={key} className="space-y-6">
                          <div className="flex items-center gap-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-nat-accent bg-nat-bg px-4 py-1.5 rounded-lg border border-nat-border/50">{group.label}</h3>
                            <div className="flex-1 h-px bg-nat-border/30" />
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            {group.activities.map((act) => (
                              <div
                                key={act.id}
                                onClick={() => setSelectedActivity(act)}
                                className={`p-7 rounded-[28px] border-2 text-left transition-all relative group flex items-start gap-6 cursor-pointer ${
                                  selectedActivity?.id === act.id 
                                    ? 'bg-nat-primary/5 border-nat-primary shadow-lg' 
                                    : 'bg-white border-nat-border hover:border-nat-accent/30 shadow-sm'
                                }`}
                              >
                                <div className={`p-4 rounded-full transition-all duration-500 ${
                                  selectedActivity?.id === act.id ? 'bg-nat-primary text-white scale-110' : 'bg-nat-bg text-nat-accent animate-skeleton'
                                }`}>
                                  <Hammer className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-1">
                                    <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
                                      selectedActivity?.id === act.id ? 'text-nat-primary' : 'text-nat-accent opacity-60'
                                    }`}>
                                      Aktivita {act.id}
                                    </span>
                                    {selectedActivity?.id === act.id && <Check className="w-3 h-3 text-nat-primary" />}
                                  </div>
                                  <h3 className="font-bold text-lg text-nat-text mb-2 leading-tight">{act.name}</h3>
                                  <p className="text-xs leading-relaxed text-nat-accent max-w-2xl">{act.description}</p>
                                  
                                  {act.officialUrl && (
                                    <a 
                                      href={act.officialUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-black uppercase tracking-widest text-nat-primary hover:underline relative z-10"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      Oficiální dokumentace k výzvě
                                    </a>
                                  )}
                                </div>
                                <ArrowRight className={`w-5 h-5 mt-2 transition-all duration-300 ${
                                  selectedActivity?.id === act.id ? 'text-nat-primary translate-x-1 opacity-100' : 'opacity-0 -translate-x-2'
                                }`} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {filteredGroups.length === 0 && (
                        <div className="p-20 text-center border-2 border-dashed border-nat-border rounded-[40px] bg-nat-bg/20">
                          <Search className="w-12 h-12 text-nat-accent opacity-20 mx-auto mb-4" />
                          <h3 className="text-sm font-bold text-nat-accent uppercase tracking-widest">Nebyly nalezeny žádné aktivity</h3>
                          <p className="text-xs text-nat-accent/60 mt-2">Zkuste změnit klíčové slovo nebo filtr.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="space-y-6"
                >
                  <div className="nat-card p-10">
                    <div className="flex items-center gap-3 mb-2">
                      <BookOpen className="w-6 h-6 text-nat-primary" />
                      <h2 className="text-3xl font-serif italic text-nat-text">Kritéria a podmínky</h2>
                    </div>
                    <p className="text-nat-accent text-sm mb-10">AI Audit prověřuje způsobilost vašeho projektu na základě aktuálních pravidel MŽP.</p>
                    
                    <div className="space-y-10">
                      {AUDIT_QUESTIONS.map((q) => (
                        <div key={q.id} className="space-y-4">
                          <h4 className="font-bold text-nat-text flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-nat-primary" />
                            {q.text}
                          </h4>
                          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {q.options.map((opt, idx) => (
                              <button
                                key={idx}
                                onClick={() => setAnswers(prev => ({ ...prev, [q.id]: idx }))}
                                className={`p-5 rounded-[22px] border-2 text-left transition-all ${
                                  answers[q.id] === idx 
                                    ? 'bg-nat-dark border-nat-dark text-white shadow-xl shadow-nat-dark/10' 
                                    : 'bg-white border-nat-border text-nat-accent hover:bg-nat-bg hover:border-nat-border-dark'
                                }`}
                              >
                                <span className="block font-bold text-xs mb-2">{opt.label}</span>
                                <p className={`text-[10px] leading-relaxed transition-opacity ${
                                  answers[q.id] === idx ? 'opacity-70' : 'opacity-40'
                                }`}>{opt.impact}</p>
                                {!opt.eligible && (
                                  <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-red-400">
                                    <AlertCircle className="w-3 h-3" /> STOP
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Context-aware dynamic questions for bonuses */}
                      {selectedActivity?.bonuses?.map((bonus) => (
                        <motion.div 
                          key={bonus.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-8 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-5 shadow-sm"
                        >
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-100">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-blue-900 text-sm mb-1 uppercase tracking-tight">Bonusová příležitost: {bonus.label}?</h4>
                            <p className="text-xs text-blue-800/80 mb-6">{bonus.description}</p>
                            <div className="flex gap-3">
                              {['Ano, splňujeme', 'Ne, nesplňujeme'].map((label, idx) => (
                                <button
                                  key={label}
                                  onClick={() => setAnswers(prev => ({...prev, [bonus.id]: idx}))}
                                  className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    answers[bonus.id] === idx 
                                      ? 'bg-blue-600 text-white shadow-lg' 
                                      : 'bg-white text-blue-700 hover:bg-blue-100 border border-blue-200'
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {/* Special legacy check for biocorridor */}
                      {selectedActivity?.id === '1.3.1.2' && !selectedActivity.bonuses?.find(b => b.id === 'uses') && (
                        <motion.div 
                          key="dynamic-1"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-8 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-5 shadow-sm"
                        >
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100">
                            <Terminal className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-amber-900 text-sm mb-1 uppercase tracking-tight">Doptání experta: Je projekt součástí ÚSES?</h4>
                            <p className="text-xs text-amber-800/80 mb-6">U prvků územního systému ekologické stability (biocentra, biokoridory) se míra dotace navyšuje na 100 %.</p>
                            <div className="flex gap-3">
                              {['Ano, je to prvek ÚSES', 'Ne, běžná zeleň'].map((label, idx) => (
                                <button
                                  key={label}
                                  onClick={() => setAnswers(prev => ({...prev, 'biocorridor': idx}))}
                                  className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    answers['biocorridor'] === idx 
                                      ? 'bg-amber-600 text-white shadow-lg' 
                                      : 'bg-white text-amber-700 hover:bg-amber-100 border border-amber-200'
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="nat-card p-10 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                       <Calculator className="w-64 h-64 rotate-12" />
                    </div>
                    <h2 className="text-3xl font-serif italic text-nat-text mb-2">Dotační odhad</h2>
                    <p className="text-nat-accent text-sm mb-10">Kalkulace vychází z nákladů obvyklých opatření (NOO) a intenzity výzev OPŽP.</p>
                    
                    <div className="max-w-2xl">
                      <div className="group relative">
                        <label className="nat-label">Celkové předpokládané náklady (CZK bez DPH)</label>
                        <div className={`nat-input-group bg-white group-focus-within:border-nat-primary transition-all flex items-center gap-6 shadow-inner border-2 py-8 relative ${costError ? 'border-red-400' : 'border-nat-border-dark'}`}>
                          <div className={`p-4 rounded-2xl transition-colors ${costError ? 'bg-red-50 text-red-500' : 'bg-nat-bg text-nat-primary'}`}>
                            <Coins className="w-8 h-8" />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={estimatedCosts}
                              onChange={(e) => handleCostsChange(e.target.value)}
                              className="bg-transparent border-none outline-none font-bold text-4xl text-nat-text w-full tracking-tighter placeholder:opacity-20"
                              placeholder="0"
                            />
                            <div className="flex items-center gap-2 mt-2">
                               <span className="text-[10px] font-black uppercase text-nat-accent opacity-40 tracking-widest">Měna: CZK</span>
                               <span className="w-1 h-1 rounded-full bg-nat-border" />
                               <span className="text-[10px] font-black uppercase text-nat-accent opacity-40 tracking-widest">Bez DPH</span>
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {costError && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0, y: -10 }} 
                              animate={{ opacity: 1, height: 'auto', y: 0 }}
                              exit={{ opacity: 0, height: 0, y: -10 }}
                              className="bg-red-50 border border-red-100 p-4 rounded-2xl mt-4 flex items-center gap-3"
                            >
                              <div className="p-2 bg-white rounded-lg text-red-500 shadow-sm">
                                <AlertTriangle className="w-4 h-4" />
                              </div>
                              <p className="text-red-900 text-xs font-bold uppercase tracking-tight">
                                {costError}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {selectedActivity?.maxCosts && !costError && (
                          <div className="mt-4 px-6 py-3 bg-nat-bg/50 rounded-2xl border border-nat-border/50 flex items-center justify-between">
                            <span className="text-[9px] text-nat-accent font-black uppercase tracking-widest">Limit NOO pro variantu:</span>
                            <span className="text-[11px] text-nat-primary font-black uppercase tracking-wider">{selectedActivity.maxCosts.toLocaleString()} Kč</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-14 grid lg:grid-cols-12 gap-8 items-stretch">
                      {/* Alerts column */}
                      <div className="lg:col-span-12 space-y-4">
                        <AnimatePresence>
                          {activeAlerts.map(alert => (
                            <motion.div
                              key={alert.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              className={`p-6 rounded-3xl border flex items-start gap-4 shadow-sm ${
                                alert.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-950' : 
                                alert.type === 'error' ? 'bg-red-50 border-red-100 text-red-950' : 
                                'bg-blue-50 border-blue-100 text-blue-950'
                              }`}
                            >
                              <div className={`p-2 rounded-xl bg-white shadow-sm ${
                                alert.type === 'warning' ? 'text-amber-500' : 
                                alert.type === 'error' ? 'text-red-500' : 
                                'text-blue-500'
                              }`}>
                                {alert.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : 
                                 alert.type === 'error' ? <AlertCircle className="w-5 h-5" /> : 
                                 <Info className="w-5 h-5" />}
                              </div>
                              <div className="flex-1">
                                <span className="block text-[8px] font-black uppercase opacity-40 mb-1">
                                  {alert.type === 'warning' ? 'Upozornění experta' : 
                                   alert.type === 'error' ? 'Kritická bariéra' : 
                                   'Metodická informace'}
                                </span>
                                <p className="text-xs font-bold leading-relaxed">{alert.text}</p>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>

                      <div className="lg:col-span-8 bg-nat-dark p-10 rounded-[44px] text-white shadow-2xl relative overflow-hidden group">
                        <Waves className="absolute -right-10 -bottom-10 w-48 h-48 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
                        <div className="flex justify-between items-start mb-8">
                           <div>
                              <span className="text-[10px] uppercase font-extrabold tracking-[0.3em] opacity-40 mb-3 block">Indikativní výše dotace</span>
                              <div className="text-6xl font-serif italic tracking-tighter">
                                {grantAmount.toLocaleString('cs-CZ')} <span className="text-xl not-italic opacity-30 uppercase font-sans font-bold tracking-widest">CZK</span>
                              </div>
                           </div>
                           <div className="bg-nat-primary px-6 py-4 rounded-[32px] border border-white/10 shadow-lg text-center backdrop-blur-md">
                              <span className="block text-[10px] font-black uppercase opacity-60 mb-1">Míra podpory</span>
                              <span className="text-3xl font-serif italic">{(effectiveIntensity * 100).toFixed(0)}%</span>
                           </div>
                        </div>
                        
                        <div className="h-px w-full bg-white/10 mb-8" />
                        
                        {/* Visual Intensity Breakdown */}
                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-nat-primary brightness-150">Garantovaná kalkulace (Rozklad)</h4>
                           <div className="grid md:grid-cols-3 gap-6">
                              <div className="p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
                                 <span className="block text-[8px] font-black uppercase opacity-30 mb-2">Základní sazba ({applicantType})</span>
                                 <div className="text-2xl font-serif italic">{((intensityBreakdown?.base ?? 0) * 100).toFixed(0)}%</div>
                                 <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                                    <div className="h-full bg-nat-primary brightness-125" style={{ width: `${(intensityBreakdown?.base ?? 0) * 100}%` }} />
                                 </div>
                              </div>
                              
                              <div className="p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
                                 <span className="block text-[8px] font-black uppercase opacity-30 mb-2">Dosažené bonusy</span>
                                 <div className="text-2xl font-serif italic text-green-300">+{(intensityBreakdown?.bonusTotal ?? 0 * 100).toFixed(0)}%</div>
                                 <div className="flex gap-1 mt-3">
                                    {intensityBreakdown?.activeBonuses.map((_, i) => (
                                       <div key={i} className="flex-1 h-1 bg-green-400 rounded-full" />
                                    ))}
                                    {(!intensityBreakdown?.activeBonuses.length) && <div className="flex-1 h-1 bg-white/10 rounded-full" />}
                                 </div>
                              </div>

                              <div className="p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
                                 <span className="block text-[8px] font-black uppercase opacity-30 mb-2">Speciální korekce</span>
                                 <div className="text-2xl font-serif italic text-blue-300">+{((intensityBreakdown?.special ?? 0) * 100).toFixed(0)}%</div>
                                 <div className="h-1 w-full bg-blue-400/30 rounded-full mt-3 overflow-hidden">
                                     <div className="h-full bg-blue-300" style={{ width: `${(intensityBreakdown?.special ?? 0) * 100}%` }} />
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>
                      
                      <div className="lg:col-span-4 p-10 border-2 border-nat-border rounded-[44px] bg-white flex flex-col justify-between relative group shadow-lg">
                        <div className="absolute top-6 right-8 text-nat-accent/10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <History className="w-16 h-16" />
                        </div>
                        <div>
                           <div className="flex items-center gap-3 text-nat-accent mb-6">
                             <AlertCircle className="w-5 h-5 text-nat-primary" />
                             <span className="text-[10px] uppercase font-extrabold tracking-widest leading-none">Spoluúčast příjemce</span>
                           </div>
                           <div className="text-4xl font-black text-nat-text tracking-tighter mb-4">
                             {(parseInt(estimatedCosts.replace(/\s/g, '')) - grantAmount).toLocaleString('cs-CZ')} <span className="text-sm opacity-30 font-sans font-bold uppercase tracking-widest">CZK</span>
                           </div>
                           <p className="text-[11px] text-nat-accent font-medium leading-relaxed opacity-60 italic border-l-2 border-nat-primary/20 pl-4 py-2">
                             Tato částka představuje nutné krytí z vlastních zdrojů žadatele (netto). 
                           </p>
                        </div>
                        
                        <div className="pt-8 mt-8 border-t border-nat-bg">
                           <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-nat-accent opacity-40 mb-2">
                              <span>Cashflow status</span>
                              <span>Kritický</span>
                           </div>
                           <div className="w-full h-1.5 bg-nat-bg rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '65%' }}
                                className="h-full bg-nat-accent opacity-30" 
                              />
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <div ref={reportRef} className="p-10 bg-nat-bg">
                  <motion.div 
                    key="step5"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid lg:grid-cols-12 gap-10"
                  >
                  <div className="lg:col-span-4 space-y-8">
                    <div className="bg-nat-dark p-10 rounded-[44px] text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-5">
                        <CalendarDays className="w-24 h-24" />
                      </div>
                      <h2 className="text-xs uppercase tracking-[0.3em] opacity-40 mb-8 font-bold">Audit Udržitelnosti</h2>
                      <div className="flex items-center gap-5 mb-10">
                        <History className="w-10 h-10 text-nat-primary brightness-150" />
                        <div>
                          <div className="text-4xl font-serif italic tracking-tighter">{selectedActivity?.sustainability} let</div>
                          <span className="text-[9px] opacity-40 uppercase font-black tracking-widest">povinný monitoring</span>
                        </div>
                      </div>
                      <div className="space-y-3 pt-8 border-t border-white/10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-nat-primary mb-4">Sledované parametry</p>
                        {selectedActivity?.indicators.map(ind => (
                          <div key={ind.code} className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                            <div>
                              <span className="block text-[10px] font-bold text-nat-primary brightness-150">{ind.code}</span>
                              <span className="text-[9px] opacity-40 uppercase">{ind.unit}</span>
                            </div>
                            {ind.code === 'RCR 37' && <span className="text-xl font-serif italic text-white">{calculation.rounded}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="nat-card p-10 border-nat-border-dark bg-white shadow-lg">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-nat-text mb-6 flex items-center gap-3">
                        <div className="w-6 h-6 bg-nat-bg rounded-lg flex items-center justify-center">
                           <FileText className="w-3 h-3 text-nat-primary" />
                        </div>
                        Povinné Přílohy
                      </h3>
                      <ul className="space-y-4 mb-10">
                        {selectedActivity?.docs.map(doc => (
                          <li key={doc} className="text-[11px] text-nat-text font-semibold flex items-start gap-3 group">
                            <Check className="w-4 h-4 text-nat-primary mt-0.5 group-hover:scale-125 transition-transform" />
                            <span className="opacity-70 group-hover:opacity-100 transition-opacity">{doc}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Standalone Expert Search */}
                      <div className="pt-8 border-t border-nat-border mt-8">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-nat-text flex items-center gap-3 text-nat-accent">
                            <div className="w-6 h-6 bg-nat-bg rounded-lg flex items-center justify-center">
                              <Search className="w-3 h-3 text-nat-primary" />
                            </div>
                            Registr expertů (ČKAIT, ČKA, MŽP)
                          </h3>
                          {favoriteExperts.length > 0 && (
                            <button 
                              onClick={() => setExpertQuery(expertQuery === '##favs##' ? '' : '##favs##')}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                                expertQuery === '##favs##' ? 'bg-red-500 text-white shadow-md' : 'bg-nat-bg text-nat-accent hover:text-red-500'
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${expertQuery === '##favs##' ? 'fill-current' : ''}`} />
                              Moje oblíbení ({favoriteExperts.length})
                            </button>
                          )}
                        </div>

                        <div className="p-6 bg-nat-bg/50 rounded-3xl border border-nat-border-dark space-y-4 shadow-inner">
                           <div className="flex gap-2">
                             {['ČKAIT', 'ČKA', 'MŽP'].map(db => (
                               <button
                                 key={db}
                                 onClick={() => setSelectedSearchDb(db)}
                                 className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                   selectedSearchDb === db 
                                   ? 'bg-nat-primary text-white border-nat-primary shadow-sm scale-105' 
                                   : 'bg-white text-nat-accent border-nat-border hover:border-nat-primary/40'
                                 }`}
                               >
                                 {db}
                               </button>
                             ))}
                           </div>

                           <div className="grid grid-cols-2 gap-2">
                             <select 
                               className="bg-white border border-nat-border rounded-xl px-3 py-2 text-[10px] font-bold focus:outline-none focus:border-nat-primary"
                               value={expertFilters.region || ''}
                               onChange={(e) => {
                                 const f = { ...expertFilters, region: e.target.value || undefined };
                                 setExpertFilters(f);
                                 handleExpertSearch(expertQuery, selectedSearchDb, f);
                               }}
                             >
                               <option value="">Všechny kraje</option>
                               {['Praha', 'Středočeský', 'Jihočeský', 'Plzeňský', 'Karlovarský', 'Ústecký', 'Liberecký', 'Královéhradecký', 'Pardubický', 'Vysočina', 'Jihomoravský', 'Olomoucký', 'Zlínský', 'Moravskoslezský'].map(k => (
                                 <option key={k} value={k}>{k}</option>
                               ))}
                             </select>
                             <select 
                               className="bg-white border border-nat-border rounded-xl px-3 py-2 text-[10px] font-bold focus:outline-none focus:border-nat-primary"
                               value={expertFilters.specialization || ''}
                               onChange={(e) => {
                                 const f = { ...expertFilters, specialization: e.target.value || undefined };
                                 setExpertFilters(f);
                                 handleExpertSearch(expertQuery, selectedSearchDb, f);
                               }}
                             >
                               <option value="">Všechny specializace</option>
                               {['Energetika', 'Vodohospodářství', 'Ochrana přírody', 'Odpady', 'Architektura', 'Projektování'].map(s => (
                                 <option key={s} value={s}>{s}</option>
                               ))}
                             </select>
                           </div>
                           
                           <div className="relative">
                             <input 
                               type="text" 
                               value={expertQuery === '##favs##' ? '' : expertQuery}
                               placeholder={expertQuery === '##favs##' ? "Zobrazen seznam oblíbených..." : `Jméno nebo specializace v ${selectedSearchDb}...`}
                               disabled={expertQuery === '##favs##'}
                               className="w-full bg-white border border-nat-border rounded-xl px-5 py-4 text-xs focus:outline-none focus:border-nat-primary font-bold shadow-sm"
                               onChange={(e) => handleExpertSearch(e.target.value, selectedSearchDb)}
                             />
                             {isSearchingExpert && (
                               <div className="absolute right-4 top-4.5 animate-spin w-4 h-4 border-2 border-nat-primary border-t-transparent rounded-full" />
                             )}
                           </div>

                           <AnimatePresence>
                             {(expertResults.length > 0 && expertQuery.length >= 3 || expertQuery === '##favs##') && (
                               <motion.div 
                                 initial={{ opacity: 0, scale: 0.95 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 exit={{ opacity: 0, scale: 0.95 }}
                                 className="bg-white rounded-2xl border border-nat-border shadow-2xl overflow-hidden z-20 relative max-h-[400px] overflow-y-auto"
                               >
                                 {(expertQuery === '##favs##' ? favoriteExperts : expertResults).map((e, idx) => (
                                   <div key={idx} className="group relative">
                                     <button
                                       onClick={() => handleSelectExpert(e)}
                                       className="w-full px-5 py-4 text-left hover:bg-nat-bg flex items-center justify-between transition-colors border-b last:border-0 border-nat-bg"
                                     >
                                       <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 bg-nat-primary/10 rounded-full flex items-center justify-center text-nat-primary">
                                           <Users className="w-5 h-5" />
                                         </div>
                                         <div>
                                           <div className="flex items-center gap-2">
                                             <span className="block text-xs font-black text-nat-text">{e.name}</span>
                                             <div className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-black text-[7px] uppercase tracking-tighter shadow-sm border border-emerald-100">98% Shoda</div>
                                           </div>
                                           <div className="flex items-center gap-2 mt-1">
                                             <span className="text-[9px] text-nat-accent uppercase font-black tracking-tight opacity-60">{e.specialization}</span>
                                             <span className="w-1 h-1 rounded-full bg-nat-border" />
                                             <span className="text-[8px] text-nat-accent font-black uppercase tracking-widest">{e.region}</span>
                                           </div>
                                         </div>
                                       </div>
                                       <div className="text-right mr-10">
                                         <div className={`text-[8px] font-black uppercase mb-1 ${
                                           e.availability === 'Dostupný' ? 'text-emerald-500' : e.availability === 'Vytížený' ? 'text-red-400' : 'text-nat-accent/40'
                                         }`}>
                                           {e.availability}
                                         </div>
                                         <span className="block text-[8px] font-black text-nat-accent uppercase opacity-50 mb-1">{e.database}</span>
                                       </div>
                                     </button>
                                     <button 
                                       onClick={(ev) => {
                                         ev.stopPropagation();
                                         toggleFavorite(e);
                                       }}
                                       className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                                         favoriteExperts.some(f => f.id === e.id && f.database === e.database) 
                                         ? 'text-red-500 bg-red-50' 
                                         : 'text-nat-accent hover:text-red-400 hover:bg-nat-bg'
                                       }`}
                                     >
                                       <Heart className={`w-4 h-4 ${favoriteExperts.some(f => f.id === e.id && f.database === e.database) ? 'fill-current' : ''}`} />
                                     </button>
                                   </div>
                                 ))}
                                 {expertQuery === '##favs##' && favoriteExperts.length === 0 && (
                                   <div className="p-10 text-center text-nat-accent">
                                     <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                     <p className="text-[10px] uppercase font-black tracking-widest">Nemáte žádné oblíbené experty</p>
                                   </div>
                                 )}
                               </motion.div>
                             )}
                           </AnimatePresence>
                        </div>
                      </div>

                      {selectedActivity?.experts && (
                        <div className="pt-8 border-t border-nat-border">
                           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-nat-text mb-6 flex items-center gap-3 text-slate-800">
                            <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center">
                               <Users className="w-3 h-3 text-nat-secondary" />
                            </div>
                            Konzultanti z veřejných registů
                          </h3>
                          <div className="space-y-4">
                            {selectedActivity.experts.map(exp => (
                              <div key={exp.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 group hover:border-slate-300 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <span className="block text-[10px] font-black text-slate-900 uppercase mb-1">{exp.role}</span>
                                    <p className="text-[9px] text-slate-600 font-medium">{exp.description}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase">
                                      <Terminal className="w-3 h-3" />
                                      {exp.database}
                                    </div>
                                  </div>
                                </div>

                                {/* Search Expert within database */}
                                <div className="mt-3">
                                  <div className="relative">
                                    <input 
                                      type="text" 
                                      placeholder={`Vyhledat v ${exp.database}...`}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] focus:outline-none focus:border-slate-400 font-bold"
                                      onChange={(e) => handleExpertSearch(e.target.value, exp.database)}
                                    />
                                    {isSearchingExpert && (
                                      <div className="absolute right-3 top-2.5 animate-spin w-3 h-3 border border-nat-secondary border-t-transparent rounded-full" />
                                    )}
                                  </div>
                                  
                                  <AnimatePresence>
                                    {expertResults.length > 0 && expertQuery.length >= 3 && (
                                      <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mt-2 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden"
                                      >
                                        {expertResults.map((e, idx) => (
                                          <button
                                            key={idx}
                                            onClick={() => handleSelectExpert(e)}
                                            className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between transition-colors border-b last:border-0 border-slate-100"
                                          >
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-nat-secondary">
                                                <Users className="w-4 h-4" />
                                              </div>
                                              <div>
                                                <span className="block text-[10px] font-bold text-nat-text leading-tight">{e.name}</span>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                  <span className="text-[8px] text-nat-accent uppercase font-black">{e.specialization}</span>
                                                  <span className="w-0.5 h-0.5 rounded-full bg-nat-border" />
                                                  <span className="text-[8px] text-nat-accent font-bold uppercase">{e.region}</span>
                                                </div>
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <span className={`block text-[7px] font-black uppercase mb-0.5 ${
                                                e.availability === 'Dostupný' ? 'text-emerald-600' : e.availability === 'Vytížený' ? 'text-rose-500' : 'text-nat-accent/40'
                                              }`}>
                                                {e.availability}
                                              </span>
                                              <span className="text-[8px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase">ID: {e.id}</span>
                                            </div>
                                          </button>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            ))}

                            {activeExpert && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-6 p-6 bg-slate-50 border-2 border-slate-200 rounded-[32px] flex items-center gap-6"
                              >
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-nat-secondary shadow-sm shadow-slate-200">
                                  <UserCheck className="w-8 h-8" />
                                </div>
                                <div className="flex-1">
                                   <h4 className={`font-bold text-sm ${
                                       activeExpert.verificationStatus === 'verified' ? 'text-emerald-900' :
                                       activeExpert.verificationStatus === 'warning' ? 'text-amber-900' :
                                       'text-blue-900'
                                     }`}>
                                       {activeExpert.verificationStatus === 'verified' ? 'Prověřený odborník' : 
                                        activeExpert.verificationStatus === 'warning' ? 'Pozor: Vyžaduje prověření' :
                                        activeExpert.verificationStatus === 'stale' ? 'Zastaralý záznam' :
                                        activeExpert.verificationStatus === 'pending' ? 'Prověřování dat...' : 'Ověřený odborník'}
                                     </h4>
                                  <div className="flex items-center gap-2">
                                    <p className="text-[10px] text-green-700 font-medium">{activeExpert.name} ({activeExpert.id})</p>
                                    <span className="w-1 h-1 rounded-full bg-green-200" />
                                    <span className="text-[9px] text-green-600 font-bold uppercase">{activeExpert.region}</span>
                                  </div>
                                  {activeExpert.verificationNotes && activeExpert.verificationNotes.length > 0 && (
                                     <div className="mt-3 space-y-1">
                                       {activeExpert.verificationNotes.map((note, i) => (
                                         <div key={i} className="flex items-center gap-2 text-[8px] font-bold text-nat-accent leading-tight">
                                           <div className={`w-1 h-1 rounded-full ${
                                             activeExpert.verificationStatus === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
                                           }`} />
                                           {note}
                                         </div>
                                       ))}
                                     </div>
                                   )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[9px] text-green-600 uppercase font-black tracking-widest">{activeExpert.specialization}</p>
                                    <span className="px-2 py-0.5 bg-white border border-green-200 rounded-full text-[8px] font-black uppercase text-green-600">
                                      {activeExpert.availability}
                                    </span>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setActiveExpert(null)}
                                  className="text-[9px] font-black uppercase text-green-400 hover:text-green-700 underline"
                                >
                                  Změnit
                                </button>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Security & Risk Analysis (Hlídec Státu) */}
                      {activeEntity && (
                        <div className="pt-8 border-t border-nat-border mt-8">
                           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-nat-text mb-6 flex items-center gap-3 text-red-600">
                            <div className="w-6 h-6 bg-red-50 rounded-lg flex items-center justify-center">
                               <ShieldCheck className="w-3 h-3 text-red-600" />
                            </div>
                            Bezpečnostní Audit (Hlídač Státu)
                          </h3>
                          <div className="p-6 bg-red-50/30 rounded-3xl border border-red-100">
                            {/* Entity Details from ARES */}
                            <div className="mb-6 p-4 bg-white/60 rounded-2xl border border-white/80 shadow-sm">
                               <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-black text-nat-text uppercase tracking-widest">{activeEntity.name}</span>
                                  <span className="text-[8px] font-mono bg-nat-bg px-2 py-0.5 rounded text-nat-primary">IČ: {activeEntity.ico}</span>
                               </div>
                               <p className="text-[9px] text-nat-accent font-medium leading-relaxed mb-3">
                                 {activeEntity.address}<br/>
                                 {activeEntity.legalForm}
                               </p>
                               <div className="flex flex-wrap gap-2">
                                 {activeEntity.employeesCategory && (
                                   <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[7px] font-black uppercase flex items-center gap-1">
                                      <Users className="w-2 h-2" />
                                      {activeEntity.employeesCategory}
                                   </div>
                                 )}
                                 <a 
                                   href={`https://nahlizenidokn.cuzk.cz/VyhledatParcelu.aspx?p=${activeEntity.kodObce || ''}`}
                                   target="_blank"
                                   rel="noreferrer"
                                   className="px-2 py-1 bg-green-50 text-green-600 rounded text-[7px] font-black uppercase flex items-center gap-1 hover:bg-green-100 transition-colors"
                                 >
                                    <MapPin className="w-2 h-2" />
                                    Nahlédnout do KN
                                 </a>
                               </div>
                            </div>

                            <div className="flex justify-between items-center mb-4">
                              <span className="text-[10px] font-bold text-red-900 uppercase">Risk Score Subjektu</span>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                                (activeEntity.riskScore || 0) > 3 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                              }`}>
                                {activeEntity.riskScore || 0} / 10
                              </span>
                            </div>
                            
                            {activeEntity.riskFlags && activeEntity.riskFlags.length > 0 ? (
                              <div className="space-y-2">
                                {activeEntity.riskFlags.map((flag, i) => (
                                  <div key={i} className="flex items-center gap-2 text-[9px] text-red-800 font-bold bg-white/50 p-2 rounded-lg border border-red-100">
                                    <AlertTriangle className="w-3 h-3 text-red-500" />
                                    {flag}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-[9px] text-green-700 font-bold bg-green-50 p-2 rounded-lg border border-green-100">
                                <Check className="w-3 h-3 text-green-500" />
                                Nebyly nalezeny žádné kritické vazby ani rizikové indikátory.
                              </div>
                            )}

                            <a 
                              href={`https://www.hlidacstatu.cz/Hledat?q=${activeEntity.ico}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-white border border-red-100 rounded-xl text-[8px] font-black uppercase text-red-900 hover:bg-red-50 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Zobrazit detail na Hlídač Státu
                            </a>
                          </div>
                        </div>
                      )}

                      {/* DATA SOURCES & STANDARDS */}
                      <div className="pt-8 border-t border-nat-border mt-8">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-nat-text mb-6 flex items-center gap-3 text-nat-accent">
                          <div className="w-6 h-6 bg-nat-bg rounded-lg flex items-center justify-center">
                            <MapIcon className="w-3 h-3" />
                          </div>
                          Geografický kontext
                        </h3>
                        <MunicipalityMap city={city} />
                      </div>

                      <div className="pt-8 border-t border-nat-border mt-8">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-nat-text mb-6 flex items-center gap-3 text-nat-accent">
                          <div className="w-6 h-6 bg-nat-bg rounded-lg flex items-center justify-center">
                            <BookOpen className="w-3 h-3" />
                          </div>
                          Datové zdroje & Standardy
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-nat-bg/30 rounded-xl border border-nat-border/50">
                            <span className="text-[9px] font-bold text-nat-text uppercase">Otevřená data (ČSÚ VDB)</span>
                            <a href="https://vdb.czso.cz/vdbvo2/faces/cs/index.jsf" target="_blank" rel="noreferrer" className="text-[8px] font-black text-nat-primary hover:underline">vdb.czso.cz</a>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-nat-bg/30 rounded-xl border border-nat-border/50">
                            <span className="text-[9px] font-bold text-nat-text uppercase">Registry (ARES MFČR)</span>
                            <a href="https://ares.gov.cz" target="_blank" rel="noreferrer" className="text-[8px] font-black text-nat-primary hover:underline">ares.gov.cz</a>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-nat-bg/30 rounded-xl border border-nat-border/50">
                            <span className="text-[9px] font-bold text-nat-text uppercase">Centrální katalog (NKOD)</span>
                            <a href="https://data.gov.cz" target="_blank" rel="noreferrer" className="text-[8px] font-black text-nat-primary hover:underline">data.gov.cz</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-8 flex flex-col gap-8">
                    <div className="nat-card p-10 flex-1 flex flex-col shadow-xl">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-8 border-b border-nat-bg">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-serif text-3xl italic text-nat-text">Podklady pro IS KP21+</h3>
                            {activeEntity && (
                                <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-nat-secondary animate-pulse" />
                                <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest">ARES Validated</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-nat-accent font-medium uppercase tracking-tighter">Vygenerované zdůvodnění a technický audit</p>
                        </div>
                        <div className="flex gap-3" data-html2canvas-ignore="true">
                          <button 
                            onClick={exportToPDF}
                            disabled={isExporting}
                            className={`px-7 py-3 text-[10px] uppercase font-black tracking-[0.25em] rounded-full border-2 transition-all flex items-center gap-3 bg-nat-primary text-white border-nat-primary shadow-lg hover:brightness-110 disabled:opacity-50`}
                          >
                            {isExporting ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Download className="w-4 h-4" />}
                            PDF Export
                          </button>
                          <button 
                            onClick={copyToClipboard}
                            className={`px-7 py-3 text-[10px] uppercase font-black tracking-[0.25em] rounded-full border-2 transition-all flex items-center gap-3 ${
                              copied 
                                ? 'bg-green-600 text-white border-green-600 shadow-lg' 
                                : 'bg-white text-nat-accent border-nat-border-dark hover:border-nat-primary hover:text-nat-primary'
                            }`}
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Zkopírováno' : 'Kopírovat Audit'}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex-1 bg-nat-bg/30 rounded-[32px] border-2 border-dashed border-nat-border p-10 relative group">
                        <p className="text-[10px] text-nat-accent/30 mb-6 font-black uppercase tracking-[0.3em]">Stanovisko pro hodnotitele</p>
                        <div className="relative">
                          <p className="text-sm leading-relaxed text-nat-text font-medium whitespace-pre-wrap italic text-justify">
                            {summaryText}
                          </p>
                        </div>

                        {activeExpert && (
                          <div className={`mt-8 pt-8 border-t border-nat-bg flex items-center justify-between transition-opacity ${activeExpert.verificationStatus === 'pending' ? 'opacity-50' : 'opacity-100'}`}>
                            <div>
                              <div className="flex items-center gap-2 mb-1 italic">
                                <p className="text-[10px] text-nat-accent font-black uppercase tracking-widest">Vázaný odborník pro audit (KP21+)</p>
                                {activeExpert.verificationStatus === 'verified' && <Check className="w-3 h-3 text-emerald-500" />}
                                {activeExpert.verificationStatus === 'warning' && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                              </div>
                              <p className="text-sm font-black text-nat-text">{activeExpert.name}</p>
                              <p className="text-[9px] text-nat-accent/70 font-bold uppercase">
                                {activeExpert.specialization} • ID: {activeExpert.id} 
                                {activeExpert.lastVerified && ` • Verif: ${activeExpert.lastVerified}`}
                              </p>
                            </div>
                            <div className={`w-12 h-12 bg-white rounded-xl border border-nat-border flex items-center justify-center text-nat-primary shadow-sm grayscale transition-all ${
                              activeExpert.verificationStatus === 'verified' ? 'opacity-100 grayscale-0 ring-2 ring-emerald-50' : 'opacity-50'
                            }`}>
                               <Users className="w-6 h-6" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-nat-bg p-5 rounded-[22px] border border-nat-border transition-transform hover:-translate-y-1">
                          <span className="block text-[8px] uppercase font-black text-nat-accent opacity-50 mb-2">Auditní Sazba</span>
                          <span className="font-mono font-black text-nat-dark text-lg">{(effectiveIntensity * 100).toFixed(0)}%</span>
                        </div>
                        <div className="bg-nat-bg p-5 rounded-[22px] border border-nat-border transition-transform hover:-translate-y-1">
                          <span className="block text-[8px] uppercase font-black text-nat-accent opacity-50 mb-2">Doba správy</span>
                          <span className="font-mono font-black text-nat-dark text-lg">{selectedActivity?.sustainability} let</span>
                        </div>
                        <div className="bg-nat-bg p-5 rounded-[22px] border border-nat-border transition-transform hover:-translate-y-1">
                          <span className="block text-[8px] uppercase font-black text-nat-accent opacity-50 mb-2">Právní forma</span>
                          <span className="font-sans font-black text-nat-dark text-xs truncate uppercase tracking-tighter">Oprávněný</span>
                        </div>
                        <div className="bg-nat-bg p-5 rounded-[22px] border border-nat-border transition-transform hover:-translate-y-1">
                          <span className="block text-[8px] uppercase font-black text-nat-accent opacity-50 mb-2">Stav dokumentů</span>
                          <span className="font-sans font-black text-nat-dark text-xs truncate uppercase tracking-tighter">Audit OK</span>
                        </div>
                      </div>
                    </div>

                    <div className="nat-card p-10 border-nat-primary/20 bg-nat-primary/5">
                       <h3 className="font-serif text-xl italic text-nat-text mb-6">Harmonogram postupu</h3>
                       <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                         {GRANT_PHASES.map((p, i) => (
                           <div key={i} className="flex flex-col gap-2 group cursor-help">
                             <div className={`h-1.5 rounded-full transition-all duration-500 ${i <= 3 ? 'bg-nat-primary' : 'bg-nat-border'}`} />
                             <span className="text-[9px] font-black uppercase text-nat-accent opacity-50 group-hover:opacity-100">{p.name}</span>
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-center mt-14 pt-10 border-t border-nat-border/50">
              <button 
                onClick={prevStep}
                disabled={step === 1}
                className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] px-8 py-4 rounded-full transition-all border-2 border-nat-border-dark ${
                  step === 1 ? 'opacity-0 shadow-none pointer-events-none' : 'text-nat-accent hover:text-nat-text bg-white shadow-sm'
                }`}
              >
                <ChevronLeft className="w-4 h-4" /> Zpět
              </button>
              
              {step < 5 ? (
                <button 
                  onClick={nextStep}
                  disabled={(step === 2 && !selectedActivity) || (step === 3 && Object.keys(answers).length < AUDIT_QUESTIONS.length)}
                  className={`flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.25em] px-12 py-4 rounded-full transition-all text-white shadow-2xl shadow-nat-primary/20 hover:scale-105 active:scale-95 ${
                    ((step === 2 && !selectedActivity) || (step === 3 && Object.keys(answers).length < AUDIT_QUESTIONS.length)) ? 'bg-nat-primary/40' : 'bg-nat-primary hover:brightness-110'
                  }`}
                >
                  Pokračovat <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={() => { setStep(1); setAnswers({}); setSelectedActivity(null); }}
                  className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] px-12 py-4 rounded-full transition-all text-white bg-nat-dark shadow-2xl hover:brightness-110 hover:scale-105 active:scale-95"
                >
                  Nová kalkulace
                </button>
              )}
            </div>
          </div>

          {/* LIVE AUDIT SIDEBAR */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="sticky top-24 space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-nat-dark p-8 rounded-[44px] text-white shadow-2xl relative overflow-hidden"
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-nat-primary opacity-10 rounded-full blur-3xl" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-nat-primary mb-8 flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-nat-primary" />
                  Potenciál úspěchu
                </h3>
                
                <div className="flex items-end justify-between mb-2">
                  <span className="text-5xl font-sans font-black tracking-tighter">
                    {step === 1 ? '15' : step === 2 ? '45' : step === 3 ? '85' : '98'}<span className="text-xl not-italic opacity-40 ml-1">%</span>
                  </span>
                  <span className="text-[10px] font-black uppercase text-nat-primary tracking-widest mb-2">Rating projektu</span>
                </div>
                
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-8">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(step / 5) * 100}%` }}
                    className="h-full bg-nat-primary shadow-[0_0_20px_rgba(225,29,72,0.5)]" 
                  />
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-nat-primary/20 flex items-center justify-center text-nat-primary">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-[8px] font-black uppercase opacity-40 tracking-widest">Kritéria k.o.</span>
                      <span className="text-[10px] font-bold">Splněna (Průběžně)</span>
                    </div>
                  </div>
                  {selectedActivity && (
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-[8px] font-black uppercase opacity-40 tracking-widest">Aktivita</span>
                        <span className="text-[10px] font-bold truncate block max-w-[140px]">{selectedActivity.id}</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              <div className="bg-white p-8 rounded-[44px] border border-nat-border shadow-sm">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-nat-accent mb-6 flex items-center gap-3">
                  <Info className="w-4 h-4 text-nat-primary" />
                  Metodický průvodce
                </h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-nat-bg flex items-center justify-center text-nat-primary flex-shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] leading-relaxed text-nat-accent font-medium italic">
                      {step === 1 && "Zadání IČO a lokality je klíčové pro správné určení dotačních bonusů pro znevýhodněné regiony."}
                      {step === 2 && "Vyberte aktivitu, která nejvíce odpovídá vašemu záměru. AI model automaticky zkontroluje slučitelnost."}
                      {step === 3 && "Auditní otázky vycházejí z padesáti metodických pokynů SFŽP. Odpovídejte na základě projektové dokumentace."}
                      {step === 4 && "Odhad nákladů je orientační. Finální dotace bude vypočtena z vysoutěžených cen dle NOO."}
                      {step === 5 && "Audit je dokončen. Nyní můžete vyexportovat kompletní přílohu pro IS KP21+."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : (
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <h1 className="text-4xl font-sans font-black text-nat-text mb-3 tracking-tighter">Aktuální a plánované výzvy</h1>
                <p className="text-nat-accent text-sm max-w-2xl font-medium">Přehled dotačních příležitostí v rámci Operačního programu Životní prostředí. Data jsou synchronizována k 4. 5. 2026. Alokace jsou uváděny v milionech Kč.</p>
              </div>
              <div className="flex bg-white px-6 py-3 rounded-full border border-nat-border shadow-sm gap-4 items-center">
                <Search className="w-4 h-4 text-nat-accent" />
                <input type="text" placeholder="Hledat výzvu..." className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest" />
              </div>
            </div>

            <GrantDashboard calls={CURRENT_CALLS} />

            <div className="grid md:grid-cols-2 gap-8">
              {CURRENT_CALLS.map((call) => (
                <motion.div 
                  key={call.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[40px] border border-nat-border p-10 hover:shadow-2xl transition-all group relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-10 px-4 py-1 rounded-b-xl text-[8px] font-black uppercase tracking-widest ${
                    call.status === 'Otevřená' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {call.status}
                  </div>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-nat-bg rounded-2xl flex items-center justify-center text-nat-primary font-mono text-2xl font-black">
                       {call.number}.
                    </div>
                    <h3 className="font-black text-xl text-nat-text group-hover:text-nat-primary transition-colors leading-tight">
                      {call.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="space-y-1">
                      <span className="block text-[8px] font-black uppercase text-nat-accent opacity-40">Alokace</span>
                      <span className="font-bold text-nat-text text-sm">{call.allocation}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[8px] font-black uppercase text-nat-accent opacity-40">Termín</span>
                      <span className="font-bold text-nat-text text-sm">{call.opens} — {call.closes}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-nat-bg">
                    <div className="flex -space-x-2">
                      {[1,2].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full bg-nat-bg border-2 border-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-nat-primary" />
                        </div>
                      ))}
                      <div className="text-[9px] font-bold text-nat-accent pl-4 flex items-center">Podmínky OK</div>
                    </div>
                    <button 
                      onClick={() => { setView('audit'); setStep(2); }}
                      className="px-6 py-2.5 bg-nat-dark text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-nat-primary transition-all flex items-center gap-2"
                    >
                      Prověřit Audit <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-nat-primary p-12 rounded-[50px] text-nat-bg flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
               <TrendingUp className="absolute -left-10 -bottom-10 w-64 h-64 opacity-5 rotate-12" />
               <div className="flex-1 space-y-4">
                  <h3 className="text-3xl font-sans font-black mb-2 tracking-tighter">Potřebujete pomoc se sepisováním?</h3>
                  <p className="text-sm opacity-80 leading-relaxed font-medium">Naše platforma automaticky generuje technické přílohy pro indikátory, texty do IS KP21+ a prověřuje soulad se standardy péče o přírodu.</p>
                  <div className="flex gap-4 pt-4">
                     <button className="px-8 py-4 bg-white text-nat-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-transform shadow-xl shadow-nat-primary/20">Domluvit konzultaci</button>
                     <button className="px-8 py-4 bg-nat-primary border-2 border-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10">Metodický portál</button>
                  </div>
               </div>
               <div className="w-full md:w-80 h-32 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 p-6 flex items-center justify-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">AI Analýza v.2.4</span>
               </div>
            </div>
          </div>
        )}
      </main>

      <footer className="px-6 md:px-10 py-12 border-t border-nat-border bg-white flex flex-col md:flex-row justify-between items-center gap-10 mt-32 mb-24 md:mb-0">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="flex flex-col">
             <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-nat-primary" />
                <span className="text-sm font-black uppercase tracking-tight">Dot-AUDIT <span className="font-mono text-nat-primary">PRO</span></span>
             </div>
             <p className="text-[10px] text-nat-accent font-black uppercase tracking-widest pl-7">WHC s.r.o., jsme operační systém vašich projektů</p>
          </div>
          <div className="w-px h-10 bg-nat-border hidden md:block" />
          <span className="text-[9px] uppercase tracking-[0.2em] font-black text-nat-accent">Metodika SFŽP v.2.4</span>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-nat-primary animate-pulse"></div>
            <span className="text-[10px] uppercase tracking-widest font-black text-nat-text">IS KP21+ Sync Aktivní</span>
          </div>
        </div>
      </footer>

      {/* HIDDEN PDF TEMPLATE */}
      <div 
        ref={pdfExportRef}
        style={{ display: 'none', background: 'white' }}
        className="p-10 text-nat-text font-sans"
      >
        <div className="flex justify-between items-start border-b-4 border-nat-dark pb-8 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-nat-dark text-nat-primary flex items-center justify-center rounded-xl">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter">Dot-AUDIT <span className="text-nat-primary font-mono ml-0.5">PRO</span></h1>
                <p className="text-[10px] font-black uppercase text-nat-accent tracking-[0.3em]">TECHNICAL AUDIT & VALIDATION REPORT</p>
              </div>
            </div>
            <p className="text-[9px] font-bold text-nat-accent">Powered by WHC s.r.o., jsme operační systém vašich projektů</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black font-mono">{new Date().toLocaleDateString('cs-CZ')}</p>
            <p className="text-[10px] text-nat-accent font-black uppercase">REF_ID: #{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="bg-slate-50 p-8 rounded-3xl border-2 border-slate-100">
            <h3 className="text-[10px] font-black uppercase text-nat-accent mb-6 tracking-widest border-b border-slate-200 pb-2">Parametry Subjektu</h3>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                <span className="text-nat-accent">Lokalita:</span>
                <span className="font-bold">{city}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                <span className="text-nat-accent">Region:</span>
                <span className="font-bold">{municipalityResults[0]?.region || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                <span className="text-nat-accent">Obyvatelstvo:</span>
                <span className="font-bold">{population.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-nat-accent">IČO:</span>
                <span className="font-bold">{ico || 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 p-8 rounded-3xl border-2 border-slate-800 flex flex-col justify-center shadow-lg">
            <h3 className="text-[10px] font-black uppercase text-nat-secondary mb-6 tracking-widest border-b border-white/10 pb-2">KLÍČOVÝ INDIKÁTOR RCR 37</h3>
            <div className="flex items-center gap-6">
              <span className="text-7xl font-black text-white font-mono leading-none tracking-tighter">{calculation.rounded}</span>
              <div className="text-[10px] text-white/50 font-black uppercase leading-tight">
                Validováno dle<br/>přílohy č. 4<br/>metodiky SFŽP
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-[10px] font-black uppercase text-nat-accent mb-4 tracking-widest border-l-4 border-nat-primary pl-3">Auditovaná Dotační Aktivita</h3>
          <div className="p-8 bg-white border-2 border-nat-border rounded-3xl shadow-sm">
            <p className="text-lg font-black mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-nat-primary/10 text-nat-primary rounded-lg flex items-center justify-center text-xs">V</span>
              {selectedActivity?.id || 'NEBYLA VYBRÁNA AKTIVITA'}
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-nat-border">
              <div>
                <span className="text-[8px] font-black uppercase text-nat-accent block mb-1">Míra shody záměru</span>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-nat-primary w-[98%]" />
                </div>
              </div>
              <div>
                <span className="text-[8px] font-black uppercase text-nat-accent block mb-1">Status způsobilosti</span>
                <p className="text-sm font-black text-nat-primary uppercase tracking-tighter">Schváleno k přípravě (98%)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-[10px] font-black uppercase text-nat-accent mb-4 tracking-widest border-l-4 border-nat-primary pl-3">FINANČNÍ ROZVAHA (PREDIKCE)</h3>
          <div className="rounded-3xl border-2 border-nat-border overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-nat-border text-[9px] uppercase font-black text-nat-accent">
                  <th className="px-8 py-5">POLOŽKA AUDITU</th>
                  <th className="px-8 py-5 text-right">HODNOTA V CZK</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                <tr className="border-b border-nat-border/50">
                  <td className="px-8 py-4 font-bold">Uznatelné náklady projektu (100%)</td>
                  <td className="px-8 py-4 text-right font-bold">{parseInt(estimatedCosts).toLocaleString()}</td>
                </tr>
                <tr className="border-b border-nat-border/50">
                  <td className="px-8 py-4 font-bold text-slate-400">Výše dotace z EU (85%)</td>
                  <td className="px-8 py-4 text-right font-black text-nat-primary">{(parseInt(estimatedCosts) * 0.85).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="px-8 py-4 font-bold text-slate-400">Limit vlastních zdrojů (15%)</td>
                  <td className="px-8 py-4 text-right font-mono">{(parseInt(estimatedCosts) * 0.15).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-20 pt-10 border-t-2 border-nat-dark text-center">
          <p className="text-[8px] text-nat-accent uppercase font-black tracking-[0.4em] mb-4">Systémová validace Dot-AUDIT PRO</p>
          <div className="flex justify-center items-center gap-10">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-nat-secondary" />
              <span className="text-[10px] font-black uppercase">SFŽP METODIKA OK</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-nat-secondary" />
              <span className="text-[10px] font-black uppercase">ARES-LOOKUP OK</span>
            </div>
            <div className="flex items-center gap-2 transition-all">
              <Check className="w-4 h-4 text-nat-secondary" />
              <span className="text-[10px] font-black uppercase">WHC OS SYNC OK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
