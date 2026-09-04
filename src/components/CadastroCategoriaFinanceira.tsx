import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCanManageMasterData } from "@/lib/master-data-hooks";
import {
  useFinancialCategories,
  useFinancialCategoryMutations,
  type FinancialCategoryRow,
} from "@/lib/financial-categories-hooks";

export default function CadastroCategoriaFinanceira() {
  const { data: all = [], isLoading } = useFinancialCategories(false);
  const { data: canManage } = useCanManageMasterData();
  const { save, remove } = useFinancialCategoryMutations();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialCategoryRow | null>(null);
  const [form, setForm] = useState<{ name: string; kind: "receita" | "despesa"; active: boolean }>({
    name: "",
    kind: "despesa",
    active: true,
  });

  const list = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return all;
    return all.filter((c) => c.name.toLowerCase().includes(s));
  }, [all, search]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", kind: "despesa", active: true });
    setOpen(true);
  };

  const openEdit = (c: FinancialCategoryRow) => {
    setEditing(c);
    setForm({ name: c.name, kind: c.kind, active: c.active });
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome da categoria.");
      return;
    }
    save.mutate(
      { id: editing?.id, values: { name: form.name.trim(), kind: form.kind, active: form.active } },
      {
        onSuccess: () => {
          toast.success(editing ? "Categoria atualizada." : "Categoria cadastrada.");
          setOpen(false);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">Categorias financeiras</CardTitle>
          <p className="text-xs text-muted-foreground">
            {all.length} categoria(s) cadastrada(s), usadas em contratos, aditivos e solicitações.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {canManage && (
            <Button onClick={openNew}>
              <Plus className="mr-1 h-4 w-4" />
              Nova
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Empty text="Carregando..." />
        ) : list.length === 0 ? (
          <Empty text="Nenhuma categoria encontrada." />
        ) : (
          <div className="max-h-[520px] overflow-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="w-[120px]">Tipo</TableHead>
                  <TableHead className="w-[100px]">Ativa</TableHead>
                  <TableHead className="w-[110px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>
                      <Badge variant={c.kind === "receita" ? "default" : "outline"}>{c.kind}</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        disabled={!canManage}
                        checked={c.active}
                        onCheckedChange={(v) => save.mutate({ id: c.id, values: { active: v } })}
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
                              onSuccess: () => toast.success("Categoria removida."),
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
            <DialogTitle>{editing ? "Editar categoria" : "Nova categoria financeira"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.kind} onValueChange={(v) => setForm((f) => ({ ...f, kind: v as "receita" | "despesa" }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="receita">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div className="text-sm font-medium">Categoria ativa</div>
              <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
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
