import { useState } from "react";
import { Fuel as FuelIcon, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CostCenterSelect from "@/components/CostCenterSelect";
import { formatBRL, formatDate } from "@/lib/contracts-store";
import {
  useCanManageCarreteiros,
  useCarreteiroContracts,
  useClosings,
  useFuel,
  useFuelMutations,
  useGenerateClosing,
  usePlates,
} from "@/lib/carreteiros-hooks";

const today = () => new Date().toISOString().slice(0, 10);
const firstOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

export default function AbastecimentoEFechamentoCarreteiro() {
  const { data: canManage } = useCanManageCarreteiros();
  const { data: plates = [] } = usePlates();
  const { data: contracts = [] } = useCarreteiroContracts();
  const { data: fuel = [], isLoading } = useFuel();
  const { data: closings = [] } = useClosings();
  const { add, remove } = useFuelMutations();
  const generate = useGenerateClosing();

  const [form, setForm] = useState({
    plate_id: "",
    fuel_date: today(),
    liters: "",
    price_per_liter: "",
    cost_center_id: null as string | null,
    notes: "",
  });

  const [closing, setClosing] = useState({ contract_id: "", start: firstOfMonth(), end: today() });

  const total = Number(form.liters || 0) * Number(form.price_per_liter || 0);

  const submitFuel = () => {
    if (!form.plate_id) {
      toast.error("Selecione a placa.");
      return;
    }
    add.mutate(
      {
        plate_id: form.plate_id,
        fuel_date: form.fuel_date,
        liters: Number(form.liters || 0),
        price_per_liter: Number(form.price_per_liter || 0),
        cost_center_id: form.cost_center_id,
        notes: form.notes,
      },
      {
        onSuccess: () => {
          toast.success("Abastecimento registrado.");
          setForm((f) => ({ ...f, liters: "", price_per_liter: "", notes: "" }));
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const submitClosing = () => {
    if (!closing.contract_id) {
      toast.error("Selecione o contrato de carreteiro.");
      return;
    }
    generate.mutate(
      { contractId: closing.contract_id, start: closing.start, end: closing.end },
      {
        onSuccess: () => toast.success("Fechamento gerado. A medição foi criada como rascunho para envio à alçada."),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const approvedPlates = plates.filter((p) => p.status === "aprovada");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FuelIcon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Combustível fornecido</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Registrado por placa e descontado no fechamento do período.</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Placa</Label>
            <Select value={form.plate_id} onValueChange={(v) => setForm((f) => ({ ...f, plate_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {approvedPlates.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Data</Label>
            <Input type="date" value={form.fuel_date} onChange={(e) => setForm((f) => ({ ...f, fuel_date: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Centro de custo</Label>
            <CostCenterSelect value={form.cost_center_id} onChange={(id) => setForm((f) => ({ ...f, cost_center_id: id }))} allowEmpty />
          </div>
          <div className="space-y-1.5">
            <Label>Litros</Label>
            <Input type="number" step="0.01" value={form.liters} onChange={(e) => setForm((f) => ({ ...f, liters: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Preço por litro (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.price_per_liter}
              onChange={(e) => setForm((f) => ({ ...f, price_per_liter: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Total</Label>
            <div className="flex h-9 items-center rounded-md border border-border bg-muted/40 px-3 text-sm font-medium">
              {formatBRL(total)}
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <Label>Observações</Label>
            <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="sm:col-span-3">
            <Button onClick={submitFuel} disabled={!canManage || add.isPending}>
              <Plus className="mr-1 h-4 w-4" /> Registrar abastecimento
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Abastecimentos registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : fuel.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum abastecimento registrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead className="text-right">Litros</TableHead>
                    <TableHead className="text-right">R$/L</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Situação</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuel.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>{formatDate(f.fuel_date)}</TableCell>
                      <TableCell className="font-mono">{f.carreteiro_plates?.plate ?? "—"}</TableCell>
                      <TableCell className="text-right">{Number(f.liters)}</TableCell>
                      <TableCell className="text-right">{formatBRL(Number(f.price_per_liter))}</TableCell>
                      <TableCell className="text-right font-medium">{formatBRL(Number(f.total_value))}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={f.closing_id ? "default" : "secondary"}>{f.closing_id ? "Fechado" : "Em aberto"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage && !f.closing_id && (
                          <Button size="sm" variant="ghost" onClick={() => remove.mutate(f.id)}>
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Fechamento mensal</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Cargas do período menos combustível do período. O resultado vira uma medição no fluxo de alçada já existente.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Contrato de carreteiro</Label>
              <Select value={closing.contract_id} onValueChange={(v) => setClosing((c) => ({ ...c, contract_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.number} · {c.carrier_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Início do período</Label>
              <Input type="date" value={closing.start} onChange={(e) => setClosing((c) => ({ ...c, start: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Fim do período</Label>
              <Input type="date" value={closing.end} onChange={(e) => setClosing((c) => ({ ...c, end: e.target.value }))} />
            </div>
            <div className="sm:col-span-4">
              <Button onClick={submitClosing} disabled={!canManage || generate.isPending}>
                Gerar fechamento e medição
              </Button>
            </div>
          </div>

          {closings.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Cargas</TableHead>
                    <TableHead className="text-right">Combustível</TableHead>
                    <TableHead className="text-right">Líquido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closings.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.carreteiro_contracts?.number ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(c.period_start)} → {formatDate(c.period_end)}
                      </TableCell>
                      <TableCell className="text-right">{formatBRL(Number(c.loads_total))}</TableCell>
                      <TableCell className="text-right">-{formatBRL(Number(c.fuel_total))}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">{formatBRL(Number(c.net_total))}</TableCell>
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
