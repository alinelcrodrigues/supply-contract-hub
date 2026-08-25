import { useState } from "react";
import { Pencil, Plus, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBRL } from "@/lib/contracts-store";
import { useUsers } from "@/lib/params-hooks";
import { useTiers, useTierMutations, type TierKind } from "@/lib/approvals-hooks";

export default function ConfiguracaoAlcada({ kind, title }: { kind: TierKind; title: string }) {
  const { data: tiers, isLoading } = useTiers(kind);
  const { data: users } = useUsers();
  const m = useTierMutations(kind);
  const [form, setForm] = useState({ name: "", min: "", max: "" });
  const [approver, setApprover] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: "", min: "", max: "" });

  const startEdit = (t: { id: string; name: string; min_value: number; max_value: number | null }) => {
    setEditingId(t.id);
    setEdit({ name: t.name, min: String(t.min_value), max: t.max_value === null ? "" : String(t.max_value) });
  };

  const saveEdit = (id: string) => {
    if (!edit.name.trim()) return toast.error("Informe o nome da faixa.");
    run(
      m.updateTier.mutateAsync({
        id,
        patch: {
          name: edit.name.trim(),
          min_value: Number(edit.min || 0),
          max_value: edit.max === "" ? null : Number(edit.max),
        },
      }),
      "Faixa atualizada.",
    ).then(() => setEditingId(null));
  };

  const run = async (p: Promise<unknown>, ok: string) => {
    try { await p; toast.success(ok); } catch (e) { toast.error((e as Error).message); }
  };

  const addTier = () => {
    if (!form.name.trim()) return toast.error("Informe o nome da faixa.");
    run(
      m.addTier.mutateAsync({
        name: form.name.trim(),
        min_value: Number(form.min || 0),
        max_value: form.max === "" ? null : Number(form.max),
      }),
      "Faixa criada.",
    ).then(() => setForm({ name: "", min: "", max: "" }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <Label className="text-xs text-muted-foreground">Nome da faixa</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex.: Até R$ 50 mil" />
          </div>
          <div className="w-40">
            <Label className="text-xs text-muted-foreground">Valor mínimo</Label>
            <Input type="number" min={0} step="0.01" value={form.min} onChange={(e) => setForm((f) => ({ ...f, min: e.target.value }))} />
          </div>
          <div className="w-40">
            <Label className="text-xs text-muted-foreground">Valor máximo (vazio = sem teto)</Label>
            <Input type="number" min={0} step="0.01" value={form.max} onChange={(e) => setForm((f) => ({ ...f, max: e.target.value }))} />
          </div>
          <Button onClick={addTier} disabled={m.addTier.isPending}><Plus className="mr-1 h-4 w-4" /> Adicionar faixa</Button>
        </CardContent>
      </Card>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando faixas…</p>}
      {!isLoading && !tiers?.length && <p className="text-sm text-muted-foreground">Nenhuma faixa configurada.</p>}

      {(tiers ?? []).map((t) => (
        <Card key={t.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            {editingId === t.id ? (
              <div className="flex flex-1 flex-wrap items-end gap-3">
                <div className="min-w-[180px] flex-1">
                  <Label className="text-xs text-muted-foreground">Nome da faixa</Label>
                  <Input value={edit.name} onChange={(e) => setEdit((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="w-36">
                  <Label className="text-xs text-muted-foreground">Mínimo</Label>
                  <Input type="number" min={0} step="0.01" value={edit.min} onChange={(e) => setEdit((f) => ({ ...f, min: e.target.value }))} />
                </div>
                <div className="w-36">
                  <Label className="text-xs text-muted-foreground">Máximo</Label>
                  <Input type="number" min={0} step="0.01" value={edit.max} onChange={(e) => setEdit((f) => ({ ...f, max: e.target.value }))} />
                </div>
                <Button size="sm" onClick={() => saveEdit(t.id)} disabled={m.updateTier.isPending}>
                  <Check className="mr-1 h-4 w-4" /> Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                  <X className="mr-1 h-4 w-4" /> Cancelar
                </Button>
              </div>
            ) : (
              <div>
                <CardTitle className="text-base">{t.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {formatBRL(t.min_value)} até {t.max_value === null ? "sem teto" : formatBRL(t.max_value)}
                </p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Ativa</Label>
                <Switch
                  checked={t.active}
                  onCheckedChange={(v) => run(m.updateTier.mutateAsync({ id: t.id, patch: { active: v } }), "Faixa atualizada.")}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => startEdit(t)} aria-label="Editar faixa">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => run(m.removeTier.mutateAsync(t.id), "Faixa removida.")}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {t.steps.length === 0 && <span className="text-sm text-muted-foreground">Sem aprovadores — a faixa não pode ser usada.</span>}
              {t.steps.map((s) => (
                <Badge key={s.id} variant="outline" className="gap-2 py-1">
                  {s.step_order}. {users?.find((u) => u.id === s.approver_id)?.name ?? "—"}
                  <button onClick={() => run(m.removeStep.mutateAsync(s.id), "Aprovador removido.")} aria-label="Remover aprovador">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px]">
                <Label className="text-xs text-muted-foreground">Adicionar aprovador (na ordem)</Label>
                <Select value={approver[t.id] ?? ""} onValueChange={(v) => setApprover((a) => ({ ...a, [t.id]: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o usuário" /></SelectTrigger>
                  <SelectContent>
                    {(users ?? []).map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                disabled={!approver[t.id]}
                onClick={() =>
                  run(
                    m.addStep.mutateAsync({
                      tier_id: t.id,
                      step_order: (t.steps.at(-1)?.step_order ?? 0) + 1,
                      approver_id: approver[t.id]!,
                    }),
                    "Aprovador adicionado.",
                  ).then(() => setApprover((a) => ({ ...a, [t.id]: "" })))
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Incluir
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}