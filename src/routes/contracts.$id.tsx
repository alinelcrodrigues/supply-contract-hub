import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  addMeasurement,
  contractBalance,
  daysUntil,
  deleteContract,
  deleteMeasurement,
  formatBRL,
  formatDate,
  updateContract,
  useContractsStable,
} from "@/lib/contracts-store";

export const Route = createFileRoute("/contracts/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes do contrato — Gestão de Suprimentos" },
      { name: "description", content: "Detalhes, medições e pagamentos do contrato." },
    ],
  }),
  component: ContractDetail,
});

function ContractDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const contracts = useContractsStable();
  const contract = contracts.find((c) => c.id === id);

  const [m, setM] = useState({ date: new Date().toISOString().slice(0, 10), description: "", amount: "" });

  if (!contract) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Contrato não encontrado.</p>
        <Button asChild variant="secondary"><Link to="/contracts">Voltar para contratos</Link></Button>
      </div>
    );
  }

  const bal = contractBalance(contract);
  const days = daysUntil(contract.endDate);

  const submitMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(m.amount);
    if (!m.date || !amount || amount <= 0) {
      toast.error("Informe data e valor da medição.");
      return;
    }
    if (amount > bal.balance) {
      toast.error("Valor excede o saldo do contrato.");
      return;
    }
    addMeasurement(contract.id, { date: m.date, description: m.description || "Medição", amount });
    setM({ date: new Date().toISOString().slice(0, 10), description: "", amount: "" });
    toast.success("Medição lançada.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/contracts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10"
          onClick={() => {
            if (confirm("Excluir este contrato?")) {
              deleteContract(contract.id);
              navigate({ to: "/contracts" });
            }
          }}
        >
          <Trash2 className="mr-1 h-4 w-4" /> Excluir contrato
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{contract.number}</h1>
                {contract.signed ? (
                  <Badge className="bg-primary text-primary-foreground">Assinado</Badge>
                ) : (
                  <Badge className="bg-secondary text-secondary-foreground">Pendente</Badge>
                )}
              </div>
              <p className="mt-1 text-lg font-medium text-foreground">{contract.supplier}</p>
              <p className="text-sm text-muted-foreground">{contract.object}</p>
            </div>
            <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-4 py-3">
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Assinatura</div>
                <div className="text-sm font-medium">{contract.signed ? "Assinado" : "Pendente"}</div>
              </div>
              <Switch
                checked={contract.signed}
                onCheckedChange={(v) => {
                  updateContract(contract.id, { signed: v });
                  toast.success(v ? "Marcado como assinado." : "Marcado como pendente.");
                }}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-5">
            <Info label="Valor global" value={formatBRL(contract.globalValue)} />
            <Info label="Executado" value={formatBRL(bal.paid)} />
            <Info label="Saldo" value={formatBRL(bal.balance)} highlight />
            <Info label="Orçamento" value={contract.budgetValue !== null ? formatBRL(contract.budgetValue) : "Não se aplica"} />
            <Info label="Vigência" value={`${formatDate(contract.startDate)} → ${formatDate(contract.endDate)}`} sub={days < 0 ? `Vencido há ${-days}d` : `${days} dias restantes`} />
          </div>

          {contract.budgetValue !== null && (
            <div className="mt-4 rounded-md border border-border bg-muted/30 p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Análise orçamento × contratado</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-medium">
                {contract.globalValue > contract.budgetValue ? (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-destructive" />
                    <span className="text-destructive">Acima do orçamento ({formatBRL(contract.globalValue - contract.budgetValue)})</span>
                  </>
                ) : contract.globalValue < contract.budgetValue ? (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-emerald-500">Abaixo do orçamento (economia de {formatBRL(contract.budgetValue - contract.globalValue)})</span>
                  </>
                ) : (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                    <span className="text-foreground">Valor igual ao orçamento</span>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>Execução financeira</span>
              <span>{Math.round(bal.pct * 100)}%</span>
            </div>
            <Progress value={bal.pct * 100} className="h-3" />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Info label="Índice de reajuste" value={contract.adjustmentIndex} />
            <Info label="Mês do reajuste" value={new Date(2000, contract.adjustmentMonth - 1, 1).toLocaleDateString("pt-BR", { month: "long" })} />
            <Info label="Centro de custo" value={contract.costCenter} />
            <Info label="Categoria financeira" value={contract.financialCategory} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">Lançar medição / pagamento</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submitMeasurement} className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Data</Label>
                <Input type="date" value={m.date} onChange={(e) => setM({ ...m, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição</Label>
                <Input value={m.description} onChange={(e) => setM({ ...m, description: e.target.value })} placeholder="Medição mensal" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Valor (R$)</Label>
                <Input type="number" min="0" step="0.01" value={m.amount} onChange={(e) => setM({ ...m, amount: e.target.value })} placeholder="0,00" />
                <p className="text-xs text-muted-foreground">Saldo disponível: {formatBRL(bal.balance)}</p>
              </div>
              <Button type="submit" variant="secondary" className="font-semibold">Lançar medição</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Histórico de medições</CardTitle>
            <Badge variant="outline">{contract.measurements.length}</Badge>
          </CardHeader>
          <CardContent>
            {contract.measurements.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nenhuma medição lançada ainda.
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Data</th>
                      <th className="px-3 py-2 text-left">Descrição</th>
                      <th className="px-3 py-2 text-right">Valor</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...contract.measurements].sort((a, b) => b.date.localeCompare(a.date)).map((mm) => (
                      <tr key={mm.id} className="border-t border-border">
                        <td className="px-3 py-2">{formatDate(mm.date)}</td>
                        <td className="px-3 py-2">{mm.description}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatBRL(mm.amount)}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => {
                              if (confirm("Remover esta medição?")) deleteMeasurement(contract.id, mm.id);
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-muted/30 font-semibold">
                      <td colSpan={2} className="px-3 py-2 text-right">Total executado</td>
                      <td className="px-3 py-2 text-right text-primary">{formatBRL(bal.paid)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-md border p-3 ${highlight ? "border-secondary bg-secondary/15" : "border-border bg-card"}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}