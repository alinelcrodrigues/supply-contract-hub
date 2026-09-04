import { useState } from "react";
import { Check, X, Send, Paperclip, Pencil, Trash2, History } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatBRL, formatDate } from "@/lib/contracts-store";
import { useUsers, useCostCenters, useCurrentUserRole } from "@/lib/params-hooks";
import {
  useContractRequests, useContractRequestMutations, useTiers, useCurrentUserId, downloadFile,
  type ContractRequest,
} from "@/lib/approvals-hooks";
import { TabelaCompacta, StatusBadge, type ColunaCompacta } from "@/components/ListaCompacta";
import EditarSolicitacaoDialog from "@/components/EditarSolicitacaoDialog";
import CancelarDialog from "@/components/CancelarDialog";
import HistoricoAlteracoes from "@/components/HistoricoAlteracoes";
import { useCancelMutations } from "@/lib/audit-hooks";

export default function PainelAprovacaoContrato({ idFilter }: { idFilter?: string[] | null }) {
  const { data: requests, isLoading } = useContractRequests();
  const { data: tiers } = useTiers("contract");
  const { data: users } = useUsers();
  const { data: costCenters } = useCostCenters();
  const { data: uid } = useCurrentUserId();
  const { data: role } = useCurrentUserRole();
  const [historyFor, setHistoryFor] = useState<string | null>(null);
  const cancelMut = useCancelMutations();
  const { decide, submit, remove } = useContractRequestMutations();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<ContractRequest | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const userName = (id: string) => users?.find((u) => u.id === id)?.name ?? "—";
  const ccName = (id: string | null) => costCenters?.find((c) => c.id === id)?.name ?? "Sem centro de custo";

  const currentApprover = (r: ContractRequest) =>
    tiers?.find((t) => t.id === r.tier_id)?.steps.find((s) => s.step_order === r.current_step)?.approver_id ?? null;

  const act = async (r: ContractRequest, approve: boolean) => {
    try {
      await decide.mutateAsync({ id: r.id, approve, comment: comments[r.id] });
      toast.success(approve ? "Solicitação aprovada." : "Solicitação reprovada e devolvida ao solicitante.");
      setComments((c) => ({ ...c, [r.id]: "" }));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const resend = async (r: ContractRequest) => {
    try {
      await submit.mutateAsync(r.id);
      toast.success("Solicitação reenviada — aprovação recomeça do primeiro aprovador.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando solicitações…</p>;
  if (!requests?.length) return <p className="text-sm text-muted-foreground">Nenhuma solicitação cadastrada.</p>;

  const visible = idFilter ? requests.filter((r) => idFilter.includes(r.id)) : requests;
  if (!visible.length) return <p className="text-sm text-muted-foreground">Nenhuma solicitação para os filtros selecionados.</p>;

  const pending = visible.filter((r) => r.status === "em_aprovacao" && currentApprover(r) === uid);
  const others = visible.filter((r) => !pending.includes(r));

  const renderDetalhe = (r: ContractRequest, myTurn: boolean) => {
    const tier = tiers?.find((t) => t.id === r.tier_id);
    return (
      <div className="space-y-4 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <p><span className="text-muted-foreground">Objeto:</span> {r.object || "—"}</p>
          <p><span className="text-muted-foreground">Solicitante:</span> {userName(r.requester_id)}</p>
          <p><span className="text-muted-foreground">Categoria:</span> {r.financial_category || "—"}</p>
          <p><span className="text-muted-foreground">Prazo:</span> {r.deadline_days} dias</p>
          <p><span className="text-muted-foreground">Faixa de alçada:</span> {tier?.name ?? "—"}</p>
          <p><span className="text-muted-foreground">Criada em:</span> {formatDate(r.created_at.slice(0, 10))}</p>
        </div>

        {r.contract_request_cost_centers.length > 0 && (
          <div>
            <p className="mb-1 font-medium">Rateio</p>
            <ul className="space-y-1 text-muted-foreground">
              {r.contract_request_cost_centers.map((c) => (
                <li key={c.id}>{ccName(c.cost_center_id)} — {formatBRL(Number(c.value))}</li>
              ))}
            </ul>
          </div>
        )}

        {tier && r.status === "em_aprovacao" && (
          <div className="flex flex-wrap gap-2">
            {tier.steps.map((s) => (
              <Badge key={s.id} variant={s.step_order < r.current_step ? "default" : s.step_order === r.current_step ? "secondary" : "outline"}>
                {s.step_order}. {userName(s.approver_id)}
              </Badge>
            ))}
          </div>
        )}

        {r.contract_request_documents.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {r.contract_request_documents.map((d) => (
              <Button key={d.id} size="sm" variant="outline"
                onClick={() => downloadFile("contract-request-documents", d.file_path).catch((e) => toast.error(e.message))}>
                <Paperclip className="mr-1 h-3 w-3" /> {d.file_name}
              </Button>
            ))}
          </div>
        )}

        {r.contract_request_approvals.length > 0 && (
          <div>
            <p className="mb-1 font-medium">Histórico</p>
            <ul className="space-y-1 text-muted-foreground">
              {[...r.contract_request_approvals].sort((a, b) => a.step_order - b.step_order).map((a) => (
                <li key={a.id}>
                  {a.step_order}. {userName(a.approver_id)} — {a.decision}
                  {a.comment ? ` · ${a.comment}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {r.status === "reprovada" && r.rejection_reason && (
          <p className="rounded-md bg-destructive/10 p-2 text-destructive">Motivo: {r.rejection_reason}</p>
        )}

        {myTurn && (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Comentário (opcional)"
              className="max-w-sm"
              value={comments[r.id] ?? ""}
              onChange={(e) => setComments((c) => ({ ...c, [r.id]: e.target.value }))}
            />
            <Button size="sm" onClick={() => act(r, true)} disabled={decide.isPending}>
              <Check className="mr-1 h-4 w-4" /> Aprovar
            </Button>
            <Button size="sm" variant="destructive" onClick={() => act(r, false)} disabled={decide.isPending}>
              <X className="mr-1 h-4 w-4" /> Reprovar
            </Button>
          </div>
        )}

        {(role === "admin" || ((r.status === "rascunho" || r.status === "reprovada") && r.requester_id === uid)) && (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
              <Pencil className="mr-1 h-4 w-4" /> Editar
            </Button>
            {(r.status === "rascunho" || r.status === "reprovada") && (
              <>
                <Button size="sm" variant="outline" onClick={() => resend(r)} disabled={submit.isPending}>
                  <Send className="mr-1 h-4 w-4" /> {r.status === "reprovada" ? "Corrigir e reenviar" : "Enviar para aprovação"}
                </Button>
                <Button
                  size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm("Excluir esta solicitação?")) {
                      remove.mutateAsync(r.id)
                        .then(() => toast.success("Solicitação excluída."))
                        .catch((e) => toast.error((e as Error).message));
                    }
                  }}
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Excluir
                </Button>
              </>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {["rascunho", "em_aprovacao", "reprovada"].includes(r.status) &&
            (role === "admin" || role === "gestor" || r.requester_id === uid) && (
              <CancelarDialog
                title="Cancelar solicitação"
                description="O cancelamento é registrado no histórico com o motivo informado."
                pending={cancelMut.cancelRequest.isPending}
                onConfirm={async (reason) => {
                  await cancelMut.cancelRequest.mutateAsync({ id: r.id, reason });
                  toast.success("Solicitação cancelada.");
                }}
              />
            )}
          <Button size="sm" variant="ghost" onClick={() => setHistoryFor(historyFor === r.id ? null : r.id)}>
            <History className="mr-1 h-4 w-4" /> Ver histórico
          </Button>
        </div>
        {historyFor === r.id && (
          <HistoricoAlteracoes compact recordId={r.id} tables={['contract_requests']} title="Histórico deste registro" />
        )}
      </div>
    );
  };

  const stepLabel = (r: ContractRequest) => {
    const tier = tiers?.find((t) => t.id === r.tier_id);
    if (!tier || r.status !== "em_aprovacao") return "—";
    const total = tier.steps.length;
    const approver = currentApprover(r);
    return `${r.current_step}/${total} · ${approver ? userName(approver) : "—"}`;
  };

  const columns: ColunaCompacta<ContractRequest>[] = [
    {
      key: "object",
      header: "Objeto",
      cell: (r) => <span className="block max-w-[280px] truncate font-medium text-foreground">{r.object || "Sem objeto"}</span>,
    },
    { key: "supplier", header: "Fornecedor", hideBelow: "md", cell: (r) => <span className="block max-w-[200px] truncate">{r.supplier_name}</span> },
    { key: "value", header: "Valor", className: "text-right tabular-nums", cell: (r) => formatBRL(Number(r.total_value)) },
    { key: "step", header: "Etapa", hideBelow: "lg", cell: (r) => <span className="text-muted-foreground">{stepLabel(r)}</span> },
    { key: "status", header: "Status", className: "text-right", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  const renderTabela = (list: ContractRequest[], myTurn: boolean, empty: string) => (
    <TabelaCompacta
      columns={columns}
      rows={list}
      empty={empty}
      expandedId={expanded}
      onRowClick={(r) => setExpanded(expanded === r.id ? null : r.id)}
      renderExpanded={(r) => renderDetalhe(r, myTurn)}
    />
  );

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Aguardando sua aprovação ({pending.length})
        </h2>
        {renderTabela(pending, true, "Nada pendente para você.")}
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Demais solicitações</h2>
        {renderTabela(others, false, "Nenhuma solicitação.")}
      </section>
      {editing && (
        <EditarSolicitacaoDialog request={editing} open onOpenChange={(v) => !v && setEditing(null)} />
      )}
    </div>
  );
}
