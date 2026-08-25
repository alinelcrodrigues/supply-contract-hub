import { useState } from "react";
import { Check, X, Send, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatBRL } from "@/lib/contracts-store";
import { useUsers, useCostCenters } from "@/lib/params-hooks";
import {
  useApprovalMeasurements, useMeasurementMutations, useTiers, useCurrentUserId, type Measurement,
} from "@/lib/approvals-hooks";
import EditarMedicaoDialog from "@/components/EditarMedicaoDialog";

const statusLabel: Record<string, string> = {
  rascunho: "Rascunho",
  em_aprovacao: "Em aprovação",
  aprovada: "Aprovada",
  reprovada: "Reprovada",
};

export default function PainelAprovacaoMedicao() {
  const { data: measurements, isLoading } = useApprovalMeasurements();
  const { data: tiers } = useTiers("measurement");
  const { data: users } = useUsers();
  const { data: costCenters } = useCostCenters();
  const { data: uid } = useCurrentUserId();
  const { decide, submit, remove } = useMeasurementMutations();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Measurement | null>(null);

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

  const pending = measurements.filter((m) => m.status === "em_aprovacao" && currentApprover(m) === uid);
  const others = measurements.filter((m) => !pending.includes(m));

  const renderCard = (m: Measurement, myTurn: boolean) => {
    const tier = tiers?.find((t) => t.id === m.tier_id);
    return (
      <Card key={m.id} className={myTurn ? "border-secondary" : ""}>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">
              {m.contracts?.number ?? "Contrato"} — {formatBRL(Number(m.total_value))}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {m.contracts?.supplier} · Referência {m.reference_month?.slice(0, 7)}
            </p>
          </div>
          <Badge variant={m.status === "aprovada" ? "default" : m.status === "reprovada" ? "destructive" : "secondary"}>
            {statusLabel[m.status] ?? m.status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p><span className="text-muted-foreground">Lançada por:</span> {userName(m.created_by)}</p>
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

          {m.status !== "aprovada" && (
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
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Aguardando sua aprovação ({pending.length})</h2>
        {pending.length === 0
          ? <p className="text-sm text-muted-foreground">Nada pendente para você.</p>
          : pending.map((m) => renderCard(m, true))}
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Demais medições</h2>
        {others.map((m) => renderCard(m, false))}
      </section>
      {editing && (
        <EditarMedicaoDialog measurement={editing} open onOpenChange={(v) => !v && setEditing(null)} />
      )}
    </div>
  );
}