import { useState } from "react";
import { Check, X, Send, Pencil, Trash2, History } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatBRL } from "@/lib/contracts-store";
import { useUsers, useCostCenters, useCurrentUserRole } from "@/lib/params-hooks";
import {
  useApprovalMeasurements, useMeasurementMutations, useTiers, useCurrentUserId, type Measurement,
} from "@/lib/approvals-hooks";
import { TabelaCompacta, StatusBadge, type ColunaCompacta } from "@/components/ListaCompacta";
import EditarMedicaoDialog from "@/components/EditarMedicaoDialog";
import CancelarDialog from "@/components/CancelarDialog";
import HistoricoAlteracoes from "@/components/HistoricoAlteracoes";
import { useCancelMutations } from "@/lib/audit-hooks";

export default function PainelAprovacaoMedicao({ idFilter }: { idFilter?: string[] | null }) {
  const { data: measurements, isLoading } = useApprovalMeasurements();
  const { data: tiers } = useTiers("measurement");
  const { data: users } = useUsers();
  const { data: costCenters } = useCostCenters();
  const { data: uid } = useCurrentUserId();
  const { data: role } = useCurrentUserRole();
  const [historyFor, setHistoryFor] = useState<string | null>(null);
  const cancelMut = useCancelMutations();
  const { decide, submit, remove } = useMeasurementMutations();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Measurement | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const userName = (id: string) => users?.find((u) => u.id === id)?.name ?? "—";
  const ccName = (id: string | null) => costCenters?.find((c) => c.id === id)?.name ?? "Sem centro de custo";
  const currentApprover = (m: Measurement) =>
    tiers?.find((t) => t.id === m.tier_id)?.steps.find((s) => s.step_order === m.current_step)?.approver_id ?? null;

  const act = async (m: Measurement, approve: boolean) => {
    try {
      await decide.mutateAsync({ id: m.id, approve, comment: comments[m.id] });
      toast.success(approve ? "Medição aprovada." : "Medição reprovada e devolvida.");
      setComments((c) => ({ ...c, [m.id]: "" }));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando medições…</p>;
  if (!measurements?.length) return <p className="text-sm text-muted-foreground">Nenhuma medição lançada.</p>;

  const visible = idFilter ? measurements.filter((m) => idFilter.includes(m.id)) : measurements;
  if (!visible.length) return <p className="text-sm text-muted-foreground">Nenhuma medição para os filtros selecionados.</p>;

  const pending = visible.filter((m) => m.status === "em_aprovacao" && currentApprover(m) === uid);
  const others = visible.filter((m) => !pending.includes(m));

  const renderDetalhe = (m: Measurement, myTurn: boolean) => {
    const tier = tiers?.find((t) => t.id === m.tier_id);
    return (
      <div className="space-y-4 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <p><span className="text-muted-foreground">Contrato:</span> {m.contracts?.number ?? "—"}</p>
          <p><span className="text-muted-foreground">Fornecedor:</span> {m.contracts?.supplier ?? "—"}</p>
          <p><span className="text-muted-foreground">Lançada por:</span> {userName(m.created_by)}</p>
          <p><span className="text-muted-foreground">Faixa de alçada:</span> {tier?.name ?? "—"}</p>
        </div>
        {m.notes && <p className="text-muted-foreground">{m.notes}</p>}

        {m.contract_measurement_cost_centers.length > 0 && (
          <ul className="space-y-1 text-muted-foreground">
            {m.contract_measurement_cost_centers.map((c) => (
              <li key={c.id}>{ccName(c.cost_center_id)} — {formatBRL(Number(c.value))}</li>
            ))}
          </ul>
        )}

        {tier && m.status === "em_aprovacao" && (
          <div className="flex flex-wrap gap-2">
            {tier.steps.map((s) => (
              <Badge key={s.id} variant={s.step_order < m.current_step ? "default" : s.step_order === m.current_step ? "secondary" : "outline"}>
                {s.step_order}. {userName(s.approver_id)}
              </Badge>
            ))}
          </div>
        )}

        {m.contract_measurement_approvals.length > 0 && (
          <ul className="space-y-1 text-muted-foreground">
            {[...m.contract_measurement_approvals].sort((a, b) => a.step_order - b.step_order).map((a) => (
              <li key={a.id}>{a.step_order}. {userName(a.approver_id)} — {a.decision}{a.comment ? ` · ${a.comment}` : ""}</li>
            ))}
          </ul>
        )}

        {m.status === "reprovada" && m.rejection_reason && (
          <p className="rounded-md bg-destructive/10 p-2 text-destructive">Motivo: {m.rejection_reason}</p>
        )}

        {myTurn && (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Comentário (opcional)"
              className="max-w-sm"
              value={comments[m.id] ?? ""}
              onChange={(e) => setComments((c) => ({ ...c, [m.id]: e.target.value }))}
            />
            <Button size="sm" onClick={() => act(m, true)} disabled={decide.isPending}>
              <Check className="mr-1 h-4 w-4" /> Aprovar
            </Button>
            <Button size="sm" variant="destructive" onClick={() => act(m, false)} disabled={decide.isPending}>
              <X className="mr-1 h-4 w-4" /> Reprovar
            </Button>
          </div>
        )}

        {(role === "admin" || ((m.status === "rascunho" || m.status === "reprovada") && m.created_by === uid)) && (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(m)}>
              <Pencil className="mr-1 h-4 w-4" /> Editar
            </Button>
            {(m.status === "rascunho" || m.status === "reprovada") && (
              <>
                <Button
                  size="sm" variant="outline" disabled={submit.isPending}
                  onClick={() =>
                    submit.mutateAsync(m.id)
                      .then(() => toast.success("Medição reenviada — aprovação recomeça do primeiro aprovador."))
                      .catch((e) => toast.error(e.message))
                  }
                >
                  <Send className="mr-1 h-4 w-4" /> {m.status === "reprovada" ? "Reenviar" : "Enviar para aprovação"}
                </Button>
                <Button
                  size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm("Excluir esta medição?")) {
                      remove.mutateAsync(m.id)
                        .then(() => toast.success("Medição excluída."))
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
          {["rascunho", "em_aprovacao", "reprovada"].includes(m.status) &&
            (role === "admin" || role === "gestor" || m.created_by === uid) && (
              <CancelarDialog
                title="Cancelar medição"
                description="O cancelamento é registrado no histórico com o motivo informado."
                pending={cancelMut.cancelMeasurement.isPending}
                onConfirm={async (reason) => {
                  await cancelMut.cancelMeasurement.mutateAsync({ id: m.id, reason });
                  toast.success("Medição cancelada.");
                }}
              />
            )}
          <Button size="sm" variant="ghost" onClick={() => setHistoryFor(historyFor === m.id ? null : m.id)}>
            <History className="mr-1 h-4 w-4" /> Ver histórico
          </Button>
        </div>
        {historyFor === m.id && (
          <HistoricoAlteracoes compact recordId={m.id} tables={['contract_measurements']} title="Histórico deste registro" />
        )}
      </div>
    );
  };

  const columns: ColunaCompacta<Measurement>[] = [
    {
      key: "ref",
      header: "Medição",
      cell: (m) => <span>#{m.id.slice(0, 8)}</span>,
    },
    {
      key: "contract",
      header: "Contrato",
      cell: (m) => (
        <div className="min-w-0">
          <div className="truncate">{m.contracts?.number ?? "—"}</div>
          <div className="table-subtext truncate">{m.contracts?.supplier ?? ""}</div>
        </div>
      ),
    },
    {
      key: "competence",
      header: "Competência",
      hideBelow: "md",
      cell: (m) => <span>{m.reference_month?.slice(0, 7) ?? "—"}</span>,
    },
    { key: "value", header: "Valor", className: "text-right tabular-nums", cell: (m) => formatBRL(Number(m.total_value)) },
    { key: "status", header: "Status", className: "text-right", cell: (m) => <StatusBadge status={m.status} /> },
  ];

  const renderTabela = (list: Measurement[], myTurn: boolean, empty: string) => (
    <TabelaCompacta
      columns={columns}
      rows={list}
      empty={empty}
      expandedId={expanded}
      onRowClick={(m) => setExpanded(expanded === m.id ? null : m.id)}
      renderExpanded={(m) => renderDetalhe(m, myTurn)}
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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Demais medições</h2>
        {renderTabela(others, false, "Nenhuma medição.")}
      </section>
      {editing && (
        <EditarMedicaoDialog measurement={editing} open onOpenChange={(v) => !v && setEditing(null)} />
      )}
    </div>
  );
}
