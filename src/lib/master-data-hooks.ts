import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type Supplier = {
  id: string;
  trade_name: string;
  legal_name: string;
  doc: string | null;
  doc_type: string;
  address: string;
  district: string;
  city: string;
  state: string;
  zip_code: string;
  contact_name: string;
  representative: string;
  email: string;
  phone: string;
  notes: string;
  active: boolean;
};

export type ProductService = {
  id: string;
  kind: "produto" | "servico";
  sku: string | null;
  name: string;
  fiscal_code: string;
  unit: string;
  active: boolean;
};

export const emptySupplier = (): Omit<Supplier, "id"> => ({
  trade_name: "",
  legal_name: "",
  doc: "",
  doc_type: "CNPJ",
  address: "",
  district: "",
  city: "",
  state: "",
  zip_code: "",
  contact_name: "",
  representative: "",
  email: "",
  phone: "",
  notes: "",
  active: true,
});

export const emptyProductService = (kind: "produto" | "servico" = "produto"): Omit<ProductService, "id"> => ({
  kind,
  sku: "",
  name: "",
  fiscal_code: "",
  unit: "",
  active: true,
});

/* ---------- Permissão ---------- */
export function useCanManageMasterData() {
  return useQuery({
    queryKey: ["can_manage_master_data"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return false;
      const { data, error } = await db.from("user_roles").select("role").eq("user_id", uid);
      if (error) throw error;
      return (data ?? []).some((r: any) => r.role === "admin" || r.role === "comprador");
    },
  });
}

/* ---------- Fornecedores ---------- */
export function useSuppliers(search = "") {
  return useQuery({
    queryKey: ["suppliers", search],
    queryFn: async (): Promise<Supplier[]> => {
      let q = db.from("suppliers").select("*").order("trade_name", { ascending: true }).limit(200);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`trade_name.ilike.${s},legal_name.ilike.${s},doc.ilike.${s}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Supplier[];
    },
  });
}

export function useSupplierMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["suppliers"] });
  return {
    save: useMutation({
      mutationFn: async ({ id, values }: { id?: string; values: Partial<Supplier> }) => {
        if (id) {
          const { error } = await db.from("suppliers").update(values).eq("id", id);
          if (error) throw error;
        } else {
          const { error } = await db.from("suppliers").insert(values);
          if (error) throw error;
        }
      },
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await db.from("suppliers").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
  };
}

/* ---------- Produtos e serviços ---------- */
export function useProductsServices(kind: "produto" | "servico" | "todos" = "todos", search = "") {
  return useQuery({
    queryKey: ["products_services", kind, search],
    queryFn: async (): Promise<ProductService[]> => {
      let q = db.from("products_services").select("*").order("name", { ascending: true }).limit(200);
      if (kind !== "todos") q = q.eq("kind", kind);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`name.ilike.${s},sku.ilike.${s},fiscal_code.ilike.${s}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ProductService[];
    },
  });
}

export function useProductServiceMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["products_services"] });
  return {
    save: useMutation({
      mutationFn: async ({ id, values }: { id?: string; values: Partial<ProductService> }) => {
        if (id) {
          const { error } = await db.from("products_services").update(values).eq("id", id);
          if (error) throw error;
        } else {
          const { error } = await db.from("products_services").insert(values);
          if (error) throw error;
        }
      },
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await db.from("products_services").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
  };
}
