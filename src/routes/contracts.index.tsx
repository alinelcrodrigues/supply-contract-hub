import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { contractBalance, formatBRL, formatDate, useContractsStable } from "@/lib/contracts-store";

export const Route = createFileRoute("/contracts/")({
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
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
          <p className="text-sm text-muted-foreground">{contracts.length} contratos cadastrados.</p>
        </div>
        <Button asChild variant="secondary"><Link to="/contracts/new">+ Novo contrato</Link></Button>
      </div>

      {contracts.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">Nenhum contrato cadastrado ainda.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {contracts.map((c) => {
            const b = contractBalance(c);
            return (
              <Link key={c.id} to="/contracts/$id" params={{ id: c.id }} className="block">
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{c.number}</span>
                          {c.signed ? (
                            <Badge className="bg-primary text-primary-foreground">Assinado</Badge>
                          ) : (
                            <Badge className="bg-secondary text-secondary-foreground">Pendente</Badge>
                          )}
                        </div>
                        <div className="mt-1 text-sm font-medium">{c.supplier}</div>
                        <div className="text-xs text-muted-foreground">{c.object}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline" className="border-primary text-primary">{c.costCenter}</Badge>
                          <Badge variant="outline">{c.financialCategory}</Badge>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Vigência: {formatDate(c.startDate)} → {formatDate(c.endDate)} · Índice: {c.adjustmentIndex}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Saldo</div>
                        <div className="text-lg font-bold text-primary">{formatBRL(b.balance)}</div>
                        <div className="text-xs text-muted-foreground">de {formatBRL(c.globalValue)}</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress value={b.pct * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}