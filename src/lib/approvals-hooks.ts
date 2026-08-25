import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createStoragePath } from "@/lib/storage-path";

/* =========================================================
   Tipos
   ========================================================= */

export type TierKind = "contract" | "measurement";

export type Tier = {
  id: string;
  name: string;
  min_value: number;
  max_value: number | null;
  active: boolean;
  steps: { id: string; step_order: number; approver_id: string }[];
};

export type RequestStatus = "rascunho" | "em_aprovacao" | "aprovada" | "reprovada";

export type ContractRequest = {
  id: string;
  requester_id: string;
  status: RequestStatus;
  tier_id: string | null;
  current_step: number;
  supplier_cnpj: string;
  supplier_name: string;
  supplier_address: string;
  supplier_representative: string;
  object: string;
  specification: string;
  deadline_days: number;
  payment_terms: string;
  obligations_contractor: string;
  obligations_contracted: string;
  financial_category: string;
  total_value: number;
  rejection_reason: string | null;
  contract_id: string | null;
  created_at: string;
  contract_request_cost_centers: { id: string; cost_center_id: string | null; value: number }[];
  contract_request_approvals: {
    id: string; step_order: number; approver_id: string; decision: string; comment: string | null; created_at: string;
  }[];
  contract_request_documents: { id: string; file_name: string; file_path: string }[];
};

export type Measurement = {
  id: string;
  contract_id: string;
  created_by: string;
  status: RequestStatus;
  tier_id: string | null;
  current_step: number;
  reference_month: string;
  total_value: number;
  notes: string;
  rejection_reason: string | null;
  created_at: string;
  contracts: { number: string; supplier: string } | null;
  contract_measurement_cost_centers: { id: string; cost_center_id: string | null; value: number }[];
  contract_measurement_approvals: {
    id: string; step_order: number; approver_id: string; decision: string; comment: string | null; created_at: string;
  }[];
};

export type MovementStatus = "aguardando_documento" | "aguardando_pagamento" | "pago";

export type FinancialMovement = {
  id: string;
  measurement_id: string;
  contract_id: string;
  amount: number;
  status: MovementStatus;
  due_date: string | null;
  paid_at: string | null;
  notes: string;
  created_at: string;
  contracts: { number: string; supplier: string } | null;
  billing_documents: { id: string; doc_type: string; doc_number: string; file_name: string; file_path: string }[];
};

const db = supabase as any;

/* =========================================================
   Sessão
   ========================================================= */

export function useCurrentUserId() {
  return useQuery({
    queryKey: ["current_user_id"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user?.id ?? null;
    },
  });
}

/* =========================================================
   Faixas de alçada (contrato e medição)
   ========================================================= */

const tierTables = {
  contract: { tiers: "approval_tiers", steps: "approval_tier_steps" },
  measurement: { tiers: "measurement_approval_tiers", steps: "measurement_approval_tier_steps" },
} as const;

export function useTiers(kind: TierKind) {
  const t = tierTables[kind];
  return useQuery({
    queryKey: ["tiers", kind],
    queryFn: async (): Promise<Tier[]> => {
      const { data, error } = await db
        .from(t.tiers)
        .select(`*, ${t.steps} ( id, step_order, approver_id )`)
        .order("min_value", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        min_value: Number(r.min_value ?? 0),
        max_value: r.max_value === null ? null : Number(r.max_value),
        active: !!r.active,
        steps: [...(r[t.steps] ?? [])].sort((a: any, b: any) => a.step_order - b.step_order),
      }));
    },
  });
}

