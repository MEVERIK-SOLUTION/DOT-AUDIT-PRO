export interface MunicipalityCategory {
  label: string;
  min: number | null;
  max: number | null;
  coefficient: number;
  description: string;
}

export const CATEGORIES: MunicipalityCategory[] = [
  {
    label: "Do 1 000 obyvatel",
    min: 0,
    max: 1000,
    coefficient: 0.05,
    description: "5 % z celkového počtu obyvatel"
  },
  {
    label: "1 001 – 2 000 obyvatel",
    min: 1001,
    max: 2000,
    coefficient: 0.04,
    description: "4 % z celkového počtu obyvatel"
  },
  {
    label: "2 001 – 5 000 obyvatel",
    min: 2001,
    max: 5000,
    coefficient: 0.03,
    description: "3 % z celkového počtu obyvatel"
  },
  {
    label: "5 001 – 10 000 obyvatel",
    min: 5001,
    max: 10000,
    coefficient: 0.02,
    description: "2 % z celkového počtu obyvatel"
  },
  {
    label: "10 001 – 50 000 obyvatel",
    min: 10001,
    max: 50000,
    coefficient: 0.01,
    description: "1 % z celkového počtu obyvatel"
  },
  {
    label: "Nad 50 000 obyvatel (mimo Prahu)",
    min: 50001,
    max: null,
    coefficient: 0.005,
    description: "0,5 % z celkového počtu obyvatel"
  },
  {
    label: "Praha",
    min: null,
    max: null,
    coefficient: 0.002,
    description: "0,2 % z celkového počtu obyvatel"
  }
];

export interface CalculationResult {
  city: string;
  population: number;
  category: MunicipalityCategory;
  rawResult: number;
  roundedResult: number;
}
