import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatDate } from "@/lib/contracts-store";

type AllocationRow = {
  contract_id: string | null;
  cost_center_id: string | null;
  cost_center_name: string | null;
  contracted_value: number | null;
  realized_value: number | null;
};

type ContractRow = {
  id: string;
  global_value: number;
  start_date: string;
  end_date: string;
};

function useIndicadores(contractId: string) {
  return useQuery({
    queryKey: ["contract-indicators", contractId],
    queryFn: async () => {
      const [{ data: contract, error: ce }, { data: alloc, error: ae }] = await Promise.all([
        supabase
          .from("contracts")
          .select("id, global_value, start_date, end_date")
          .eq("id", contractId)
          .maybeSingle(),
        supabase
          .from("v_contract_cost_center_allocation")
          .select("contract_id, cost_center_id, cost_center_name, contracted_value, realized_value")
          .eq("contract_id", contractId),
      ]);
      if (ce) throw ce;
      if (ae) throw ae;
      return {
        contract: (contract ?? null) as ContractRow | null,
        allocation: (alloc ?? []) as AllocationRow[],
      };
    },
  });
}

const DONUT = ["hsl(var(--primary))", "hsl(var(--muted))"];

export default function DashboardIndicadoresContrato({ contractId }: { contractId: string }) {
  const { data, isLoading } = useIndicadores(contractId);

  const view = useMemo(() => {
    const contract = data?.contract;
    const rows = data?.allocation ?? [];
    const contracted = rows.reduce((s, r) => s + Number(r.contracted_value ?? 0), 0) || Number(contract?.global_value ?? 0);
    const realized = rows.reduce((s, r) => s + Number(r.realized_value ?? 0), 0);
    const pct = contracted > 0 ? Math.min(realized / contracted, 1) : 0;

    let elapsedPct = 0;
    let daysLeft = 0;
    let totalDays = 0;
    if (contract) {
      const start = new Date(contract.start_date).getTime();
      const end = new Date(contract.end_date).getTime();
      const now = Date.now();
      totalDays = Math.max(1, Math.round((end - start) / 86400000));
      elapsedPct = Math.min(1, Math.max(0, (now - start) / Math.max(1, end - start)));
      daysLeft = Math.ceil((end - now) / 86400000);
    }
    return { contract, rows, contracted, realized, pct, elapsedPct, daysLeft, totalDays };
  }, [data]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando indicadores…</p>;
  if (!view.contract) return null;

  const pctLabel = `${(view.pct * 100).toFixed(1)}%`;
  const saldo = view.contracted - view.realized;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Indicadores do contrato</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex items-center gap-4">
            <div className="relative h-32 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Realizado", value: view.realized },
                      { name: "Saldo", value: Math.max(0, saldo) },
                    ]}
                    dataKey="value"
                    innerRadius={44}
                    outerRadius={62}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {DONUT.map((c) => (
                      <Cell key={c} fill={c} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-semibold text-foreground">{pctLabel}</span>
                <span className="text-[11px] text-muted-foreground">executado</span>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Previsto</div>
              <div className="font-semibold text-foreground">{formatBRL(view.contracted)}</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Realizado</div>
              <div className="font-semibold text-foreground">{formatBRL(view.realized)}</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Saldo</div>
              <div className="font-semibold text-primary">{formatBRL(saldo)}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Vigência</span>
              <Badge variant={view.daysLeft < 0 ? "destructive" : view.daysLeft <= 60 ? "secondary" : "outline"}>
                {view.daysLeft < 0 ? `Vencido há ${-view.daysLeft}d` : `${view.daysLeft} dias restantes`}
              </Badge>
            </div>
            <Progress value={view.elapsedPct * 100} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatDate(view.contract.start_date)}</span>
              <span>{(view.elapsedPct * 100).toFixed(0)}% do prazo · {view.totalDays} dias</span>
              <span>{formatDate(view.contract.end_date)}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-foreground">Previsto x realizado por centro de custo</div>
          {view.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem rateio por centro de custo neste contrato.</p>
          ) : (
            <div className="space-y-3">
              {view.rows.map((r) => {
                const prev = Number(r.contracted_value ?? 0);
                const real = Number(r.realized_value ?? 0);
                const p = prev > 0 ? Math.min(real / prev, 1) : 0;
                return (
                  <div key={`${r.cost_center_id}`} className="space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-foreground">{r.cost_center_name ?? "Sem centro de custo"}</span>
                      <span className="text-muted-foreground">
                        {formatBRL(real)} <span className="text-xs">de</span> {formatBRL(prev)}
                      </span>
                    </div>
                    <Progress value={p * 100} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
