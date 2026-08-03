import { useState } from "react";
import { Plus, Trash2, Send, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActiveCostCenters } from "@/lib/params-hooks";
import { useContractsStable, formatBRL } from "@/lib/contracts-store";
import { useMeasurementMutations } from "@/lib/approvals-hooks";

type Line = { key: string; costCenterId: string; value: string };
const newLine = (): Line => ({ key: crypto.randomUUID(), costCenterId: "", value: "" });

export default function LancamentoMedicao({ contractId }: { contractId?: string }) {
  const contracts = useContractsStable();
  const { data: costCenters } = useActiveCostCenters();
  const { create } = useMeasurementMutations();

  const [form, setForm] = useState({
    contract_id: contractId ?? "",
    reference_month: new Date().toISOString().slice(0, 7),
    total_value: "",
    notes: "",
  });
  const [detailed, setDetailed] = useState(false);
  const [lines, setLines] = useState<Line[]>([newLine()]);

  const total = Number(form.total_value || 0);
  const linesTotal = lines.reduce((s, l) => s + Number(l.value || 0), 0);

  const submit = async (send: boolean) => {
    if (!form.contract_id) return toast.error("Selecione o contrato.");
    if (total <= 0) return toast.error("Informe o valor da medição.");
    if (detailed && Math.abs(linesTotal - total) > 0.01) {
      return toast.error("O detalhamento por centro de custo precisa somar o valor total.");
    }
    try {
      await create.mutateAsync({
        fields: {
          contract_id: form.contract_id,
          reference_month: `${form.reference_month}-01`,
          total_value: total,
          notes: form.notes,
        },
        rateio: detailed
          ? lines.filter((l) => l.costCenterId && Number(l.value) > 0)
              .map((l) => ({ cost_center_id: l.costCenterId, value: Number(l.value) }))
          : [],
        submit: send,
      });
      toast.success(send ? "Medição enviada para aprovação." : "Medição salva como rascunho.");
      setForm((f) => ({ ...f, total_value: "", notes: "" }));
      setLines([newLine()]);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Dados da medição</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Contrato</Label>
            <Select value={form.contract_id} onValueChange={(v) => setForm((f) => ({ ...f, contract_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione o contrato" /></SelectTrigger>
              <SelectContent>
                {contracts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.number} — {c.supplier}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detalhamento por centro de custo (opcional)</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => setDetailed((d) => !d)}>
            {detailed ? "Usar valor único" : "Detalhar"}
          </Button>
        </CardHeader>
        {detailed && (
          <CardContent className="space-y-3">
            {lines.map((line, i) => (
              <div key={line.key} className="flex flex-wrap items-end gap-3">
                <div className="min-w-[220px] flex-1">
                  <Label className="text-xs text-muted-foreground">Centro de custo</Label>
                  <Select
                    value={line.costCenterId}
                    onValueChange={(v) => setLines((r) => r.map((l, idx) => (idx === i ? { ...l, costCenterId: v } : l)))}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {(costCenters ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.code ? `${c.code} — ${c.name}` : c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-40">
                  <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                  <Input
                    type="number" min={0} step="0.01" value={line.value}
                    onChange={(e) => setLines((r) => r.map((l, idx) => (idx === i ? { ...l, value: e.target.value } : l)))}
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setLines((r) => r.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setLines((r) => [...r, newLine()])}>
                <Plus className="mr-1 h-4 w-4" /> Linha
              </Button>
              <p className={`text-sm ${Math.abs(linesTotal - total) > 0.01 ? "text-destructive" : "text-muted-foreground"}`}>
                {formatBRL(linesTotal)} de {formatBRL(total)}
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" disabled={create.isPending} onClick={() => submit(false)}>
          <Save className="mr-2 h-4 w-4" /> Salvar rascunho
        </Button>
        <Button disabled={create.isPending} onClick={() => submit(true)}>
          <Send className="mr-2 h-4 w-4" /> Enviar para aprovação
        </Button>
      </div>
    </div>
  );
}