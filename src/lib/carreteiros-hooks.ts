import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type PlateStatus = "pendente" | "aprovada" | "recusada";
export type PricingMode = "km" | "tonelada" | "km_tonelada";

export const PRICING_LABEL: Record<PricingMode, string> = {
  km: "Por km",
  tonelada: "Por tonelada",
  km_tonelada: "Por km × tonelada",
};

export type Plate = {
  id: string;
  plate: string;
  driver_name: string;
  notes: string;
  status: PlateStatus;
  active: boolean;
  created_at: string;
};

export type CarreteiroContract = {
  id: string;
  number: string;
  carrier_name: string;
  pricing_mode: PricingMode;
  unit_price: number;
  cost_center_id: string | null;
  financial_category: string;
  start_date: string;
  end_date: string | null;
  notes: string;
  active: boolean;
  contract_id: string | null;
  cost_centers?: { name: string } | null;
};

export type PlateLink = {
  id: string;
  plate_id: string;
  contract_id: string;
  start_date: string;
  end_date: string | null;
  carreteiro_plates?: { plate: string } | null;
  carreteiro_contracts?: { number: string; carrier_name: string } | null;
};

export type Load = {
  id: string;
  contract_id: string;
  plate_id: string;
  load_date: string;
  origin: string;
  destination: string;
  km: number;
  tons: number;
  unit_price: number;
  pricing_mode: PricingMode;
  total_value: number;
  cost_center_id: string | null;
  financial_category: string;
  notes: string;
  closing_id: string | null;
  carreteiro_plates?: { plate: string } | null;
  carreteiro_contracts?: { number: string } | null;
};

export type Fuel = {
  id: string;
  plate_id: string;
  contract_id: string | null;
  fuel_date: string;
  liters: number;
  price_per_liter: number;
  total_value: number;
  cost_center_id: string | null;
  notes: string;
  closing_id: string | null;
  carreteiro_plates?: { plate: string } | null;
};

export type Closing = {
  id: string;
  contract_id: string;
  period_start: string;
  period_end: string;
  loads_total: number;
  fuel_total: number;
  net_total: number;
  measurement_id: string | null;
  created_at: string;
  carreteiro_contracts?: { number: string; carrier_name: string } | null;
};

export function computeLoadValue(mode: PricingMode, km: number, tons: number, price: number) {
  if (mode === "km") return km * price;
  if (mode === "tonelada") return tons * price;
  return km * tons * price;
}

export function useCanManageCarreteiros() {
  return useQuery({
    queryKey: ["can_manage_carreteiros"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return false;
      const { data, error } = await db.rpc("has_permission", { _user_id: uid, _permission: "carreteiros.manage" });
      if (error) throw error;
      return !!data;
    },
  });
}

/* ---------------- Placas ---------------- */
export function usePlates() {
  return useQuery({
    queryKey: ["carreteiro_plates"],
    queryFn: async () => {
      const { data, error } = await db.from("carreteiro_plates").select("*").order("plate");
      if (error) throw error;
      return (data ?? []) as Plate[];
    },
  });
}

export function usePlateMutations() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ["carreteiro_plates"] });
  return {
    add: useMutation({
      mutationFn: async (v: { plate: string; driver_name: string; notes: string }) => {
        const { data: userRes } = await supabase.auth.getUser();
        const { error } = await db.from("carreteiro_plates").insert({
          plate: v.plate.toUpperCase().trim(),
          driver_name: v.driver_name,
          notes: v.notes,
          created_by: userRes.user?.id ?? null,
        });
        if (error) throw error;
      },
      onSuccess: inv,
    }),
    setStatus: useMutation({
      mutationFn: async ({ id, status }: { id: string; status: PlateStatus }) => {
        const { data: userRes } = await supabase.auth.getUser();
        const { error } = await db
          .from("carreteiro_plates")
          .update({ status, approved_by: userRes.user?.id ?? null, approved_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      },
      onSuccess: inv,
    }),
    update: useMutation({
      mutationFn: async ({ id, patch }: { id: string; patch: Partial<Plate> }) => {
        const { error } = await db.from("carreteiro_plates").update(patch).eq("id", id);
        if (error) throw error;
      },
      onSuccess: inv,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await db.from("carreteiro_plates").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: inv,
    }),
  };
}

/* ---------------- Contratos ---------------- */
export function useCarreteiroContracts() {
  return useQuery({
    queryKey: ["carreteiro_contracts"],
    queryFn: async () => {
      const { data, error } = await db
        .from("carreteiro_contracts")
        .select("*, cost_centers ( name )")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CarreteiroContract[];
    },
  });
}

export function useCarreteiroContractMutations() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ["carreteiro_contracts"] });
  return {
    add: useMutation({
      mutationFn: async (v: Partial<CarreteiroContract>) => {
        const { data: userRes } = await supabase.auth.getUser();
        const { error } = await db.from("carreteiro_contracts").insert({ ...v, created_by: userRes.user?.id ?? null });
        if (error) throw error;
      },
      onSuccess: inv,
    }),
    update: useMutation({
      mutationFn: async ({ id, patch }: { id: string; patch: Partial<CarreteiroContract> }) => {
        const { error } = await db.from("carreteiro_contracts").update(patch).eq("id", id);
        if (error) throw error;
      },
      onSuccess: inv,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await db.from("carreteiro_contracts").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: inv,
    }),
  };
}

