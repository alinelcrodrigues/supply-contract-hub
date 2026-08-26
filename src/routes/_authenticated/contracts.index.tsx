import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Building2, ChevronDown, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { contractBalance, daysUntil, formatBRL, formatDate, useContractsStable } from "@/lib/contracts-store";

export const Route = createFileRoute("/_authenticated/contracts/")({
  head: () => ({
    meta: [
      { title: "Contratos — Gestão de Suprimentos" },
      { name: "description", content: "Lista de contratos de suprimentos da construtora." },
    ],
  }),
  component: ContractsList,
});

function ContractsList() {
  const contracts = useContractsStable();
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? contracts.filter((c) =>
          [c.number, c.supplier, c.object, c.costCenter, c.financialCategory]
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
      : contracts;
    const map = new Map<string, typeof contracts>();
    for (const c of filtered) {
      const arr = map.get(c.costCenter) ?? [];
      arr.push(c);
      map.set(c.costCenter, arr);
    }
    return Array.from(map.entries())
      .map(([cc, items]) => {
        const global = items.reduce((s, c) => s + c.globalValue, 0);
        const paid = items.reduce((s, c) => s + contractBalance(c).paid, 0);
        return { cc, items, global, paid, balance: global - paid };
      })
      .sort((a, b) => b.global - a.global);
  }, [contracts, query]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Contratos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {contracts.length} contratos cadastrados · agrupados por centro de custo
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar contrato, fornecedor…"
              className="h-10 w-[280px] pl-9"
            />
          </div>
          <Button asChild variant="secondary" className="font-semibold">
            <Link to="/contracts/new">+ Novo contrato</Link>
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            {contracts.length === 0
              ? "Nenhum contrato cadastrado ainda."
              : "Nenhum contrato encontrado para a busca."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => {
            const open = !collapsed[g.cc];
            const pct = g.global ? (g.paid / g.global) * 100 : 0;
            return (
              <Collapsible
                key={g.cc}
                open={open}
                onOpenChange={(v) => setCollapsed((s) => ({ ...s, [g.cc]: !v }))}
              >
                <div className="overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur-sm">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-semibold text-foreground">{g.cc}</span>
                          <Badge variant="outline" className="font-normal">
                            {g.items.length} {g.items.length === 1 ? "contrato" : "contratos"}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>Global <span className="font-medium text-foreground">{formatBRL(g.global)}</span></span>
                          <span>Executado <span className="font-medium text-foreground">{formatBRL(g.paid)}</span></span>
                          <span>Saldo <span className="font-medium text-primary">{formatBRL(g.balance)}</span></span>
                        </div>
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-primary/70" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`}
                      />
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="divide-y divide-border border-t border-border">
                      {g.items.map((c) => {
                        const b = contractBalance(c);
                        const days = daysUntil(c.endDate);
                        const expiring = days <= 60;
                        return (
                          <Link
                            key={c.id}
                            to="/contracts/$id"
                            params={{ id: c.id }}
                            className={`block px-5 py-4 transition-colors hover:bg-muted/40 ${c.status === "cancelado" ? "opacity-60" : ""}`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-foreground">{c.number}</span>
                                  <span className="text-sm text-muted-foreground">·</span>
                                  <span className="text-sm font-medium text-foreground">{c.supplier}</span>
                                  {c.status === "cancelado" && (
                                    <Badge className="bg-muted text-muted-foreground line-through">Cancelado</Badge>
                                  )}
                                  {c.signed ? (
                                    <Badge variant="outline" className="border-primary/40 text-primary">
                                      Assinado
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-secondary/80 text-secondary-foreground">Pendente</Badge>
                                  )}
                                  {expiring && (
                                    <Badge
                                      className={
                                        days < 0
                                          ? "bg-destructive text-destructive-foreground"
                                          : "bg-secondary text-secondary-foreground"
                                      }
                                    >
                                      {days < 0 ? `Vencido há ${-days}d` : `Vence em ${days}d`}
                                    </Badge>
                                  )}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">{c.object}</div>
                                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                  <span>{c.financialCategory}</span>
                                  <span>·</span>
                                  <span>
                                    {formatDate(c.startDate)} → {formatDate(c.endDate)}
                                  </span>
                                  <span>·</span>
                                  <span>Índice {c.adjustmentIndex}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Saldo</div>
                                <div className="text-base font-semibold text-primary">
                                  {formatBRL(b.balance)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  de {formatBRL(c.globalValue)}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3">
                              <Progress value={b.pct * 100} className="h-1.5" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}