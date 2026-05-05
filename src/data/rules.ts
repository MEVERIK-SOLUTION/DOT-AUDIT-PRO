
export type ApplicantType = 'municipality' | 'ngo' | 'private_sme' | 'private_large' | 'public_entity' | 'religious';

export interface Provider {
  id: string;
  name: string;
  url: string;
  description: string;
  logo?: string;
}

export const PROVIDERS: Provider[] = [
  { id: 'sfzp', name: 'SFŽP ČR', url: 'https://www.sfzp.cz', description: 'Státní fond životního prostředí ČR' },
  { id: 'sfpi', name: 'SFPI', url: 'https://sfpi.cz', description: 'Státní fond podpory investic' },
  { id: 'mpo', name: 'MPO', url: 'https://www.mpo.cz', description: 'Ministerstvo průmyslu a obchodu' },
  { id: 'mrr', name: 'MMR', url: 'https://www.mmr.cz', description: 'Ministerstvo pro místní rozvoj' }
];

export interface Expert {
  id: string;
  role: string;
  description: string;
  database: string; // e.g., 'ČKAIT', 'ČKA', 'MŽP'
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  baseIntensity: number; 
  intensities?: Partial<Record<ApplicantType, number>>; 
  bonuses?: {
    id: string;
    label: string;
    rate: number;
    description: string;
  }[];
  sustainability: number; 
  indicators: {
    code: string;
    description: string;
    unit: string;
  }[];
  docs: string[];
  conditions: string[];
  experts?: Expert[];
  maxCosts?: number;
  minCosts?: number;
  officialUrl?: string;
  methodologyUrl?: string;
  geographicScope?: string;
  eligibilityDescription?: string;
}

export interface Call {
  id: string;
  providerId: string;
  number: number | string;
  title: string;
  description: string;
  status: 'Otevřená' | 'Plánovaná' | 'Ukončená';
  opens: string;
  closes: string;
  allocation: string;
  numericAllocation: number; // in millions CZK
  officialUrl?: string;
}

