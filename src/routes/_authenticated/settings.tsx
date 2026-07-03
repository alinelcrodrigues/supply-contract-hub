import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, KeyRound, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  addCostCenter,
  addUser,
  deleteCostCenter,
  deleteUser,
  PERMISSIONS,
  ROLES,
  setRolePermission,
  updateCostCenter,
  updateUser,
  useParams,
  type CostCenterRecord,
  type PermissionId,
  type RoleId,
  type User,
} from "@/lib/params-store";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Parametrização — BALI CONSTRUTORA" },
      { name: "description", content: "Cadastro de usuários, permissões e centros de custo." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Parametrização</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure usuários, permissões e centros de custo do sistema.
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" />Usuários</TabsTrigger>
          <TabsTrigger value="roles" className="gap-2"><KeyRound className="h-4 w-4" />Permissões</TabsTrigger>
          <TabsTrigger value="cc" className="gap-2"><Building2 className="h-4 w-4" />Centros de custo</TabsTrigger>
        </TabsList>

        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="roles"><RolesTab /></TabsContent>
        <TabsContent value="cc"><CostCentersTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function roleLabel(id: RoleId) {
  return ROLES.find((r) => r.id === id)?.label ?? id;
}

/* ---------- Users ---------- */
function UsersTab() {
  const { users } = useParams();
  const [editing, setEditing] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (u: User) => { setEditing(u); setOpen(true); };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Usuários cadastrados</CardTitle>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" />Novo usuário</Button>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <EmptyState text="Nenhum usuário cadastrado." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell><Badge variant="outline">{roleLabel(u.roleId)}</Badge></TableCell>
                    <TableCell>
                      {u.active
                        ? <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Ativo</Badge>
                        : <Badge variant="secondary">Inativo</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Remover ${u.name}?`)) { deleteUser(u.id); toast.success("Usuário removido"); } }}>
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
      <UserDialog open={open} onOpenChange={setOpen} editing={editing} />
    </Card>
  );
}

function UserDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing: User | null }) {
  const [form, setForm] = useState<{ name: string; email: string; roleId: RoleId; active: boolean }>({
    name: "", email: "", roleId: "gestor", active: true,
  });

  useEffect(() => {
    if (!open) return;
    if (editing) setForm({ name: editing.name, email: editing.email, roleId: editing.roleId, active: editing.active });
    else setForm({ name: "", email: "", roleId: "gestor", active: true });
  }, [open, editing]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar usuário" : "Novo usuário"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Papel</Label>
            <Select value={form.roleId} onValueChange={(v) => setForm((f) => ({ ...f, roleId: v as RoleId }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <div className="text-sm font-medium">Usuário ativo</div>
              <div className="text-xs text-muted-foreground">Usuários inativos não podem acessar o sistema.</div>
            </div>
            <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={() => {
              if (!form.name.trim() || !form.email.trim()) { toast.error("Preencha nome e e-mail"); return; }
              if (editing) { updateUser(editing.id, form); toast.success("Usuário atualizado"); }
              else { addUser(form); toast.success("Usuário cadastrado"); }
              onOpenChange(false);
            }}
          >Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Roles / Permissions ---------- */
function RolesTab() {
  const { perms } = useParams();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Matriz de permissões</CardTitle>
        <p className="text-sm text-muted-foreground">
          Defina o que cada papel pode fazer no sistema.
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Permissão</TableHead>
              {ROLES.map((r) => (
                <TableHead key={r.id} className="text-center">{r.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSIONS.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="font-medium">{p.label}</div>
                  <div className="text-xs text-muted-foreground">{p.id}</div>
                </TableCell>
                {ROLES.map((r) => {
                  const enabled = perms[r.id]?.includes(p.id as PermissionId) ?? false;
                  return (
                    <TableCell key={r.id} className="text-center">
                      <Checkbox
                        checked={enabled}
                        onCheckedChange={(v) => setRolePermission(r.id, p.id as PermissionId, !!v)}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ---------- Cost Centers ---------- */
function CostCentersTab() {
  const { cc } = useParams();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const submit = () => {
    if (!name.trim()) { toast.error("Informe o nome do centro de custo"); return; }
    addCostCenter({ name: name.trim(), code: code.trim() || undefined, active: true });
    setName(""); setCode("");
    toast.success("Centro de custo cadastrado");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Novo centro de custo</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[160px_1fr_auto]">
            <div className="space-y-1">
              <Label>Código</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CC-010" />
            </div>
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Obra Residencial Sul" />
            </div>
            <div className="flex items-end">
              <Button onClick={submit}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Centros de custo cadastrados</CardTitle></CardHeader>
        <CardContent>
          {cc.length === 0 ? (
            <EmptyState text="Nenhum centro de custo cadastrado." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-[120px]">Ativo</TableHead>
                    <TableHead className="w-[80px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cc.map((c: CostCenterRecord) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.code || "—"}</TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>
                        <Switch checked={c.active} onCheckedChange={(v) => updateCostCenter(c.id, { active: v })} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Remover ${c.name}?`)) { deleteCostCenter(c.id); toast.success("Removido"); } }}>
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
      </Card>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</div>;
}