import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* =========================================================
   Tipos
   ========================================================= */

export type MeasurementStatus = "rascunho" | "em_aprovacao" | "aprovada" | "reprovada";

/** Medição do fluxo de alçada (tabela contract_measurements). */
export type Measurement = {
  id: string;
  date: string; // mês de referência (ISO yyyy-mm-dd)
  description: string;
  amount: number; // total_value
  status: MeasurementStatus;
};

export type ContractItem = {
  id: string;
  description: string;
  value: number;
  costCenterId: string | null;
  costCenter: string;
  financialCategory: string;
};

export type AddendumType = "ajuste_valor" | "inclusao_item";

export type Addendum = {
  id: string;
  tipo: AddendumType;
  description: string;
  value: number;
  date: string;
  items: ContractItem[];
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
  adjustmentMonth: number; // 1-12
  signed: boolean;
  status: "ativo" | "cancelado";
  cancellationReason: string | null;
  costCenterId: string | null;
  costCenter: CostCenter;
  financialCategory: FinancialCategory;
  measurements: Measurement[];
  items: ContractItem[];
  addendums: Addendum[];
};

export const CONTRACTS_KEY = ["contracts"] as const;
export const COST_CENTER_DASHBOARD_KEY = ["cost-center-dashboard"] as const;

/* =========================================================
   Leitura
   ========================================================= */

const SELECT = `
  *,
  cost_centers ( name ),
  contract_items ( *, cost_centers ( name ) ),
  contract_measurements ( id, reference_month, total_value, notes, status ),
  contract_addendums ( *, contract_addendum_items ( *, cost_centers ( name ) ) )
`;

type Row = Record<string, any>;

function mapItem(r: Row): ContractItem {
  return {
    id: r.id,
    description: r.description ?? "",
    value: Number(r.value ?? 0),
    costCenterId: r.cost_center_id ?? null,
    costCenter: r.cost_centers?.name ?? "Sem centro de custo",
    financialCategory: r.financial_category ?? "",
  };
}

function mapContract(r: Row): Contract {
  return {
    id: r.id,
    number: r.number,
    supplier: r.supplier,
    object: r.object ?? "",
    globalValue: Number(r.global_value ?? 0),
    budgetValue: r.budget_value === null || r.budget_value === undefined ? null : Number(r.budget_value),
    startDate: r.start_date,
    endDate: r.end_date,
    adjustmentIndex: r.adjustment_index,
    adjustmentMonth: r.adjustment_month,
    signed: !!r.signed,
    status: (r.status as "ativo" | "cancelado") ?? "ativo",
    cancellationReason: r.cancellation_reason ?? null,
    costCenterId: r.cost_center_id ?? null,
    costCenter: r.cost_centers?.name ?? "Sem centro de custo",
    financialCategory: r.financial_category ?? "",
    measurements: (r.contract_measurements ?? [])
      .map((m: Row): Measurement => ({
        id: m.id,
        date: m.reference_month,
        description: m.notes ?? "",
        amount: Number(m.total_value ?? 0),
        status: m.status as MeasurementStatus,
      }))
      .sort((a: Measurement, b: Measurement) => b.date.localeCompare(a.date)),
    items: (r.contract_items ?? []).map(mapItem),
    addendums: (r.contract_addendums ?? [])
      .map((a: Row): Addendum => ({
        id: a.id,
        tipo: a.tipo,
        description: a.description ?? "",
        value: Number(a.value ?? 0),
        date: a.date,
        items: (a.contract_addendum_items ?? []).map(mapItem),
      }))
      .sort((a: Addendum, b: Addendum) => a.date.localeCompare(b.date)),
  };
}

export async function fetchContracts(): Promise<Contract[]> {
  const { data, error } = await supabase
    .from("contracts")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapContract);
}

