import { useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  emptyProductService,
  useCanManageMasterData,
  useProductServiceMutations,
  useProductsServices,
  type ProductService,
} from "@/lib/master-data-hooks";

export default function CadastroProdutosServicos() {
  const [kind, setKind] = useState<"todos" | "produto" | "servico">("todos");
  const [search, setSearch] = useState("");
  const { data: items = [], isLoading } = useProductsServices(kind, search);
  const { data: canManage } = useCanManageMasterData();
  const { save, remove } = useProductServiceMutations();
  const [editing, setEditing] = useState<ProductService | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyProductService());

  const set = (k: keyof ReturnType<typeof emptyProductService>, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }) as typeof f);

  const openNew = () => {
    setEditing(null);
    setForm(emptyProductService(kind === "servico" ? "servico" : "produto"));
    setOpen(true);
  };

  const openEdit = (p: ProductService) => {
    setEditing(p);
    const { id: _id, ...rest } = p;
    setForm({ ...emptyProductService(), ...rest, sku: rest.sku ?? "" });
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("Informe a descrição.");
      return;
    }
    save.mutate(
      { id: editing?.id, values: form },
      {
        onSuccess: () => {
          toast.success(editing ? "Registro atualizado." : "Registro cadastrado.");
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
          <CardTitle className="text-base">Produtos e serviços</CardTitle>
          <p className="text-xs text-muted-foreground">
            Código SKU e código fiscal (NCM para produto, NBS para serviço).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="produto">Produtos</SelectItem>
              <SelectItem value="servico">Serviços</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar descrição, SKU ou código fiscal"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
        ) : items.length === 0 ? (
          <Empty text="Nenhum produto ou serviço encontrado." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">SKU</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[110px]">Tipo</TableHead>
                  <TableHead className="w-[130px]">Cód. fiscal</TableHead>
                  <TableHead className="w-[110px]">Situação</TableHead>
                  <TableHead className="w-[110px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.sku || "—"}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.kind === "servico" ? "Serviço" : "Produto"}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.fiscal_code || "—"}</TableCell>
                    <TableCell>
                      {p.active ? (
                        <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" disabled={!canManage} onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!canManage}
                        onClick={() => {
                          if (confirm(`Remover ${p.name}?`)) {
                            remove.mutate(p.id, {
                              onSuccess: () => toast.success("Registro removido."),
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
            <p className="mt-3 text-xs text-muted-foreground">Exibindo até 200 registros. Use a busca para refinar.</p>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar registro" : "Novo produto / serviço"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Tipo">
              <Select value={form.kind} onValueChange={(v) => set("kind", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="produto">Produto</SelectItem>
                  <SelectItem value="servico">Serviço</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <F label="Código SKU">
              <Input value={form.sku ?? ""} onChange={(e) => set("sku", e.target.value)} />
            </F>
            <F label="Descrição" className="sm:col-span-2">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </F>
            <F label={form.kind === "servico" ? "Código NBS" : "Código NCM"}>
              <Input value={form.fiscal_code} onChange={(e) => set("fiscal_code", e.target.value)} />
            </F>
            <F label="Unidade">
              <Input value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="UN, M², H..." />
            </F>
            <div className="flex items-center justify-between rounded-md border border-border p-3 sm:col-span-2">
              <div className="text-sm font-medium">Registro ativo</div>
              <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
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

function F({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
