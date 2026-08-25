import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type FinancialCategoryRow = {
  id: string;
  name: string;
  kind: "receita" | "despesa";
  active: boolean;
};

export function useFinancialCategories(onlyActive = true) {
  return useQuery({
    queryKey: ["financial_categories", onlyActive],
    queryFn: async (): Promise<FinancialCategoryRow[]> => {
      let q = db.from("financial_categories").select("*").order("name", { ascending: true }).limit(1000);
      if (onlyActive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as FinancialCategoryRow[];
    },
  });
}

export function useFinancialCategoryMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["financial_categories"] });
  return {
    save: useMutation({
      mutationFn: async ({ id, values }: { id?: string; values: Partial<FinancialCategoryRow> }) => {
        if (id) {
          const { error } = await db.from("financial_categories").update(values).eq("id", id);
          if (error) throw error;
        } else {
          const { error } = await db.from("financial_categories").insert(values);
          if (error) throw error;
        }
      },
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await db.from("financial_categories").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
  };
}
