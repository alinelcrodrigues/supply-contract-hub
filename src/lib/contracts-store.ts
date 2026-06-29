import { useEffect, useSyncExternalStore } from "react";

export type Measurement = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: number;
};

export const COST_CENTERS = [
  "Obra Residencial Vila Nova",
  "Obra Comercial Centro",
  "Obra Industrial Norte",
  "Administração Central",
] as const;

export const FINANCIAL_CATEGORIES = [
  "Estrutura",
  "Alvenaria",
  "Instalações Elétricas",
  "Instalações Hidráulicas",
  "Acabamentos",
  "Esquadrias",
  "Locação de Equipamentos",
  "Serviços Terceirizados",
  "Administrativo",
] as const;

export type CostCenter = (typeof COST_CENTERS)[number] | string;
export type FinancialCategory = (typeof FINANCIAL_CATEGORIES)[number] | string;

export type Contract = {
  id: string;
  number: string;
  supplier: string;
  object: string;
  globalValue: number;
  budgetValue: number | null;
  startDate: string;
  endDate: string;
  adjustmentIndex: "IPCA" | "IGP-M" | "INCC" | "SINAPI" | "Nenhum";
  adjustmentMonth: number; // 1-12 anniversary month
  signed: boolean;
  costCenter: CostCenter;
  financialCategory: FinancialCategory;
  measurements: Measurement[];
};

const KEY = "supply-contracts:v3";

function read(): Contract[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Contract[];
  } catch {
    return [];
  }
}

function write(list: Contract[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  listeners.forEach((l) => l());
}

function buildSeed(): Contract[] {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const addDays = (d: Date, n: number) => {
    const c = new Date(d);
    c.setDate(c.getDate() + n);
    return c;
  };
  const sample: Contract[] = [
    {
      id: crypto.randomUUID(),
      number: "CT-2025-001",
      supplier: "Cimentos União Ltda.",
      object: "Fornecimento de cimento CP-II",
      globalValue: 480000,
      budgetValue: 450000,
      startDate: iso(addDays(today, -300)),
      endDate: iso(addDays(today, 20)),
      adjustmentIndex: "INCC",
      adjustmentMonth: ((today.getMonth() + 1) % 12) + 1,
      signed: true,
      costCenter: "Obra Residencial Vila Nova",
      financialCategory: "Estrutura",
      measurements: [
        { id: crypto.randomUUID(), date: iso(addDays(today, -60)), description: "Medição #1", amount: 120000 },
        { id: crypto.randomUUID(), date: iso(addDays(today, -30)), description: "Medição #2", amount: 95000 },
      ],
    },
    {
      id: crypto.randomUUID(),
      number: "CT-2025-014",
      supplier: "Aço Forte Distribuidora",
      object: "Vergalhões e telas soldadas",
      globalValue: 1250000,
      budgetValue: 1200000,
      startDate: iso(addDays(today, -180)),
      endDate: iso(addDays(today, 200)),
      adjustmentIndex: "IPCA",
      adjustmentMonth: today.getMonth() + 1,
      signed: true,
      costCenter: "Obra Comercial Centro",
      financialCategory: "Estrutura",
      measurements: [
        { id: crypto.randomUUID(), date: iso(addDays(today, -45)), description: "Medição #1", amount: 320000 },
      ],
    },
    {
      id: crypto.randomUUID(),
      number: "CT-2025-022",
      supplier: "Madeireira Pinheiro",
      object: "Madeira para fôrmas",
      globalValue: 220000,
      budgetValue: null,
      startDate: iso(addDays(today, -90)),
      endDate: iso(addDays(today, 90)),
      adjustmentIndex: "Nenhum",
      adjustmentMonth: 1,
      signed: false,
      costCenter: "Obra Residencial Vila Nova",
      financialCategory: "Alvenaria",
      measurements: [],
    },
    {
      id: crypto.randomUUID(),
      number: "CT-2025-031",
      supplier: "Elétrica Power Sul",
      object: "Material elétrico e quadros",
      globalValue: 380000,
      budgetValue: 380000,
      startDate: iso(addDays(today, -120)),
      endDate: iso(addDays(today, 150)),
      adjustmentIndex: "IPCA",
      adjustmentMonth: 6,
      signed: true,
      costCenter: "Obra Comercial Centro",
      financialCategory: "Instalações Elétricas",
      measurements: [
        { id: crypto.randomUUID(), date: iso(addDays(today, -50)), description: "Medição #1", amount: 80000 },
        { id: crypto.randomUUID(), date: iso(addDays(today, -20)), description: "Medição #2", amount: 60000 },
      ],
    },
    {
      id: crypto.randomUUID(),
      number: "CT-2025-040",
      supplier: "Locadora Máquinas Brasil",
      object: "Locação de gruas e betoneiras",
      globalValue: 540000,
      budgetValue: 500000,
      startDate: iso(addDays(today, -60)),
      endDate: iso(addDays(today, 240)),
      adjustmentIndex: "IGP-M",
      adjustmentMonth: 9,
      signed: true,
      costCenter: "Obra Industrial Norte",
      financialCategory: "Locação de Equipamentos",
      measurements: [
        { id: crypto.randomUUID(), date: iso(addDays(today, -25)), description: "Medição #1", amount: 90000 },
      ],
    },
  ];
  return sample;
}

function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(KEY)) return;
  window.localStorage.setItem(KEY, JSON.stringify(buildSeed()));
  listeners.forEach((l) => l());
}

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useContracts(): Contract[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      const data = read();
      return data;
    },
    () => [],
  );
}

