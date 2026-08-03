import { useMemo, useState } from "react";
import { Building2, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatBRL, useCostCenterDashboard } from "@/lib/contracts-store";

export function DashboardCentroCusto({ costCenterFilter }: { costCenterFilter?: string }) {
  const { data, isLoading, error } = useCostCenterDashboard();
  const [openId, setOpenId] = useState<string | null>(null);

  const summary = useMemo(() => {
    const rows = data?.summary ?? [];
    if (!costCenterFilter || costCenterFilter === "ALL") return rows;
    return rows.filter((r) => r.costCenterName === costCenterFilter);
  }, [data, costCenterFilter]);

  const maxContracted = Math.max(1, ...summary.map((s) => s.contractedValue));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4 text-primary" />
          Gasto por centro de custo
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Considera itens do contrato, itens incluídos por aditivo e o rateio proporcional dos aditivos de ajuste de valor.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <Skeleton />}
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Não foi possível carregar a análise por centro de custo.
          </div>
        )}
        {!isLoading && !error && summary.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Cadastre contratos para visualizar a análise.
          </div>
        )}

        {summary.map((s) => {
          const key = s.costCenterId ?? s.costCenterName;
          const open = openId === key;
          const pct = s.contractedValue ? (s.realizedValue / s.contractedValue) * 100 : 0;
          const lines = (data?.allocation ?? []).filter(
            (a) => (a.costCenterId ?? a.costCenterName) === key,
          );

          return (
            <div key={key} className="rounded-lg border border-border bg-card/60">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : key)}
                className="w-full rounded-lg p-4 text-left transition-colors hover:bg-muted/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <div className="font-semibold text-foreground">{s.costCenterName}</div>
                      <div className="text-xs text-muted-foreground">{s.contractCount} contrato(s)</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-right">
                    <Metric label="Contratado" value={formatBRL(s.contractedValue)} />
                    <Metric label="Realizado" value={formatBRL(s.realizedValue)} accent />
                    <Metric label="Saldo" value={formatBRL(s.balance)} />
                  </div>
                </div>
                <div className="mt-3">
                  <Progress value={Math.min(100, pct)} className="h-2" />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>{pct.toFixed(0)}% executado</span>
                    <span>{((s.contractedValue / maxContracted) * 100).toFixed(0)}% do maior centro de custo</span>
                  </div>
                </div>
              </button>

              {open && (
                <div className="border-t border-border p-4">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Composição do valor
                  </div>
                  {lines.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem contratos alocados neste centro de custo.</p>
                  ) : (
                    <div className="space-y-3">
                      {lines.map((a) => {
                        const sources = (data?.sources ?? []).filter(
                          (src) =>
                            src.contractId === a.contractId &&
                            (src.costCenterId ?? "sem") === (a.costCenterId ?? "sem"),
                        );
                        return (
                          <div key={`${a.contractId}-${key}`} className="rounded-md border border-border p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <div className="text-sm font-medium">{a.contractNumber} — {a.contractSupplier}</div>
                                <div className="text-xs text-muted-foreground">
                                  Realizado rateado: {formatBRL(a.realizedValue)}
                                </div>
                              </div>
                              <div className="text-right text-sm font-semibold tabular-nums text-primary">
                                {formatBRL(a.contractedValue)}
                              </div>
                            </div>
                            <ul className="mt-2 space-y-1">
                              {sources.map((src, i) => (
                                <li key={i} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                  <span className="flex items-center gap-2">
                                    <Badge variant="outline" className={src.originType === "aditivo" ? "border-secondary text-secondary-foreground" : ""}>
                                      {src.originType === "aditivo" ? "Aditivo" : "Contrato"}
                                    </Badge>
                                    <span className="text-muted-foreground">
                                      {src.originType === "aditivo" && src.addendumDescription
                                        ? `${src.addendumDescription} · ${src.description}`
                                        : src.description}
                                      {src.financialCategory ? ` · ${src.financialCategory}` : ""}
                                    </span>
                                  </span>
                                  <span className="tabular-nums">{formatBRL(src.value)}</span>
                                </li>
                              ))}
                              {a.adjustmentValue !== 0 && (
                                <li className="flex items-center justify-between gap-2 text-xs">
                                  <span className="flex items-center gap-2">
                                    <Badge variant="outline" className="border-primary text-primary">Rateio</Badge>
                                    <span className="text-muted-foreground">Aditivos de ajuste de valor (proporcional)</span>
                                  </span>
                                  <span className="tabular-nums">{formatBRL(a.adjustmentValue)}</span>
                                </li>
                              )}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-lg bg-muted/50" />
      ))}
    </div>
  );
}