/* ---------------- Vínculos placa × contrato ---------------- */
export function usePlateLinks() {
  return useQuery({
    queryKey: ["carreteiro_plate_links"],
    queryFn: async () => {
      const { data, error } = await db
        .from("carreteiro_plate_links")
        .select("*, carreteiro_plates ( plate ), carreteiro_contracts ( number, carrier_name )")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PlateLink[];
    },
  });
}

export function usePlateLinkMutations() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ["carreteiro_plate_links"] });
  return {
    add: useMutation({
      mutationFn: async (v: { plate_id: string; contract_id: string; start_date: string; end_date: string | null }) => {
        const { data: userRes } = await supabase.auth.getUser();
        const { error } = await db.from("carreteiro_plate_links").insert({ ...v, created_by: userRes.user?.id ?? null });
        if (error) throw error;
      },
      onSuccess: inv,
    }),
    close: useMutation({
      mutationFn: async ({ id, end_date }: { id: string; end_date: string }) => {
        const { error } = await db.from("carreteiro_plate_links").update({ end_date }).eq("id", id);
        if (error) throw error;
      },
      onSuccess: inv,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await db.from("carreteiro_plate_links").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: inv,
    }),
  };
}

/* ---------------- Cargas ---------------- */
export function useLoads(contractId?: string) {
  return useQuery({
    queryKey: ["carreteiro_loads", contractId ?? "all"],
    queryFn: async () => {
      let q = db
        .from("carreteiro_loads")
        .select("*, carreteiro_plates ( plate ), carreteiro_contracts ( number )")
        .order("load_date", { ascending: false })
        .limit(300);
      if (contractId) q = q.eq("contract_id", contractId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Load[];
    },
  });
}

export function useLoadMutations() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ["carreteiro_loads"] });
  return {
    add: useMutation({
      mutationFn: async (v: Record<string, unknown>) => {
        const { data: userRes } = await supabase.auth.getUser();
        const { error } = await db.from("carreteiro_loads").insert({ ...v, created_by: userRes.user?.id ?? null });
        if (error) throw error;
      },
      onSuccess: inv,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await db.from("carreteiro_loads").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: inv,
    }),
  };
}

/* ---------------- Combustível ---------------- */
export function useFuel() {
  return useQuery({
    queryKey: ["carreteiro_fuel"],
    queryFn: async () => {
      const { data, error } = await db
        .from("carreteiro_fuel")
        .select("*, carreteiro_plates ( plate )")
        .order("fuel_date", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as Fuel[];
    },
  });
}

export function useFuelMutations() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ["carreteiro_fuel"] });
  return {
    add: useMutation({
      mutationFn: async (v: Record<string, unknown>) => {
        const { data: userRes } = await supabase.auth.getUser();
        const { error } = await db.from("carreteiro_fuel").insert({ ...v, created_by: userRes.user?.id ?? null });
        if (error) throw error;
      },
      onSuccess: inv,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await db.from("carreteiro_fuel").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: inv,
    }),
  };
}

/* ---------------- Fechamentos ---------------- */
export function useClosings() {
  return useQuery({
    queryKey: ["carreteiro_closings"],
    queryFn: async () => {
      const { data, error } = await db
        .from("carreteiro_closings")
        .select("*, carreteiro_contracts ( number, carrier_name )")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Closing[];
    },
  });
}

export function useGenerateClosing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { contractId: string; start: string; end: string }) => {
      const { data, error } = await db.rpc("fn_generate_carreteiro_closing", {
        _cc_id: v.contractId,
        _start: v.start,
        _end: v.end,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["carreteiro_closings"] });
      qc.invalidateQueries({ queryKey: ["carreteiro_loads"] });
      qc.invalidateQueries({ queryKey: ["carreteiro_fuel"] });
      qc.invalidateQueries({ queryKey: ["measurements"] });
      qc.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
}
