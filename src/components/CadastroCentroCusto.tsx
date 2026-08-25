import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCostCenters, useCostCenterMutations, type CostCenter } from "@/lib/params-hooks";
import { useCanManageMasterData } from "@/lib/master-data-hooks";

export default function CadastroCentroCusto() {
  const { data: all = [], isLoading } = useCostCenters();
  const { data: canManage } = useCanManageMasterData();
  const { add, update, remove } = useCostCenterMutations();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CostCenter | null>(null);
  const [form, setForm] = useState({ code: "", name: "", active: true });

  const list = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return all;
    return all.filter((c) => `${c.code ?? ""} ${c.name}`.toLowerCase().includes(s));
  }, [all, search]);

  const openNew = () => {
    setEditing(null);
    setForm({ code: "", name: "", active: true });
    setOpen(true);
  };

  const openEdit = (c: CostCenter) => {
    setEditing(c);
    setForm({ code: c.code ?? "", name: c.name, active: c.active });
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome do centro de custo.");
      return;
    }
    const done = () => {
      toast.success(editing ? "Centro de custo atualizado." : "Centro de custo cadastrado.");
      setOpen(false);
    };
    const onError = (e: unknown) => toast.error((e as Error).message);
    if (editing) {
      update.mutate(
        { id: editing.id, patch: { code: form.code || null, name: form.name, active: form.active } },
        { onSuccess: done, onError },
      );
    } else {
      add.mutate({ code: form.code, name: form.name }, { onSuccess: done, onError });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">Centros de custo</CardTitle>
          <p className="text-xs text-muted-foreground">Código e nome usados nos contratos, rateios e no dashboard.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {canManage && (
            <Button onClick={openNew}>
              <Plus className="mr-1 h-4 w-4" />
              Novo
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Empty text="Carregando..." />
        ) : list.length === 0 ? (
          <Empty text="Nenhum centro de custo encontrado." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[110px]">Ativo</TableHead>
                  <TableHead className="w-[110px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.code || "—"}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Switch
                        disabled={!canManage}
                        checked={c.active}
                        onCheckedChange={(v) => update.mutate({ id: c.id, patch: { active: v } })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" disabled={!canManage} onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!canManage}
                        onClick={() => {
                          if (confirm(`Remover ${c.name}?`)) {
                            remove.mutate(c.id, {
                              onSuccess: () => toast.success("Centro de custo removido."),
                              onError: (e) => toast.error((e as Error).message),
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar centro de custo" : "Novo centro de custo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Código</Label>
              <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="CC-010" />
            </div>
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            {editing && (
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div className="text-sm font-medium">Centro de custo ativo</div>
                <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={add.isPending || update.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
