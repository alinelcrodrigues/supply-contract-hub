import { useEffect, useSyncExternalStore } from "react";

export const ROLES = [
  { id: "admin", label: "Administrador", description: "Acesso total ao sistema, inclusive parametrização." },
  { id: "gestor", label: "Gestor de contratos", description: "Cria e edita contratos e medições." },
  { id: "financeiro", label: "Financeiro", description: "Lança medições, despesas e descontos." },
  { id: "leitura", label: "Somente leitura", description: "Consulta contratos e dashboard, sem editar." },
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

export type User = {
  id: string;
  name: string;
  email: string;
  roleId: RoleId;
  active: boolean;
  createdAt: string;
};

export type CostCenterRecord = {
  id: string;
  name: string;
  code?: string;
  active: boolean;
};

type RolePermMap = Record<RoleId, PermissionId[]>;

const DEFAULT_ROLE_PERMS: RolePermMap = {
  admin: ["contracts.view", "contracts.manage", "measurements.manage", "params.manage", "users.manage"],
  gestor: ["contracts.view", "contracts.manage", "measurements.manage"],
  financeiro: ["contracts.view", "measurements.manage"],
  leitura: ["contracts.view"],
};

const K_USERS = "params:users:v1";
const K_CC = "params:cost-centers:v1";
const K_PERMS = "params:role-perms:v1";

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  emit();
}

// Seeds
const SEED_USERS: User[] = [
  { id: crypto.randomUUID(), name: "Administrador BALI", email: "admin@baliconstrutora.com.br", roleId: "admin", active: true, createdAt: new Date().toISOString() },
];

const SEED_COST_CENTERS: CostCenterRecord[] = [
  { id: crypto.randomUUID(), name: "Obra Residencial Vila Nova", code: "CC-001", active: true },
  { id: crypto.randomUUID(), name: "Obra Comercial Centro", code: "CC-002", active: true },
  { id: crypto.randomUUID(), name: "Obra Industrial Norte", code: "CC-003", active: true },
  { id: crypto.randomUUID(), name: "Administração Central", code: "CC-100", active: true },
];

function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (!window.localStorage.getItem(K_USERS)) window.localStorage.setItem(K_USERS, JSON.stringify(SEED_USERS));
  if (!window.localStorage.getItem(K_CC)) window.localStorage.setItem(K_CC, JSON.stringify(SEED_COST_CENTERS));
  if (!window.localStorage.getItem(K_PERMS)) window.localStorage.setItem(K_PERMS, JSON.stringify(DEFAULT_ROLE_PERMS));
  emit();
}

// Stable snapshot cache
let cache: { users: User[]; cc: CostCenterRecord[]; perms: RolePermMap } | null = null;
let cacheKey = "";
function snapshot() {
  if (typeof window === "undefined") return { users: [] as User[], cc: [] as CostCenterRecord[], perms: DEFAULT_ROLE_PERMS };
  const raw = (window.localStorage.getItem(K_USERS) ?? "") + "|" + (window.localStorage.getItem(K_CC) ?? "") + "|" + (window.localStorage.getItem(K_PERMS) ?? "");
  if (raw !== cacheKey) {
    cacheKey = raw;
    cache = {
      users: read(K_USERS, SEED_USERS),
      cc: read(K_CC, SEED_COST_CENTERS),
      perms: read(K_PERMS, DEFAULT_ROLE_PERMS),
    };
  }
  return cache!;
}

export function useParams() {
  const data = useSyncExternalStore(subscribe, snapshot, () => ({ users: [], cc: [], perms: DEFAULT_ROLE_PERMS }));
  useEffect(() => { ensureSeeded(); }, []);
  return data;
}

export function useActiveCostCenters(): CostCenterRecord[] {
  return useParams().cc.filter((c) => c.active);
}

// Users CRUD
export function addUser(u: Omit<User, "id" | "createdAt">) {
  const list = read<User[]>(K_USERS, []);
  write(K_USERS, [{ ...u, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...list]);
}
export function updateUser(id: string, patch: Partial<User>) {
  const list = read<User[]>(K_USERS, []).map((u) => (u.id === id ? { ...u, ...patch } : u));
  write(K_USERS, list);
}
export function deleteUser(id: string) {
  write(K_USERS, read<User[]>(K_USERS, []).filter((u) => u.id !== id));
}

// Cost centers CRUD
export function addCostCenter(c: Omit<CostCenterRecord, "id">) {
  const list = read<CostCenterRecord[]>(K_CC, []);
  write(K_CC, [{ ...c, id: crypto.randomUUID() }, ...list]);
}
export function updateCostCenter(id: string, patch: Partial<CostCenterRecord>) {
  write(K_CC, read<CostCenterRecord[]>(K_CC, []).map((c) => (c.id === id ? { ...c, ...patch } : c)));
}
export function deleteCostCenter(id: string) {
  write(K_CC, read<CostCenterRecord[]>(K_CC, []).filter((c) => c.id !== id));
}

// Role permissions
export function setRolePermission(roleId: RoleId, permId: PermissionId, enabled: boolean) {
  const current = read<RolePermMap>(K_PERMS, DEFAULT_ROLE_PERMS);
  const set = new Set(current[roleId] ?? []);
  if (enabled) set.add(permId); else set.delete(permId);
  write(K_PERMS, { ...current, [roleId]: Array.from(set) });
}