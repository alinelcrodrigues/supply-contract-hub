import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ROLES = [
  { id: "admin", label: "Administrador", description: "Acesso total ao sistema." },
  { id: "gestor", label: "Gestor de contratos", description: "Cria e edita contratos e medições." },
  { id: "financeiro", label: "Financeiro", description: "Lança medições, despesas e descontos." },
  { id: "leitura", label: "Somente leitura", description: "Consulta contratos sem editar." },
] as const;

export type RoleId = (typeof ROLES)[number]["id"];

export const PERMISSIONS = [
  { id: "contracts.view", label: "Ver contratos" },
  { id: "contracts.manage", label: "Cadastrar / editar contratos" },
  { id: "measurements.manage", label: "Lançar medições e despesas" },
  { id: "params.manage", label: "Parametrizar sistema" },
  { id: "users.manage", label: "Gerenciar usuários" },
] as const;

export type PermissionId = (typeof PERMISSIONS)[number]["id"];

export type CostCenter = { id: string; code: string | null; name: string; active: boolean };
export type Profile = { id: string; name: string; email: string; active: boolean };
export type UserRow = Profile & { role: RoleId };

/* ---------- Cost centers ---------- */
export function useCostCenters() {
  return useQuery({
    queryKey: ["cost_centers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cost_centers").select("*").order("code", { ascending: true });
      if (error) throw error;
      return data as CostCenter[];
    },
  });
}

export function useActiveCostCenters() {
  const q = useCostCenters();
  return { ...q, data: (q.data ?? []).filter((c) => c.active) };
}

export function useCostCenterMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["cost_centers"] });
  return {
    add: useMutation({
      mutationFn: async (v: { code?: string; name: string }) => {
        const { error } = await supabase.from("cost_centers").insert({ code: v.code || null, name: v.name });
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: async ({ id, patch }: { id: string; patch: Partial<CostCenter> }) => {
        const { error } = await supabase.from("cost_centers").update(patch).eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("cost_centers").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
  };
}

/* ---------- Users + roles ---------- */
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const [{ data: profiles, error: pe }, { data: roles, error: re }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pe) throw pe;
      if (re) throw re;
      const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role as RoleId]));
      return (profiles ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        active: p.active,
        role: roleMap.get(p.id) ?? ("gestor" as RoleId),
      })) as UserRow[];
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, active, role }: { id: string; name?: string; active?: boolean; role?: RoleId }) => {
      if (name !== undefined || active !== undefined) {
        const patch: Record<string, unknown> = {};
        if (name !== undefined) patch.name = name;
        if (active !== undefined) patch.active = active;
        const { error } = await supabase.from("profiles").update(patch).eq("id", id);
        if (error) throw error;
      }
      if (role !== undefined) {
        await supabase.from("user_roles").delete().eq("user_id", id);
        const { error } = await supabase.from("user_roles").insert({ user_id: id, role });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

/* ---------- Current user role ---------- */
export function useCurrentUserRole() {
  return useQuery({
    queryKey: ["current_user_role"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return null;
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userRes.user.id).maybeSingle();
      if (error) throw error;
      return (data?.role ?? null) as RoleId | null;
    },
  });
}

/* ---------- Role permissions ---------- */
export function useRolePermissions() {
  return useQuery({
    queryKey: ["role_permissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("role_permissions").select("role, permission");
      if (error) throw error;
      const map: Record<RoleId, Set<string>> = { admin: new Set(), gestor: new Set(), financeiro: new Set(), leitura: new Set() };
      (data ?? []).forEach((r) => { map[r.role as RoleId]?.add(r.permission); });
      return map;
    },
  });
}

export function useToggleRolePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ role, permission, enabled }: { role: RoleId; permission: PermissionId; enabled: boolean }) => {
      if (enabled) {
        const { error } = await supabase.from("role_permissions").insert({ role, permission });
        if (error && !String(error.message).includes("duplicate")) throw error;
      } else {
        const { error } = await supabase.from("role_permissions").delete().eq("role", role).eq("permission", permission);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["role_permissions"] }),
  });
}