export const ACTIVITIES: Activity[] = [
  {
    id: '1.3.1.1',
    name: 'Obnova vodních prvků (tůně, mokřady, MVN)',
    description: 'Tvorba nových a obnova stávajících přírodě blízkých vodních prvků v krajině i sídlech. Výzva 104.',
    baseIntensity: 1.0,
    intensities: {
      municipality: 1.0,
      ngo: 1.0,
      public_entity: 1.0,
      religious: 1.0,
      private_sme: 0.7,
      private_large: 0.5
    },
    bonuses: [
      { id: 'natura', label: 'ZCHÚ / Natura 2000', rate: -0.15, description: 'Snížení intenzity na 85 %, pokud není v majetku státu a je v chráněném území.' }
    ],
    sustainability: 10,
    indicators: [
      { code: 'RCR 37', description: 'Počet obyvatel s prospěchem z opatření', unit: 'osoby' },
      { code: 'RCO 26', description: 'Vybudovaná/modernizovaná zelená infrastruktura', unit: 'hektary' }
    ],
    docs: [
      'Projektová dokumentace (v úrovni pro povolení stavby)',
      'Položkový rozpočet v cenové úrovni ÚRS/RTS',
      'Povolení záměru / Stavební povolení',
      'Odborný posudek AOPK ČR (lhůta 45 dní)',
      'Dendrologický průzkum (pokud dochází k zásahu do dřevin)',
      'Doklad o výchozím stavu biodiverzity'
    ],
    conditions: [
      'Území přechodových regionů nebo Praha',
      'Soulad se standardy AOPK ČR (SPPK C02 007)',
      'Zachování biotopu chráněných druhů (Rorýs obecný methodology)',
      'Zamezení vnosu invazních druhů'
    ],
    geographicScope: 'Přechodové regiony a Praha',
    minCosts: 250000,
    officialUrl: 'https://www.sfzp.cz/dotace-a-pujcky/op-zivotni-prostredi/vyzvy/',
    methodologyUrl: 'https://standardy.nature.cz'
  },
  {
    id: '1.3.1.2',
    name: 'Vegetační krajinné prvky',
    description: 'Větrolamy, remízy, stromořadí a biokoridory ve volné krajině.',
    baseIntensity: 0.8,
    intensities: {
      municipality: 0.8,
      ngo: 1.0,
      religious: 0.8
    },
    bonuses: [
      { id: 'uses', label: 'Prvek ÚSES', rate: 0.2, description: 'Navýšení na 100 % u prvků ÚSES (biocentra, biokoridory)' }
    ],
    sustainability: 10,
    indicators: [
      { code: 'RCO 26', description: 'Plocha nových vegetačních prvků', unit: 'hektary' },
      { code: 'RCR 37', description: 'Obyvatelé s prospěchem', unit: 'osoby' }
    ],
    docs: [
      'Mapové podklady ÚSES',
      'Plán pěstební péče',
      'Povolení ke kácení (pokud relevantní)',
      'Vyjádření orgánu ochrany přírody'
    ],
    conditions: [
      'Použití geograficky původních druhů dřevin',
      'Zajištění následné péče (min. 3 roky v rámci projektu)',
      'Povinnost vybrat indikátory RCO26 a RCR37'
    ],
    geographicScope: 'Přechodové regiony a Praha',
    minCosts: 250000,
    officialUrl: 'https://www.sfzp.cz/dotace-a-pujcky/op-zivotni-prostredi/vyzvy/'
  },
  {
    id: '1.1.1',
    name: 'Energetické úspory (Komplexní projekty)',
    description: 'Zateplení obálky, výměna oken, instalace OZE a energetický management.',
    baseIntensity: 0.45,
    intensities: {
      public_entity: 0.45,
      municipality: 0.50
    },
    bonuses: [
      { id: 'nzeb', label: 'Standard nZEB+', rate: 0.1, description: 'Bonus za dosažení pasivního standardu' },
      { id: 'epc', label: 'Metoda EPC', rate: 0.05, description: 'Bonus za využití energetických služeb se zárukou' }
    ],
    sustainability: 15,
    indicators: [
      { code: 'RCR 26', description: 'Roční úspora primární energie', unit: 'MWh/rok' },
      { code: 'RCO 19', description: 'Budovy s nižší en. náročností', unit: 'm2' }
    ],
    docs: [
      'Energetický posudek (včetně návrhu způsobu provádění EM)',
      'Průkaz energetické náročnosti (PENB)',
      'Zoologický průzkum (Rorýs obecný)',
      'Součinnost při vyregulování otopné soustavy'
    ],
    conditions: [
      'Úspora min. 20 % konečné spotřeby (10 % u památek)',
      'Zavedení EM dle ISO 50001 po celou dobu udržitelnosti',
      'Povinnost EM pokud obec > 2000 obyv. nebo rent > 20 %'
    ],
    geographicScope: 'Mimo Prahu',
    methodologyUrl: 'https://www.opzp.cz/o-programu/energeticky-management/'
  },
  {
    id: '1.4.1',
    name: 'Vodovody a kanalizace',
    description: 'Výstavba čistíren odpadních vod a kanalizačních sítí nad 2000 EO.',
    baseIntensity: 0.75,
    intensities: {
      municipality: 0.75,
      public_entity: 0.75
    },
    sustainability: 10,
    indicators: [
      { code: 'EO', description: 'Počet nově napojených ekvivalentních obyvatel', unit: 'EO' },
      { code: 'm', description: 'Délka vybudované sítě', unit: 'metry' }
    ],
    docs: [
      'Povolení záměru a vodoprávní povolení',
      'Smlouva o provozování VHI',
      'Nástroj udržitelnosti (zdroje na obnovu)',
      'Vyjádření příslušného podniku Povodí'
    ],
    conditions: [
      'Jedná se o aglomerace s nevyhovujícím stavem dle 91/271/EHS',
      'Zajištění plně obnovující ceny pro vodné a stočné',
      'Vlastní zdroje žadatele musí být zajištěny po celou dobu'
    ],
    minCosts: 3000000,
    geographicScope: 'Celá ČR',
    officialUrl: 'https://voda.gov.cz/'
  }
];

