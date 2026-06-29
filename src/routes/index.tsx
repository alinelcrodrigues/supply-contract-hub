import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, CheckCircle2, FileSignature, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  contractBalance,
  daysUntil,
  formatBRL,
  formatDate,
  nextAdjustmentDate,
  useContractsStable,
} from "@/lib/contracts-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Gestão de Contratos de Suprimentos" },
      { name: "description", content: "Acompanhe alertas de vencimento, reajustes e saldo de contratos de suprimentos." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const contracts = useContractsStable();

  const totalGlobal = contracts.reduce((s, c) => s + c.globalValue, 0);
  const totalPaid = contracts.reduce((s, c) => s + contractBalance(c).paid, 0);
  const totalBalance = totalGlobal - totalPaid;
  const signedCount = contracts.filter((c) => c.signed).length;

  const expiring = contracts
    .map((c) => ({ c, days: daysUntil(c.endDate) }))
    .filter((x) => x.days <= 60)
    .sort((a, b) => a.days - b.days);

  const adjustments = contracts
    .map((c) => ({ c, date: nextAdjustmentDate(c) }))
    .filter((x): x is { c: typeof contracts[number]; date: Date } => !!x.date)
    .map((x) => ({ ...x, days: Math.round((x.date.getTime() - Date.now()) / 86_400_000) }))
    .filter((x) => x.days <= 60)
    .sort((a, b) => a.days - b.days);

  const unsigned = contracts.filter((c) => !c.signed);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão geral dos contratos de suprimentos da obra.
          </p>
        </div>
        <Button asChild variant="secondary" className="font-semibold">
          <Link to="/contracts/new">+ Novo contrato</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<FileSignature className="h-5 w-5" />} label="Contratos ativos" value={String(contracts.length)} hint={`${signedCount} assinados`} />
        <Kpi icon={<Wallet className="h-5 w-5" />} label="Valor global" value={formatBRL(totalGlobal)} />
        <Kpi icon={<TrendingUp className="h-5 w-5" />} label="Medições pagas" value={formatBRL(totalPaid)} />
        <Kpi icon={<CheckCircle2 className="h-5 w-5" />} label="Saldo a executar" value={formatBRL(totalBalance)} accent />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-secondary-foreground" />
              Contratos a vencer (60 dias)
            </CardTitle>
            <Badge variant="outline">{expiring.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {expiring.length === 0 ? (
              <EmptyMsg text="Nenhum contrato vencendo nos próximos 60 dias." />
            ) : (
              expiring.map(({ c, days }) => (
                <Link
                  key={c.id}
                  to="/contracts/$id"
                  params={{ id: c.id }}
                  className="flex items-center justify-between rounded-md border border-border bg-card p-3 transition-colors hover:border-primary"
                >
                  <div>
                    <div className="font-medium text-foreground">{c.number} · {c.supplier}</div>
                    <div className="text-xs text-muted-foreground">Vence em {formatDate(c.endDate)}</div>
                  </div>
                  <Badge className={days < 0 ? "bg-destructive text-destructive-foreground" : days <= 15 ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}>
                    {days < 0 ? `Vencido há ${-days}d` : `${days}d restantes`}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-primary" />
              Reajustes próximos
            </CardTitle>
            <Badge variant="outline">{adjustments.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {adjustments.length === 0 ? (
              <EmptyMsg text="Nenhum reajuste programado nos próximos 60 dias." />
            ) : (
              adjustments.map(({ c, date, days }) => (
                <Link
                  key={c.id}
                  to="/contracts/$id"
                  params={{ id: c.id }}
                  className="flex items-center justify-between rounded-md border border-border bg-card p-3 transition-colors hover:border-primary"
                >
                  <div>
                    <div className="font-medium text-foreground">{c.number} · {c.supplier}</div>
                    <div className="text-xs text-muted-foreground">Índice {c.adjustmentIndex} · {date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</div>
                  </div>
                  <Badge variant="outline" className="border-primary text-primary">{days}d</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {unsigned.length > 0 && (
        <Card className="border-secondary bg-secondary/10">
          <CardHeader>
            <CardTitle className="text-base">Aguardando assinatura</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unsigned.map((c) => (
              <Link key={c.id} to="/contracts/$id" params={{ id: c.id }} className="rounded-md border border-border bg-card p-3 hover:border-primary">
                <div className="font-medium">{c.number}</div>
                <div className="text-xs text-muted-foreground">{c.supplier}</div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Todos os contratos</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/contracts">Ver lista completa →</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {contracts.slice(0, 5).map((c) => {
            const b = contractBalance(c);
            return (
              <Link key={c.id} to="/contracts/$id" params={{ id: c.id }} className="block rounded-md border border-border p-4 transition-colors hover:border-primary">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-foreground">{c.number} — {c.supplier}</div>
                    <div className="text-xs text-muted-foreground">{c.object}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Saldo</div>
                    <div className="font-semibold text-primary">{formatBRL(b.balance)}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <Progress value={b.pct * 100} className="h-2" />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>Executado {formatBRL(b.paid)}</span>
                    <span>Global {formatBRL(c.globalValue)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon, label, value, hint, accent }: { icon: React.ReactNode; label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <Card className={accent ? "border-secondary bg-secondary/15" : ""}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className={accent ? "text-secondary-foreground" : "text-primary"}>{icon}</div>
        </div>
        <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">{text}</div>;
}
