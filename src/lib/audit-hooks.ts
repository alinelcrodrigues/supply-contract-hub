import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type AuditEntry = {
  id: string;
  table_name: string;
  record_id: string | null;
  action: "INSERT" | "UPDATE" | "DELETE";
  changed_by: string | null;
  changed_fields: string[];
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
};

/** Áreas de negócio agrupando as tabelas auditadas. */
export const AUDIT_AREAS: { id: string; label: string; tables: string[] }[] = [
  {
    id: "contratos",
    label: "Contratos",
    tables: ["contracts", "contract_items", "contract_addendums", "contract_addendum_items", "contract_documents"],
  },
  {
    id: "solicitacoes",
    label: "Solicitações",
    tables: [
      "contract_requests",
      "contract_request_cost_centers",
      "contract_request_documents",
      "contract_request_approvals",
    ],
  },
  {
    id: "medicoes",
    label: "Medições",
    tables: ["contract_measurements", "contract_measurement_cost_centers", "contract_measurement_approvals", "measurements"],
  },
  { id: "financeiro", label: "Financeiro", tables: ["financial_movements", "billing_documents"] },
  {
    id: "cadastros",
    label: "Cadastros mestres",
    tables: ["cost_centers", "financial_categories", "suppliers", "products_services"],
  },
  {
    id: "alcadas",
    label: "Alçadas",
    tables: ["approval_tiers", "approval_tier_steps", "measurement_approval_tiers", "measurement_approval_tier_steps"],
  },
  { id: "usuarios", label: "Usuários e permissões", tables: ["profiles", "user_roles", "role_permissions"] },
  {
    id: "carreteiros",
    label: "Carreteiros",
    tables: [
      "carreteiro_plates",
      "carreteiro_contracts",
      "carreteiro_plate_links",
      "carreteiro_loads",
      "carreteiro_fuel",
      "carreteiro_closings",
    ],
  },
];

export const TABLE_LABEL: Record<string, string> = {
  contracts: "Contrato",
  contract_items: "Item de contrato",
  contract_addendums: "Aditivo",
  contract_addendum_items: "Item de aditivo",
  contract_documents: "Documento de contrato",
  contract_requests: "Solicitação",
  contract_request_cost_centers: "Rateio da solicitação",
  contract_request_documents: "Documento da solicitação",
  contract_request_approvals: "Aprovação da solicitação",
  contract_measurements: "Medição",
  contract_measurement_cost_centers: "Rateio da medição",
  contract_measurement_approvals: "Aprovação da medição",
  measurements: "Medição (legado)",
  financial_movements: "Movimento financeiro",
  billing_documents: "Documento de cobrança",
  cost_centers: "Centro de custo",
  financial_categories: "Categoria financeira",
  suppliers: "Fornecedor",
  products_services: "Produto / serviço",
  approval_tiers: "Faixa de alçada",
  approval_tier_steps: "Aprovador da faixa",
  measurement_approval_tiers: "Faixa de alçada (medição)",
  measurement_approval_tier_steps: "Aprovador da faixa (medição)",
  profiles: "Usuário",
  user_roles: "Papel de usuário",
  role_permissions: "Permissão de papel",
  carreteiro_plates: "Placa",
  carreteiro_contracts: "Contrato de carreteiro",
  carreteiro_plate_links: "Vínculo placa × contrato",
  carreteiro_loads: "Carga",
  carreteiro_fuel: "Abastecimento",
  carreteiro_closings: "Fechamento de carreteiro",
};

export const ACTION_LABEL: Record<string, string> = {
  INSERT: "Criação",
  UPDATE: "Alteração",
  DELETE: "Exclusão",
};

export function useAuditLog(opts: { area?: string; recordId?: string; tables?: string[]; limit?: number }) {
  const { area, recordId, tables, limit = 200 } = opts;
  return useQuery({
    queryKey: ["audit_log", area ?? "todas", recordId ?? "", tables?.join(",") ?? "", limit],
    queryFn: async () => {
      let q = db.from("audit_log").select("*").order("created_at", { ascending: false }).limit(limit);
      const areaTables = tables ?? AUDIT_AREAS.find((a) => a.id === area)?.tables;
      if (areaTables?.length) q = q.in("table_name", areaTables);
      if (recordId) q = q.eq("record_id", recordId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AuditEntry[];
    },
  });
}

/* ---------------- Cancelamentos ---------------- */
async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function useCancelMutations() {
  const qc = useQueryClient();
  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["contracts"] });
    qc.invalidateQueries({ queryKey: ["contract_requests"] });
    qc.invalidateQueries({ queryKey: ["measurements"] });
    qc.invalidateQueries({ queryKey: ["audit_log"] });
  };
  return {
    cancelContract: useMutation({
      mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
        const { error } = await db.rpc("fn_cancel_contract", {
          _contract_id: id,
          _user_id: await currentUserId(),
          _reason: reason,
        });
        if (error) throw error;
      },
      onSuccess: invalidateAll,
    }),
    cancelRequest: useMutation({
      mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
        const { error } = await db.rpc("fn_cancel_contract_request", {
          _request_id: id,
          _user_id: await currentUserId(),
          _reason: reason,
        });
        if (error) throw error;
      },
      onSuccess: invalidateAll,
    }),
    cancelMeasurement: useMutation({
      mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
        const { error } = await db.rpc("fn_cancel_measurement", {
          _measurement_id: id,
          _user_id: await currentUserId(),
          _reason: reason,
        });
        if (error) throw error;
      },
      onSuccess: invalidateAll,
    }),
  };
}