export const CURRENT_CALLS: Call[] = [
  {
    id: 'call-104',
    providerId: 'sfzp',
    number: 104,
    title: 'Sídelní zeleň a adaptační opatření (ITI)',
    description: 'Tato výzva je zaměřena na podporu zelené infrastruktury v urbanizovaném prostředí s využitím integrovaných teritoriálních investic (ITI).',
    status: 'Otevřená',
    opens: '01.03.2026',
    closes: '30.06.2026',
    allocation: '330 mil. Kč',
    numericAllocation: 330,
    officialUrl: 'https://www.sfzp.cz'
  },
  {
    id: 'sfpi-npo-1',
    providerId: 'sfpi',
    number: 'NPO-1',
    title: 'Nájemní bydlení – Podpora výstavby v obcích',
    description: 'Program SFPI zaměřený na zvýšení dostupnosti nájemního bydlení prostřednictvím výstavby nebo rekonstrukcí bytových fondů obcí.',
    status: 'Otevřená',
    opens: '15.04.2026',
    closes: '31.12.2026',
    allocation: '2,5 mld. Kč',
    numericAllocation: 2500,
    officialUrl: 'https://sfpi.cz/najemni-bydleni/'
  },
  {
    id: 'sfpi-brown-1',
    providerId: 'sfpi',
    number: 'B-2026',
    title: 'Obnova brownfieldů pro bydlení',
    description: 'Finance na odstranění staveb a sanaci území bývalých průmyslových areálů s následnou výstavbou bytových domů.',
    status: 'Plánovaná',
    opens: '20.08.2026',
    closes: '30.11.2026',
    allocation: '1,8 mld. Kč',
    numericAllocation: 1800,
    officialUrl: 'https://sfpi.cz/brownfieldy/'
  },
  {
    id: 'call-102',
    providerId: 'sfzp',
    number: 102,
    title: 'Komplexní projekty energetických úspor',
    description: 'Podpora energetické účinnosti veřejných budov. Zahrnuje zateplení a OZE.',
    status: 'Otevřená',
    opens: '29.04.2026',
    closes: '25.09.2026',
    allocation: '750 mil. Kč',
    numericAllocation: 750
  },
  {
    id: 'call-114',
    providerId: 'sfzp',
    number: 114,
    title: 'Voda a čištění odpadních vod',
    description: 'Klíčová výzva pro modernizaci vodohospodářské infrastruktury. Fakticky Aglomerace nad 2000 EO.',
    status: 'Otevřená',
    opens: '15.01.2026',
    closes: '31.12.2026',
    allocation: '14,1 mld. Kč',
    numericAllocation: 14100
  },
  {
    id: 'call-future-1',
    providerId: 'sfzp',
    number: 125,
    title: 'Nové vodní zdroje a úprava pitné vody',
    description: 'Budoucí výzva zaměřená na zabezpečení dodávek pitné vody skrze hloubení nových vrtů a modernizaci stávajících úpraven vody.',
    status: 'Plánovaná',
    opens: '01.09.2026',
    closes: '20.12.2026',
    allocation: '1,2 mld. Kč',
    numericAllocation: 1200
  }
];