// cache snapshot to keep referential stability per write
let cache: Contract[] | null = null;
let cacheKey = "";
function snapshot(): Contract[] {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) ?? "" : "";
  if (raw !== cacheKey) {
    cacheKey = raw;
    cache = read();
  }
  return cache ?? [];
}

export function useContractsStable(): Contract[] {
  const data = useSyncExternalStore(subscribe, snapshot, () => []);
  useEffect(() => {
    ensureSeeded();
  }, []);
  return data;
}

export function getContract(id: string): Contract | undefined {
  return read().find((c) => c.id === id);
}

export function addContract(c: Omit<Contract, "id" | "measurements">): Contract {
  const list = read();
  const next: Contract = { ...c, id: crypto.randomUUID(), measurements: [] };
  write([next, ...list]);
  return next;
}

export function updateContract(id: string, patch: Partial<Contract>) {
  const list = read().map((c) => (c.id === id ? { ...c, ...patch } : c));
  write(list);
}

export function addMeasurement(contractId: string, m: Omit<Measurement, "id">) {
  const list = read().map((c) =>
    c.id === contractId
      ? { ...c, measurements: [...c.measurements, { ...m, id: crypto.randomUUID() }] }
      : c,
  );
  write(list);
}

export function deleteMeasurement(contractId: string, mid: string) {
  const list = read().map((c) =>
    c.id === contractId ? { ...c, measurements: c.measurements.filter((m) => m.id !== mid) } : c,
  );
  write(list);
}

export function deleteContract(id: string) {
  write(read().filter((c) => c.id !== id));
}

// Helpers
export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatDate = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export function contractBalance(c: Contract) {
  const paid = c.measurements.reduce((s, m) => s + m.amount, 0);
  return { paid, balance: c.globalValue - paid, pct: c.globalValue ? paid / c.globalValue : 0 };
}

export function daysUntil(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function nextAdjustmentDate(c: Contract): Date | null {
  if (c.adjustmentIndex === "Nenhum") return null;
  const today = new Date();
  const y = today.getFullYear();
  let next = new Date(y, c.adjustmentMonth - 1, 1);
  if (next < today) next = new Date(y + 1, c.adjustmentMonth - 1, 1);
  return next;
}