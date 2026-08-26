import { useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCanManageCarreteiros, usePlateMutations, usePlates, type PlateStatus } from "@/lib/carreteiros-hooks";

const STATUS_LABEL: Record<PlateStatus, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  recusada: "Recusada",
};

export default function CadastroPlacas() {
  const { data: plates = [], isLoading } = usePlates();
  const { data: canManage } = useCanManageCarreteiros();
  const { add, setStatus, remove } = usePlateMutations();
  const [form, setForm] = useState({ plate: "", driver_name: "", notes: "" });

  const submit = () => {
    if (!form.plate.trim()) {
      toast.error("Informe a placa.");
      return;
    }
    add.mutate(form, {
      onSuccess: () => {
        toast.success("Placa cadastrada. Aguardando aprovação.");
        setForm({ plate: "", driver_name: "", notes: "" });
      },
      onError: (e) => toast.error((e as Error).message),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova placa</CardTitle>
          <p className="text-xs text-muted-foreground">
            A placa entra como <strong>pendente</strong> e é liberada por quem tem permissão de carreteiros.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Placa</Label>
            <Input
              value={form.plate}
              onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value.toUpperCase() }))}
              placeholder="ABC1D23"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Motorista</Label>
            <Input value={form.driver_name} onChange={(e) => setForm((f) => ({ ...f, driver_name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="sm:col-span-3">
            <Button onClick={submit} disabled={add.isPending}>
              <Plus className="mr-1 h-4 w-4" /> Cadastrar placa
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Placas cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : plates.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma placa cadastrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plates.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono font-medium">{p.plate}</TableCell>
                      <TableCell>{p.driver_name || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={p.status === "aprovada" ? "default" : p.status === "recusada" ? "destructive" : "secondary"}
                        >
                          {STATUS_LABEL[p.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage && p.status !== "aprovada" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setStatus.mutate(
                                { id: p.id, status: "aprovada" },
                                { onSuccess: () => toast.success("Placa aprovada."), onError: (e) => toast.error((e as Error).message) },
                              )
                            }
                          >
                            <Check className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        {canManage && p.status !== "recusada" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setStatus.mutate(
                                { id: p.id, status: "recusada" },
                                { onSuccess: () => toast.success("Placa recusada."), onError: (e) => toast.error((e as Error).message) },
                              )
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        {canManage && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Remover a placa ${p.plate}?`)) {
                                remove.mutate(p.id, { onError: (e) => toast.error((e as Error).message) });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
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
