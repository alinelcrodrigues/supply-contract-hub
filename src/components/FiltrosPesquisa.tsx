import { useQuery } from "@tanstack/react-query";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCostCenters, useUsers } from "@/lib/params-hooks";

export type SearchArea = "contracts" | "requests" | "measurements" | "addendums" | "loads";

export type SearchFilters = {
  /** mês de criação no formato YYYY-MM */
  createdMonth: string;
  /** mês de competência (referência) no formato YYYY-MM — só medições */
  competenceMonth: string;
  costCenterId: string;
  userId: string;
};

export const emptyFilters: SearchFilters = {
  createdMonth: "",
  competenceMonth: "",
  costCenterId: "",
  userId: "",
};

export function hasActiveFilters(f: SearchFilters) {
  return Boolean(f.createdMonth || f.competenceMonth || f.costCenterId || f.userId);
}

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Aplica os filtros comuns (mês de criação e usuário) em qualquer query do Supabase. */
export function applyCommonFilters<T>(query: T, filters: SearchFilters): T {
  let q = query as any;
  if (filters.createdMonth) {
    const { start, end } = monthRange(filters.createdMonth);
    q = q.gte("created_at", start).lt("created_at", end);
  }
  if (filters.userId) q = q.eq("created_by", filters.userId);
  return q as T;
}

const AREA_CONFIG: Record<
  SearchArea,
  { view: string; ccTable?: string; ccFk?: string; directCostCenter?: boolean }
> = {
  contracts: { view: "v_contracts_search", ccTable: "contract_items", ccFk: "contract_id" },
  requests: { view: "v_contract_requests_search", ccTable: "contract_request_cost_centers", ccFk: "request_id" },
  measurements: {
    view: "v_contract_measurements_search",
    ccTable: "contract_measurement_cost_centers",
    ccFk: "measurement_id",
  },
  addendums: { view: "v_contract_addendums_search", ccTable: "contract_addendum_items", ccFk: "addendum_id" },
  loads: { view: "v_carreteiro_loads_search", directCostCenter: true },
};

/**
 * Resolve os IDs que atendem aos filtros para a aba informada.
 * Retorna `null` quando nenhum filtro está ativo (nada deve ser filtrado).
 */
export function useSearchIds(area: SearchArea, filters: SearchFilters) {
  const cfg = AREA_CONFIG[area];
  const active = hasActiveFilters(filters);

  const query = useQuery({
    queryKey: ["search-ids", area, filters],
    enabled: active,
    queryFn: async () => {
      const db = supabase as any;

      // Filtro de centro de custo: rateio vive numa tabela de detalhe (exceto cargas).
      let ccIds: string[] | null = null;
      if (filters.costCenterId && !cfg.directCostCenter && cfg.ccTable && cfg.ccFk) {
        const { data, error } = await db
          .from(cfg.ccTable)
          .select(cfg.ccFk)
          .eq("cost_center_id", filters.costCenterId);
        if (error) throw error;
        ccIds = Array.from(new Set((data ?? []).map((r: any) => r[cfg.ccFk!]).filter(Boolean)));
        if (ccIds.length === 0) return [] as string[];
      }

      let q = db.from(cfg.view).select("id");
      q = applyCommonFilters(q, filters);
      if (filters.competenceMonth && area === "measurements") {
        const [y, m] = filters.competenceMonth.split("-").map(Number);
        const start = new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 10);
        const end = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
        q = q.gte("reference_month", start).lt("reference_month", end);
      }
      if (filters.costCenterId && cfg.directCostCenter) q = q.eq("cost_center_id", filters.costCenterId);
      if (ccIds) q = q.in("id", ccIds);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r: any) => r.id as string);
    },
  });

  return {
    ids: active ? (query.data ?? null) : null,
    isLoading: active && query.isLoading,
  };
}

function activeCount(f: SearchFilters) {
  return [f.createdMonth, f.competenceMonth, f.costCenterId, f.userId].filter(Boolean).length;
}

export default function FiltrosPesquisa({
  value,
  onChange,
  showCompetenceMonth = false,
}: {
  value: SearchFilters;
  onChange: (f: SearchFilters) => void;
  showCompetenceMonth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { data: costCenters } = useActiveCostCenters();
  const { data: users } = useUsers();
  const set = (patch: Partial<SearchFilters>) => onChange({ ...value, ...patch });
  const count = activeCount(value);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
          <Filter className="mr-2 h-4 w-4 text-primary" />
          Filtros
          {count > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
              {count}
            </span>
          )}
          <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </Button>
        {count > 0 && (
          <Button variant="ghost" size="sm" onClick={() => onChange(emptyFilters)}>
            <X className="mr-1 h-4 w-4" /> Limpar
          </Button>
        )}
      </div>

      {open && (
        <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm">
          <div className={`grid gap-3 ${showCompetenceMonth ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Mês de criação</Label>
              <Input type="month" value={value.createdMonth} onChange={(e) => set({ createdMonth: e.target.value })} />
            </div>
            {showCompetenceMonth && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Mês de competência</Label>
                <Input
                  type="month"
                  value={value.competenceMonth}
                  onChange={(e) => set({ competenceMonth: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Centro de custo</Label>
              <Select
                value={value.costCenterId || "all"}
                onValueChange={(v) => set({ costCenterId: v === "all" ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(costCenters ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code ? `${c.code} — ${c.name}` : c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Criado por</Label>
              <Select value={value.userId || "all"} onValueChange={(v) => set({ userId: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(users ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

