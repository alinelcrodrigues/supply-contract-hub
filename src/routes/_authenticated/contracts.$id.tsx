import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { AditivosContratuais } from "@/components/AditivosContratuais";
import EditarContratoDialog from "@/components/EditarContratoDialog";
import ContratoDocumentos from "@/components/ContratoDocumentos";
import {
  contractBalance,
  daysUntil,
  deleteContract,
  formatBRL,
  formatDate,
  updateContract,
  useContractsQuery,
  type MeasurementStatus,
} from "@/lib/contracts-store";

const STATUS_LABEL: Record<MeasurementStatus, string> = {
  rascunho: "Rascunho",
  em_aprovacao: "Em aprovação",
  aprovada: "Aprovada",
  reprovada: "Reprovada",
};


export const Route = createFileRoute("/_authenticated/contracts/$id")({
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
  const { data: contracts = [], isLoading } = useContractsQuery();
  const contract = contracts.find((c) => c.id === id);

  const [editContractOpen, setEditContractOpen] = useState(false);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando contrato...</p>;
  }

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/contracts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditContractOpen(true)}>
            <Pencil className="mr-1 h-4 w-4" /> Editar contrato
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowHistory((v) => !v)}>
            <History className="mr-1 h-4 w-4" /> Ver histórico
          </Button>
          {canManageContracts && contract.status !== "cancelado" && (
            <CancelarDialog
              title="Cancelar contrato"
              buttonLabel="Cancelar contrato"
              description="O contrato passa para a situação Cancelado. Contratos com medição aprovada ou pagamento realizado não podem ser cancelados."
              pending={cancelContract.isPending}
              onConfirm={async (reason) => {
                await cancelContract.mutateAsync({ id: contract.id, reason });
                toast.success("Contrato cancelado.");
              }}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (confirm("Excluir este contrato?")) {
                void deleteContract(contract.id).then(() => navigate({ to: "/contracts" }));
              }
            }}
          >
            <Trash2 className="mr-1 h-4 w-4" /> Excluir contrato
          </Button>
        </div>

      </div>

      {contract.status === "cancelado" && (
        <div className="rounded-md border border-muted bg-muted/40 p-4 text-sm">
          <span className="font-semibold text-muted-foreground line-through">Contrato cancelado</span>
          {contract.cancellationReason && (
            <span className="ml-2 text-muted-foreground">Motivo: {contract.cancellationReason}</span>
          )}
        </div>
      )}

      {showHistory && (
        <HistoricoAlteracoes
          compact
          recordId={contract.id}
          tables={["contracts"]}
          title="Histórico deste contrato"
        />
      )}


      {days <= 60 && (
        <div className={`rounded-md border p-4 ${days < 0 ? "border-destructive bg-destructive/10" : "border-secondary bg-secondary/10"}`}>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className={`inline-block h-2 w-2 rounded-full ${days < 0 ? "bg-destructive" : "bg-secondary-foreground"}`} />
            {days < 0 ? (
              <span className="text-destructive">Alerta: contrato vencido há {-days} dias.</span>
            ) : (
              <span className="text-secondary-foreground">Alerta: fim da vigência em {days} dias.</span>
            )}
          </div>
        </div>
      )}

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
                  void updateContract(contract.id, { signed: v });
                  toast.success(v ? "Marcado como assinado." : "Marcado como pendente.");
                }}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-5">
            <Info label="Valor vigente" value={formatBRL(bal.total)} sub={`Global ${formatBRL(contract.globalValue)}`} />
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

      <ContratoDocumentos contractId={contract.id} />

      <AditivosContratuais contractId={contract.id} valorOriginal={contract.globalValue} aditivos={contract.addendums} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Medições do contrato</CardTitle>
            <Badge variant="outline">{contract.measurements.length}</Badge>
          </div>
          <Button asChild size="sm" variant="secondary" className="font-semibold">
            <Link to="/medicoes/new" search={{ contractId: contract.id }}>
              <Plus className="mr-1 h-4 w-4" /> Lançar medição
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Medições seguem o fluxo de aprovação por alçada. Somente medições <strong>aprovadas</strong> abatem do saldo do contrato.
          </p>
          {contract.measurements.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma medição lançada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Mês de referência</th>
                    <th className="px-3 py-2 text-left">Observações</th>
                    <th className="px-3 py-2 text-right">Valor</th>
                    <th className="px-3 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contract.measurements.map((mm) => (
                    <tr key={mm.id} className="border-t border-border">
                      <td className="px-3 py-2">{formatDate(mm.date)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{mm.description || "—"}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatBRL(mm.amount)}</td>
                      <td className="px-3 py-2 text-right">
                        <Badge
                          variant={mm.status === "aprovada" ? "default" : mm.status === "reprovada" ? "destructive" : "secondary"}
                        >
                          {STATUS_LABEL[mm.status] ?? mm.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-muted/30 font-semibold">
                    <td colSpan={2} className="px-3 py-2 text-right">Total executado (aprovado)</td>
                    <td className="px-3 py-2 text-right text-primary">{formatBRL(bal.paid)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {editContractOpen && (
        <EditarContratoDialog contract={contract} open onOpenChange={setEditContractOpen} />
      )}

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