import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CostCenterSelect from "@/components/CostCenterSelect";
import FinancialCategorySelect from "@/components/FinancialCategorySelect";
import { formatBRL, formatDate } from "@/lib/contracts-store";
import {
  PRICING_LABEL,
  computeLoadValue,
  useCanManageCarreteiros,
  useCarreteiroContracts,
  useLoadMutations,
  useLoads,
  usePlateLinks,
  usePlates,
} from "@/lib/carreteiros-hooks";

const today = () => new Date().toISOString().slice(0, 10);

export default function LancamentoCarga() {
  const { data: canManage } = useCanManageCarreteiros();
  const { data: contracts = [] } = useCarreteiroContracts();
  const { data: plates = [] } = usePlates();
  const { data: links = [] } = usePlateLinks();
  const { data: loads = [], isLoading } = useLoads();
  const { add, remove } = useLoadMutations();

  const [form, setForm] = useState({
    plate_id: "",
    load_date: today(),
    origin: "",
    destination: "",
    km: "",
    tons: "",
    cost_center_id: null as string | null,
    financial_category: "",
    notes: "",
  });

  /** Contrato vigente para a placa na data da carga. */
  const contract = useMemo(() => {
    const link = links.find(
      (l) =>
        l.plate_id === form.plate_id &&
        form.load_date >= l.start_date &&
        (!l.end_date || form.load_date <= l.end_date),
    );
    return link ? contracts.find((c) => c.id === link.contract_id) ?? null : null;
  }, [links, contracts, form.plate_id, form.load_date]);

  const preview = contract
    ? computeLoadValue(contract.pricing_mode, Number(form.km || 0), Number(form.tons || 0), Number(contract.unit_price))
    : 0;

  const submit = () => {
    if (!form.plate_id) {
      toast.error("Selecione a placa.");
      return;
    }
    if (!contract) {
      toast.error("Nenhum contrato de carreteiro vigente para esta placa nesta data.");
      return;
    }
    add.mutate(
      {
        contract_id: contract.id,
        plate_id: form.plate_id,
        load_date: form.load_date,
        origin: form.origin,
        destination: form.destination,
        km: Number(form.km || 0),
        tons: Number(form.tons || 0),
        unit_price: Number(contract.unit_price),
        pricing_mode: contract.pricing_mode,
        cost_center_id: form.cost_center_id ?? contract.cost_center_id,
        financial_category: form.financial_category || contract.financial_category,
        notes: form.notes,
      },
      {
        onSuccess: () => {
          toast.success("Carga lançada.");
          setForm((f) => ({ ...f, origin: "", destination: "", km: "", tons: "", notes: "" }));
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const approvedPlates = plates.filter((p) => p.status === "aprovada");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lançar carga</CardTitle>
          <p className="text-xs text-muted-foreground">
            O contrato é encontrado automaticamente pela placa e pela data da carga.
          </p>
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
            <Input type="date" value={form.load_date} onChange={(e) => setForm((f) => ({ ...f, load_date: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Contrato vigente</Label>
            <div className="flex h-9 items-center rounded-md border border-border bg-muted/40 px-3 text-sm">
              {contract ? `${contract.number} · ${contract.carrier_name}` : "—"}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Origem</Label>
            <Input value={form.origin} onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Destino</Label>
            <Input value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Km</Label>
            <Input type="number" step="0.01" value={form.km} onChange={(e) => setForm((f) => ({ ...f, km: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Toneladas</Label>
            <Input type="number" step="0.001" value={form.tons} onChange={(e) => setForm((f) => ({ ...f, tons: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Centro de custo</Label>
            <CostCenterSelect
              value={form.cost_center_id ?? contract?.cost_center_id ?? null}
              onChange={(id) => setForm((f) => ({ ...f, cost_center_id: id }))}
              allowEmpty
            />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria financeira</Label>
            <FinancialCategorySelect
              value={form.financial_category || contract?.financial_category || ""}
              onChange={(v) => setForm((f) => ({ ...f, financial_category: v }))}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <Label>Observações</Label>
            <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>

          <div className="rounded-md border border-secondary bg-secondary/10 p-4 sm:col-span-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Prévia do cálculo</div>
            <div className="mt-1 text-lg font-semibold text-primary">{formatBRL(preview)}</div>
            <div className="text-xs text-muted-foreground">
              {contract
                ? `${PRICING_LABEL[contract.pricing_mode]} · preço ${formatBRL(Number(contract.unit_price))} · ${form.km || 0} km · ${form.tons || 0} t`
                : "Selecione uma placa com contrato vigente."}
            </div>
          </div>

          <div className="sm:col-span-3">
            <Button onClick={submit} disabled={!canManage || add.isPending}>
              <Plus className="mr-1 h-4 w-4" /> Lançar carga
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cargas lançadas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : loads.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma carga lançada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Trecho</TableHead>
                    <TableHead className="text-right">Km</TableHead>
                    <TableHead className="text-right">Ton</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Situação</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loads.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{formatDate(l.load_date)}</TableCell>
                      <TableCell className="font-mono">{l.carreteiro_plates?.plate ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {l.origin || "—"} → {l.destination || "—"}
                      </TableCell>
                      <TableCell className="text-right">{Number(l.km)}</TableCell>
                      <TableCell className="text-right">{Number(l.tons)}</TableCell>
                      <TableCell className="text-right font-medium">{formatBRL(Number(l.total_value))}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={l.closing_id ? "default" : "secondary"}>
                          {l.closing_id ? "Fechada" : "Em aberto"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage && !l.closing_id && (
                          <Button size="sm" variant="ghost" onClick={() => remove.mutate(l.id)}>
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
