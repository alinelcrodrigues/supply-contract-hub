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
  PERMISSIONS,
  ROLES,
  useCostCenters,
  useCostCenterMutations,
  useCurrentUserRole,
  useRolePermissions,
  useToggleRolePermission,
  useUpdateUser,
  useUsers,
  type CostCenter,
  type PermissionId,
  type RoleId,
  type UserRow,
} from "@/lib/params-hooks";

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
  const { data: role } = useCurrentUserRole();
  const isAdmin = role === "admin";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Parametrização</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure usuários, permissões e centros de custo do sistema.
          {!isAdmin && " Apenas administradores podem editar."}
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" />Usuários</TabsTrigger>
          <TabsTrigger value="roles" className="gap-2"><KeyRound className="h-4 w-4" />Permissões</TabsTrigger>
          <TabsTrigger value="cc" className="gap-2"><Building2 className="h-4 w-4" />Centros de custo</TabsTrigger>
        </TabsList>

        <TabsContent value="users"><UsersTab isAdmin={isAdmin} /></TabsContent>
        <TabsContent value="roles"><RolesTab isAdmin={isAdmin} /></TabsContent>
        <TabsContent value="cc"><CostCentersTab isAdmin={isAdmin} /></TabsContent>
      </Tabs>
    </div>
  );
}

function roleLabel(id: RoleId) {
  return ROLES.find((r) => r.id === id)?.label ?? id;
}

/* ---------- Users ---------- */
function UsersTab({ isAdmin }: { isAdmin: boolean }) {
  const { data: users = [], isLoading } = useUsers();
  const [editing, setEditing] = useState<UserRow | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Usuários cadastrados</CardTitle>
        <div className="text-xs text-muted-foreground">
          Novos usuários são criados na tela de login (Criar conta).
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <EmptyState text="Carregando..." />
        ) : users.length === 0 ? (
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
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell><Badge variant="outline">{roleLabel(u.role)}</Badge></TableCell>
                    <TableCell>
                      {u.active
                        ? <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Ativo</Badge>
                        : <Badge variant="secondary">Inativo</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" disabled={!isAdmin} onClick={() => setEditing(u)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <UserDialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)} editing={editing} />
    </Card>
  );
}

function UserDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing: UserRow | null }) {
  const [form, setForm] = useState<{ name: string; role: RoleId; active: boolean }>({ name: "", role: "gestor", active: true });
  const { mutate: update, isPending } = useUpdateUser();

  useEffect(() => {
    if (editing) setForm({ name: editing.name, role: editing.role, active: editing.active });
  }, [editing]);

  if (!editing) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar usuário</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={editing.email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Papel</Label>
            <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as RoleId }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <div className="text-sm font-medium">Usuário ativo</div>
              <div className="text-xs text-muted-foreground">Inativos permanecem cadastrados mas não usam o sistema.</div>
            </div>
            <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={isPending}
            onClick={() => {
              if (!form.name.trim()) { toast.error("Informe o nome"); return; }
              update(
                { id: editing.id, name: form.name, active: form.active, role: form.role },
                {
                  onSuccess: () => { toast.success("Usuário atualizado"); onOpenChange(false); },
                  onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar"),
                },
              );
            }}
          >Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Roles / Permissions ---------- */
function RolesTab({ isAdmin }: { isAdmin: boolean }) {
  const { data: perms } = useRolePermissions();
  const { mutate: toggle } = useToggleRolePermission();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Matriz de permissões</CardTitle>
        <p className="text-sm text-muted-foreground">Defina o que cada papel pode fazer.</p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Permissão</TableHead>
              {ROLES.map((r) => <TableHead key={r.id} className="text-center">{r.label}</TableHead>)}
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
                  const enabled = perms?.[r.id]?.has(p.id) ?? false;
                  return (
                    <TableCell key={r.id} className="text-center">
                      <Checkbox
                        disabled={!isAdmin}
                        checked={enabled}
                        onCheckedChange={(v) =>
                          toggle(
                            { role: r.id, permission: p.id as PermissionId, enabled: !!v },
                            { onError: (e) => toast.error(e instanceof Error ? e.message : "Erro") },
                          )
                        }
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
function CostCentersTab({ isAdmin }: { isAdmin: boolean }) {
  const { data: cc = [] } = useCostCenters();
  const { add, update, remove } = useCostCenterMutations();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const submit = () => {
    if (!name.trim()) { toast.error("Informe o nome"); return; }
    add.mutate(
      { code: code.trim(), name: name.trim() },
      {
        onSuccess: () => { setName(""); setCode(""); toast.success("Centro de custo cadastrado"); },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
      },
    );
  };

  return (
    <div className="space-y-6">
      {isAdmin && (
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
                <Button onClick={submit} disabled={add.isPending}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  {cc.map((c: CostCenter) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.code || "—"}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>
                        <Switch
                          disabled={!isAdmin}
                          checked={c.active}
                          onCheckedChange={(v) => update.mutate({ id: c.id, patch: { active: v } })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!isAdmin}
                          onClick={() => {
                            if (confirm(`Remover ${c.name}?`)) {
                              remove.mutate(c.id, { onSuccess: () => toast.success("Removido") });
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
      </Card>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</div>;
}