/** Mantém o queryClient acessível para os mutadores imperativos. */
let qc: QueryClient | null = null;
export function invalidateContracts() {
  qc?.invalidateQueries({ queryKey: CONTRACTS_KEY });
  qc?.invalidateQueries({ queryKey: COST_CENTER_DASHBOARD_KEY });
}

export function useContractsQuery() {
  qc = useQueryClient();
  return useQuery({ queryKey: CONTRACTS_KEY, queryFn: fetchContracts });
}

export function useContractsStable(): Contract[] {
  return useContractsQuery().data ?? [];
}

/* =========================================================
   Escrita
   ========================================================= */

export async function addContract(
  c: Omit<Contract, "id" | "measurements" | "items" | "addendums" | "costCenter"> & { costCenter?: string },
): Promise<Contract> {
  const { data, error } = await supabase
    .from("contracts")
    .insert({
      number: c.number,
      supplier: c.supplier,
      object: c.object,
      global_value: c.globalValue,
      budget_value: c.budgetValue,
      start_date: c.startDate,
      end_date: c.endDate,
      adjustment_index: c.adjustmentIndex,
      adjustment_month: c.adjustmentMonth,
      signed: c.signed,
      cost_center_id: c.costCenterId,
      financial_category: c.financialCategory,
    })
    .select("id")
    .single();
  if (error) throw error;

  // Item inicial do contrato: todo o valor global no centro de custo principal.
  const { error: itemError } = await supabase.from("contract_items").insert({
    contract_id: data.id,
    description: c.object || "Objeto do contrato",
    value: c.globalValue,
    cost_center_id: c.costCenterId,
    financial_category: c.financialCategory,
  });
  if (itemError) throw itemError;

  invalidateContracts();
  return { ...(c as any), id: data.id, measurements: [], items: [], addendums: [] } as Contract;
}

export async function updateContract(id: string, patch: Partial<Contract>) {
  const row: Row = {};
  if (patch.number !== undefined) row.number = patch.number;
  if (patch.supplier !== undefined) row.supplier = patch.supplier;
  if (patch.object !== undefined) row.object = patch.object;
  if (patch.globalValue !== undefined) row.global_value = patch.globalValue;
  if (patch.budgetValue !== undefined) row.budget_value = patch.budgetValue;
  if (patch.startDate !== undefined) row.start_date = patch.startDate;
  if (patch.endDate !== undefined) row.end_date = patch.endDate;
  if (patch.adjustmentIndex !== undefined) row.adjustment_index = patch.adjustmentIndex;
  if (patch.adjustmentMonth !== undefined) row.adjustment_month = patch.adjustmentMonth;
  if (patch.signed !== undefined) row.signed = patch.signed;
  if (patch.costCenterId !== undefined) row.cost_center_id = patch.costCenterId;
  if (patch.financialCategory !== undefined) row.financial_category = patch.financialCategory;
  const { error } = await supabase.from("contracts").update(row as never).eq("id", id);
  if (error) throw error;
  invalidateContracts();
}

export async function deleteContract(id: string) {
  const { error } = await supabase.from("contracts").delete().eq("id", id);
  if (error) throw error;
  invalidateContracts();
}

/* ---------- Aditivos ---------- */