export function useTierMutations(kind: TierKind) {
  const t = tierTables[kind];
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["tiers", kind] });
  return {
    addTier: useMutation({
      mutationFn: async (v: { name: string; min_value: number; max_value: number | null }) => {
        const { error } = await db.from(t.tiers).insert(v);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    updateTier: useMutation({
      mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
        const { error } = await db.from(t.tiers).update(patch).eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    removeTier: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await db.from(t.tiers).delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    addStep: useMutation({
      mutationFn: async (v: { tier_id: string; step_order: number; approver_id: string }) => {
        const { error } = await db.from(t.steps).insert(v);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    removeStep: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await db.from(t.steps).delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
  };
}

/* =========================================================
   Solicitações de contrato
   ========================================================= */

const REQUEST_KEY = ["contract_requests"];

export function useContractRequests() {
  return useQuery({
    queryKey: REQUEST_KEY,
    queryFn: async (): Promise<ContractRequest[]> => {
      const { data, error } = await db
        .from("contract_requests")
        .select(
          `*, contract_request_cost_centers ( id, cost_center_id, value ),
             contract_request_approvals ( id, step_order, approver_id, decision, comment, created_at ),
             contract_request_documents ( id, file_name, file_path )`,
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContractRequest[];
    },
  });
}

export function useContractRequestMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: REQUEST_KEY });
    qc.invalidateQueries({ queryKey: ["contracts"] });
    qc.invalidateQueries({ queryKey: ["cost-center-dashboard"] });
  };

  return {
    create: useMutation({
      mutationFn: async (input: {
        fields: Record<string, unknown>;
        rateio: { cost_center_id: string | null; value: number }[];
        files: File[];
        submit: boolean;
      }) => {
        const { data: userRes } = await supabase.auth.getUser();
        const uid = userRes.user?.id;
        if (!uid) throw new Error("Sessão expirada");

        const { data, error } = await db
          .from("contract_requests")
          .insert({ ...input.fields, requester_id: uid })
          .select("id")
          .single();
        if (error) throw error;
        const requestId = data.id as string;

        if (input.rateio.length) {
          const { error: e2 } = await db
            .from("contract_request_cost_centers")
            .insert(input.rateio.map((r) => ({ ...r, request_id: requestId })));
          if (e2) throw e2;
        }

        for (const file of input.files) {
          const path = createStoragePath(requestId, file.name);
          const { error: upErr } = await supabase.storage.from("contract-request-documents").upload(path, file);
          if (upErr) throw upErr;
          const { error: docErr } = await db.from("contract_request_documents").insert({
            request_id: requestId, file_name: file.name, file_path: path, uploaded_by: uid,
          });
          if (docErr) throw docErr;
        }

        if (input.submit) {
          const { error: sErr } = await db.rpc("fn_submit_contract_request", { _request_id: requestId });
          if (sErr) throw sErr;
        }
        return requestId;
      },
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: async (input: {
        id: string;
        fields: Record<string, unknown>;
        rateio?: { cost_center_id: string | null; value: number }[];
      }) => {
        const { error } = await db.from("contract_requests").update(input.fields).eq("id", input.id);
        if (error) throw error;
        if (input.rateio) {
          const { error: delErr } = await db
            .from("contract_request_cost_centers")
            .delete()
            .eq("request_id", input.id);
          if (delErr) throw delErr;
          if (input.rateio.length) {
            const { error: insErr } = await db
              .from("contract_request_cost_centers")
              .insert(input.rateio.map((r) => ({ ...r, request_id: input.id })));
            if (insErr) throw insErr;
          }
        }
      },
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await db.from("contract_requests").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    submit: useMutation({

      mutationFn: async (id: string) => {
        const { error } = await db.rpc("fn_submit_contract_request", { _request_id: id });
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    decide: useMutation({
      mutationFn: async ({ id, approve, comment }: { id: string; approve: boolean; comment?: string }) => {
        const { error } = await db.rpc("fn_decide_contract_request", {
          _request_id: id, _approve: approve, _comment: comment ?? null,
        });
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
  };
}

/* =========================================================
   Medições com alçada
   ========================================================= */

const MEASUREMENT_KEY = ["contract_measurements"];

export function useApprovalMeasurements() {
  return useQuery({
    queryKey: MEASUREMENT_KEY,
    queryFn: async (): Promise<Measurement[]> => {
      const { data, error } = await db
        .from("contract_measurements")
        .select(
          `*, contracts ( number, supplier ),
             contract_measurement_cost_centers ( id, cost_center_id, value ),
             contract_measurement_approvals ( id, step_order, approver_id, decision, comment, created_at )`,
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Measurement[];
    },
  });
}

export function useMeasurementMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: MEASUREMENT_KEY });
    qc.invalidateQueries({ queryKey: ["financial_movements"] });
  };

  return {
    create: useMutation({
      mutationFn: async (input: {
        fields: { contract_id: string; reference_month: string; total_value: number; notes: string };
        rateio: { cost_center_id: string | null; value: number }[];
        submit: boolean;
      }) => {
        const { data: userRes } = await supabase.auth.getUser();
        const uid = userRes.user?.id;
        if (!uid) throw new Error("Sessão expirada");

        const { data, error } = await db
          .from("contract_measurements")
          .insert({ ...input.fields, created_by: uid })
          .select("id")
          .single();
        if (error) throw error;
        const id = data.id as string;

        if (input.rateio.length) {
          const { error: e2 } = await db
            .from("contract_measurement_cost_centers")
            .insert(input.rateio.map((r) => ({ ...r, measurement_id: id })));
          if (e2) throw e2;
        }
        if (input.submit) {
          const { error: sErr } = await db.rpc("fn_submit_measurement", { _measurement_id: id });
          if (sErr) throw sErr;
        }
        return id;
      },
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: async (input: {
        id: string;
        fields: Record<string, unknown>;
        rateio?: { cost_center_id: string | null; value: number }[];
      }) => {
        const { error } = await db.from("contract_measurements").update(input.fields).eq("id", input.id);
        if (error) throw error;
        if (input.rateio) {
          const { error: delErr } = await db
            .from("contract_measurement_cost_centers")
            .delete()
            .eq("measurement_id", input.id);
          if (delErr) throw delErr;
          if (input.rateio.length) {
            const { error: insErr } = await db
              .from("contract_measurement_cost_centers")
              .insert(input.rateio.map((r) => ({ ...r, measurement_id: input.id })));
            if (insErr) throw insErr;
          }
        }
      },
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await db.from("contract_measurements").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    submit: useMutation({

      mutationFn: async (id: string) => {
        const { error } = await db.rpc("fn_submit_measurement", { _measurement_id: id });
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    decide: useMutation({
      mutationFn: async ({ id, approve, comment }: { id: string; approve: boolean; comment?: string }) => {
        const { error } = await db.rpc("fn_decide_measurement", {
          _measurement_id: id, _approve: approve, _comment: comment ?? null,
        });
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
  };
}

/* =========================================================
   Fluxo financeiro
   ========================================================= */

export function useFinancialMovements() {
  return useQuery({
    queryKey: ["financial_movements"],
    queryFn: async (): Promise<FinancialMovement[]> => {
      const { data, error } = await db
        .from("financial_movements")
        .select(`*, contracts ( number, supplier ), billing_documents ( id, doc_type, doc_number, file_name, file_path )`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FinancialMovement[];
    },
  });
}

export function useMovementMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["financial_movements"] });
  return {
    attachDocument: useMutation({
      mutationFn: async (input: { movementId: string; docType: string; docNumber: string; file: File; dueDate?: string }) => {
        const { data: userRes } = await supabase.auth.getUser();
        const uid = userRes.user?.id ?? null;
        const path = createStoragePath(input.movementId, input.file.name);
        const { error: upErr } = await supabase.storage.from("billing-documents").upload(path, input.file);
        if (upErr) throw upErr;
        const { error } = await db.from("billing_documents").insert({
          movement_id: input.movementId,
          doc_type: input.docType,
          doc_number: input.docNumber,
          file_name: input.file.name,
          file_path: path,
          uploaded_by: uid,
        });
        if (error) throw error;
        if (input.dueDate) {
          await db.from("financial_movements").update({ due_date: input.dueDate }).eq("id", input.movementId);
        }
      },
      onSuccess: invalidate,
    }),
    markPaid: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await db.rpc("fn_mark_movement_paid", { _movement_id: id });
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
  };
}

export async function downloadFile(bucket: string, path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
  if (error) throw error;
  window.open(data.signedUrl, "_blank");
}