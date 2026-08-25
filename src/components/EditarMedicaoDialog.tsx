import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActiveCostCenters } from "@/lib/params-hooks";
import { formatBRL } from "@/lib/contracts-store";
import { useMeasurementMutations, type Measurement } from "@/lib/approvals-hooks";

type Line = { key: string; costCenterId: string; value: string };

export default function EditarMedicaoDialog({
  measurement,
  open,
  onOpenChange,
}: {
  measurement: Measurement;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: costCenters } = useActiveCostCenters();
  const { update } = useMeasurementMutations();

  const [form, setForm] = useState({
    reference_month: (measurement.reference_month ?? "").slice(0, 7),
    total_value: String(measurement.total_value ?? ""),
    notes: measurement.notes ?? "",
  });
  const [rateio, setRateio] = useState<Line[]>(
    (measurement.contract_measurement_cost_centers ?? []).map((r) => ({
      key: r.id,
      costCenterId: r.cost_center_id ?? "",
      value: String(r.value ?? ""),
    })),
  );

  const total = Number(form.total_value || 0);
  const rateioTotal = rateio.reduce((s, l) => s + Number(l.value || 0), 0);

  const save = async () => {
    if (total <= 0) return toast.error("Informe o valor da medição.");
    if (rateio.length && Math.abs(rateioTotal - total) > 0.01) {
      return toast.error("O rateio precisa somar o valor total.");
    }
    try {
      await update.mutateAsync({
        id: measurement.id,
        fields: {
          reference_month: `${form.reference_month}-01`,
          total_value: total,
          notes: form.notes,
        },
        rateio: rateio
          .filter((l) => l.costCenterId && Number(l.value) > 0)
          .map((l) => ({ cost_center_id: l.costCenterId, value: Number(l.value) })),
      });
      toast.success("Medição atualizada.");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>Editar medição</DialogTitle></DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Mês de referência</Label>
            <Input type="month" value={form.reference_month} onChange={(e) => setForm((f) => ({ ...f, reference_month: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Valor total (R$)</Label>
            <Input type="number" min={0} step="0.01" value={form.total_value} onChange={(e) => setForm((f) => ({ ...f, total_value: e.target.value }))} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Rateio por centro de custo</Label>
            <Button
              type="button" variant="outline" size="sm"
              onClick={() => setRateio((r) => [...r, { key: crypto.randomUUID(), costCenterId: "", value: "" }])}
            >
              <Plus className="mr-1 h-4 w-4" /> Linha
            </Button>
          </div>
          {rateio.map((line, i) => (
            <div key={line.key} className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1">
                <Label className="text-xs text-muted-foreground">Centro de custo</Label>
                <Select
                  value={line.costCenterId}
                  onValueChange={(v) => setRateio((r) => r.map((l, idx) => (idx === i ? { ...l, costCenterId: v } : l)))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(costCenters ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.code ? `${c.code} — ${c.name}` : c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                <Input
                  type="number" min={0} step="0.01" value={line.value}
                  onChange={(e) => setRateio((r) => r.map((l, idx) => (idx === i ? { ...l, value: e.target.value } : l)))}
                />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setRateio((r) => r.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {rateio.length > 0 && (
            <p className={`text-sm ${Math.abs(rateioTotal - total) > 0.01 ? "text-destructive" : "text-muted-foreground"}`}>
              Rateio: {formatBRL(rateioTotal)} de {formatBRL(total)}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={update.isPending}>Salvar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