export async function addAddendum(input: {
  contractId: string;
  tipo: AddendumType;
  description: string;
  value: number;
  date: string;
  item?: { description: string; value: number; costCenterId: string | null; financialCategory: string };
}) {
  const { data, error } = await supabase
    .from("contract_addendums")
    .insert({
      contract_id: input.contractId,
      tipo: input.tipo,
      description: input.description,
      value: input.value,
      date: input.date,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (input.tipo === "inclusao_item" && input.item) {
    const { error: e2 } = await supabase.from("contract_addendum_items").insert({
      addendum_id: data.id,
      description: input.item.description,
      value: input.item.value,
      cost_center_id: input.item.costCenterId,
      financial_category: input.item.financialCategory,
    });
    if (e2) throw e2;
  }
  invalidateContracts();
}

export async function deleteAddendum(id: string) {
  const { error } = await supabase.from("contract_addendums").delete().eq("id", id);
  if (error) throw error;
  invalidateContracts();
}

/* =========================================================
   Dashboard por centro de custo (views do banco)
   ========================================================= */

export type CostCenterSummary = {
  costCenterId: string | null;
  costCenterName: string;
  contractCount: number;
  contractedValue: number;
  realizedValue: number;
  balance: number;
};

export type CostCenterAllocation = {
  contractId: string;
  contractNumber: string;
  contractSupplier: string;
  costCenterId: string | null;
  costCenterName: string;
  baseValue: number;
  adjustmentValue: number;
  contractedValue: number;
  realizedValue: number;
};

export type CostCenterSource = {
  contractId: string;
  costCenterId: string | null;
  originType: "contrato" | "aditivo";
  addendumId: string | null;
  addendumDescription: string | null;
  description: string;
  financialCategory: string;
  value: number;
};

export function useCostCenterDashboard() {
  return useQuery({
    queryKey: COST_CENTER_DASHBOARD_KEY,
    queryFn: async () => {
      const [summary, allocation, sources] = await Promise.all([
        supabase.from("v_cost_center_summary").select("*"),
        supabase.from("v_contract_cost_center_allocation").select("*"),
        supabase.from("v_contract_cost_center_sources").select("*"),
      ]);
      if (summary.error) throw summary.error;
      if (allocation.error) throw allocation.error;
      if (sources.error) throw sources.error;

      return {
        summary: (summary.data ?? [])
          .map((r: Row): CostCenterSummary => ({
            costCenterId: r.cost_center_id,
            costCenterName: r.cost_center_name ?? "Sem centro de custo",
            contractCount: Number(r.contract_count ?? 0),
            contractedValue: Number(r.contracted_value ?? 0),
            realizedValue: Number(r.realized_value ?? 0),
            balance: Number(r.balance ?? 0),
          }))
          .sort((a, b) => b.contractedValue - a.contractedValue),
        allocation: (allocation.data ?? []).map((r: Row): CostCenterAllocation => ({
          contractId: r.contract_id,
          contractNumber: r.contract_number,
          contractSupplier: r.contract_supplier,
          costCenterId: r.cost_center_id,
          costCenterName: r.cost_center_name ?? "Sem centro de custo",
          baseValue: Number(r.base_value ?? 0),
          adjustmentValue: Number(r.adjustment_value ?? 0),
          contractedValue: Number(r.contracted_value ?? 0),
          realizedValue: Number(r.realized_value ?? 0),
        })),
        sources: (sources.data ?? []).map((r: Row): CostCenterSource => ({
          contractId: r.contract_id,
          costCenterId: r.cost_center_id,
          originType: r.origin_type,
          addendumId: r.addendum_id,
          addendumDescription: r.addendum_description,
          description: r.description ?? "",
          financialCategory: r.financial_category ?? "",
          value: Number(r.value ?? 0),
        })),
      };
    },
  });
}

/* =========================================================
   Helpers
   ========================================================= */

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatDate = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export function addendumsTotal(c: Contract): number {
  return c.addendums.reduce((s, a) => s + (a.tipo === "ajuste_valor" ? a.value : a.items.reduce((x, i) => x + i.value, 0)), 0);
}

/** Valor vigente do contrato = valor global + aditivos. */
export function contractCurrentValue(c: Contract): number {
  return c.globalValue + addendumsTotal(c);
}

/** Saldo do contrato: abate apenas medições APROVADAS (fluxo de alçada). */
export function contractBalance(c: Contract) {
  const paid = c.measurements
    .filter((m) => m.status === "aprovada")
    .reduce((s, m) => s + m.amount, 0);
  const total = contractCurrentValue(c);
  return { paid, balance: total - paid, pct: total ? paid / total : 0, total };
}

export function daysUntil(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${iso}T00:00:00`);
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