export const NEWS_FEED = [
  {
    id: 1,
    date: 'Dnes, 08:30',
    provider: 'SFŽP ČR',
    title: 'Aktualizace metodiky pro výzvu 104',
    content: 'Zveřejněn dodatek č. 2 k metodice výpočtu indikátoru RCR 37. Důležité pro žadatele z řad ITI aglomerací.',
    category: 'Metodika'
  },
  {
    id: 2,
    date: 'Před 2 hodinami',
    provider: 'SFPI',
    title: 'Nová výzva na nájemní bydlení spuštěna',
    content: 'Alokace 2,5 mld. Kč je připravena pro obce a DSO na rozvoj obecních bytových fondů.',
    category: 'Nová Výzva'
  },
  {
    id: 3,
    date: 'Včera',
    provider: 'MMR',
    title: 'Seminář k regeneraci brownfieldů',
    content: 'Registrace na online workshop k přípravě projektů v rámci NPO jsou nyní otevřeny.',
    category: 'Vzdělávání'
  }
];

export const DATABASE_RESOURCES = [
  { id: 'ares', label: 'ARES - Registr ekonomických subjektů', desc: 'Validace právní formy a sídla.', url: 'https://wwwinfo.mfcr.cz/ares/', icon: 'ShieldCheck' },
  { id: 'hlidac', label: 'Hlídač Státu', desc: 'Kontrola historie dotací a vazeb.', url: 'https://www.hlidacstatu.cz/', icon: 'Search' },
  { id: 'sfpi', label: 'SFPI Portál', desc: 'Kompletní dokumentace fondu investic.', url: 'https://sfpi.cz/', icon: 'Building' },
  { id: 'is_kp21', label: 'IS KP21+', desc: 'Oficiální portál pro podání žádostí.', url: 'https://iskp21.mms.cz/', icon: 'ExternalLink' }
];

export interface AuditQuestion {
  id: string;
  text: string;
  options: {
    label: string;
    impact: string;
    eligible: boolean;
  }[];
}

export const AUDIT_QUESTIONS: AuditQuestion[] = [
  {
    id: 'applicant',
    text: 'Jaká je vaše právní forma?',
    options: [
      { label: 'Obec / Město', impact: 'Plná způsobilost ve všech SC.', eligible: true },
      { label: 'NGO / Spolek', impact: 'Způsobilost v SC 1.3, omezení u MVN.', eligible: true },
      { label: 'Fyzická osoba podnikající', impact: 'Omezeno na specifické podaktivity.', eligible: true },
      { label: 'Právnická osoba (s.r.o./a.s.)', impact: 'Nutnost prověření veřejné podpory (GBER).', eligible: true }
    ]
  },
  {
    id: 'property',
    text: 'Máte vyřešeny majetkoprávní vztahy (vlastnictví pozemků)?',
    options: [
      { label: 'Jsme vlastníci', impact: 'Bez komplikací.', eligible: true },
      { label: 'Máme nájemní smlouvu', impact: 'Musí krýt dobu udržitelnosti (5-10 let).', eligible: true },
      { label: 'Nemáme vyřešeno', impact: 'Kritické riziko - nelze podat žádost.', eligible: false }
    ]
  },
  {
    id: 'status',
    text: 'V jaké fázi je příprava projektu?',
    options: [
      { label: 'Záměr / Studie', impact: 'Včasný moment pro energetickou optimalizaci.', eligible: true },
      { label: 'Projekt pro povolení', impact: 'Ideální čas pro podání žádosti.', eligible: true },
      { label: 'Realizace zahájena', impact: 'Riziko porušení motivačního účinku (pokud v GBER).', eligible: true }
    ]
  }
];

export const GRANT_PHASES = [
  { name: 'Příprava', desc: 'Zpracování PD, posudků a energetického managementu.' },
  { name: 'Podání žádosti', desc: 'Elektronicky přes systém IS KP21+.' },
  { name: 'Hodnocení', desc: 'Kontrola formálních náležitostí a přijatelnosti (cca 60 dní).' },
  { name: 'Vydání Právního aktu', desc: 'Potvrzení dotace a stanovení závazných podmínek.' },
  { name: 'Realizace', desc: 'Výběr dodavatele a samotná stavba/výsadba.' },
  { name: 'Udržitelnost', desc: 'Povinné monitorovací zprávy po dobu 5-10 let.' }
];
