import { useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  emptySupplier,
  useCanManageMasterData,
  useSupplierMutations,
  useSuppliers,
  type Supplier,
} from "@/lib/master-data-hooks";

export default function CadastroFornecedores() {
  const [search, setSearch] = useState("");
  const { data: suppliers = [], isLoading } = useSuppliers(search);
  const { data: canManage } = useCanManageMasterData();
  const { save, remove } = useSupplierMutations();
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptySupplier());

  const set = (k: keyof ReturnType<typeof emptySupplier>, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }) as typeof f);

  const openNew = () => {
    setEditing(null);
    setForm(emptySupplier());
    setOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    const { id: _id, ...rest } = s;
    setForm({ ...emptySupplier(), ...rest, doc: rest.doc ?? "" });
    setOpen(true);
  };

  const submit = () => {
    if (!form.trade_name.trim()) {
      toast.error("Informe o nome fantasia.");
      return;
    }
    save.mutate(
      { id: editing?.id, values: form },
      {
        onSuccess: () => {
          toast.success(editing ? "Fornecedor atualizado." : "Fornecedor cadastrado.");
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
          <CardTitle className="text-base">Fornecedores</CardTitle>
          <p className="text-xs text-muted-foreground">Base de fornecedores usada nas solicitações de contrato.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar nome ou CNPJ"
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
        ) : suppliers.length === 0 ? (
          <Empty text="Nenhum fornecedor encontrado." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome fantasia</TableHead>
                  <TableHead>Razão social</TableHead>
                  <TableHead>CNPJ / CPF</TableHead>
                  <TableHead>Cidade / UF</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.trade_name}</TableCell>
                    <TableCell>{s.legal_name || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{s.doc || "—"}</TableCell>
                    <TableCell>
                      {[s.city, s.state].filter(Boolean).join(" / ") || "—"}
                    </TableCell>
                    <TableCell>
                      {s.active ? (
                        <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" disabled={!canManage} onClick={() => openEdit(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!canManage}
                        onClick={() => {
                          if (confirm(`Remover ${s.trade_name}?`)) {
                            remove.mutate(s.id, {
                              onSuccess: () => toast.success("Fornecedor removido."),
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
            <p className="mt-3 text-xs text-muted-foreground">
              Exibindo até 200 registros. Use a busca para refinar.
            </p>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Nome fantasia">
              <Input value={form.trade_name} onChange={(e) => set("trade_name", e.target.value)} />
            </F>
            <F label="Razão social">
              <Input value={form.legal_name} onChange={(e) => set("legal_name", e.target.value)} />
            </F>
            <F label="Tipo de documento">
              <Select value={form.doc_type} onValueChange={(v) => set("doc_type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNPJ">CNPJ</SelectItem>
                  <SelectItem value="CPF">CPF</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <F label="CNPJ / CPF">
              <Input value={form.doc ?? ""} onChange={(e) => set("doc", e.target.value)} />
            </F>
            <F label="Endereço" className="sm:col-span-2">
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
            </F>
            <F label="Bairro">
              <Input value={form.district} onChange={(e) => set("district", e.target.value)} />
            </F>
            <F label="CEP">
              <Input value={form.zip_code} onChange={(e) => set("zip_code", e.target.value)} />
            </F>
            <F label="Cidade">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </F>
            <F label="UF">
              <Input maxLength={2} value={form.state} onChange={(e) => set("state", e.target.value.toUpperCase())} />
            </F>
            <F label="Contato">
              <Input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
            </F>
            <F label="Representante legal">
              <Input value={form.representative} onChange={(e) => set("representative", e.target.value)} />
            </F>
            <F label="E-mail">
              <Input value={form.email} onChange={(e) => set("email", e.target.value)} />
            </F>
            <F label="Telefone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </F>
            <F label="Observações" className="sm:col-span-2">
              <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </F>
            <div className="flex items-center justify-between rounded-md border border-border p-3 sm:col-span-2">
              <div className="text-sm font-medium">Fornecedor ativo</div>
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
