import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinancialCategorySelect } from "@/components/FinancialCategorySelect";
import { useActiveCostCenters } from "@/lib/params-hooks";
import { updateContract, type Contract } from "@/lib/contracts-store";

const INDEXES = ["Nenhum", "IPCA", "IGP-M", "INCC", "SINAPI"] as const;
const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2000, i, 1).toLocaleDateString("pt-BR", { month: "long" }),
}));

export default function EditarContratoDialog({
  contract,
  open,
  onOpenChange,
}: {
  contract: Contract;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: costCenters } = useActiveCostCenters();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    number: contract.number,
    supplier: contract.supplier,
    object: contract.object,
    globalValue: String(contract.globalValue),
    budgetNA: contract.budgetValue === null,
    budgetValue: contract.budgetValue === null ? "" : String(contract.budgetValue),
    startDate: contract.startDate,
    endDate: contract.endDate,
    adjustmentIndex: contract.adjustmentIndex,
    adjustmentMonth: String(contract.adjustmentMonth),
    costCenterId: contract.costCenterId ?? "",
    financialCategory: contract.financialCategory,
  });

  const save = async () => {
    if (!form.number.trim() || !form.supplier.trim()) {
      return toast.error("Informe número e fornecedor do contrato.");
    }
    if (Number(form.globalValue) <= 0) return toast.error("Informe o valor global.");
    setSaving(true);
    try {
      await updateContract(contract.id, {
        number: form.number.trim(),
        supplier: form.supplier.trim(),
        object: form.object,
        globalValue: Number(form.globalValue),
        budgetValue: form.budgetNA ? null : Number(form.budgetValue || 0),
        startDate: form.startDate,
        endDate: form.endDate,
        adjustmentIndex: form.adjustmentIndex as Contract["adjustmentIndex"],
        adjustmentMonth: Number(form.adjustmentMonth),
        costCenterId: form.costCenterId || null,
        financialCategory: form.financialCategory,
      });
      toast.success("Contrato atualizado.");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Editar contrato</DialogTitle></DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Número"><Input value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} /></Field>
          <Field label="Fornecedor"><Input value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} /></Field>
          <Field label="Objeto" className="sm:col-span-2"><Input value={form.object} onChange={(e) => setForm((f) => ({ ...f, object: e.target.value }))} /></Field>
          <Field label="Valor global (R$)">
            <Input type="number" min={0} step="0.01" value={form.globalValue} onChange={(e) => setForm((f) => ({ ...f, globalValue: e.target.value }))} />
          </Field>
          <Field label="Valor de orçamento (R$)">
            <div className="space-y-2">
              <Input
                type="number" min={0} step="0.01" disabled={form.budgetNA}
                value={form.budgetValue}
                onChange={(e) => setForm((f) => ({ ...f, budgetValue: e.target.value }))}
              />
              <div className="flex items-center gap-2">
                <Switch checked={form.budgetNA} onCheckedChange={(v) => setForm((f) => ({ ...f, budgetNA: v }))} />
                <span className="text-xs text-muted-foreground">Não se aplica</span>
              </div>
            </div>
          </Field>
          <Field label="Início da vigência"><Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} /></Field>
          <Field label="Fim da vigência"><Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} /></Field>
          <Field label="Índice de reajuste">
            <Select value={form.adjustmentIndex} onValueChange={(v) => setForm((f) => ({ ...f, adjustmentIndex: v as Contract["adjustmentIndex"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{INDEXES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Mês do reajuste">
            <Select value={form.adjustmentMonth} onValueChange={(v) => setForm((f) => ({ ...f, adjustmentMonth: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MONTHS.map((m) => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Centro de custo">
            <Select value={form.costCenterId} onValueChange={(v) => setForm((f) => ({ ...f, costCenterId: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {(costCenters ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.code ? `${c.code} — ${c.name}` : c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Categoria financeira">
            <FinancialCategorySelect value={form.financialCategory} onChange={(v) => setForm((f) => ({ ...f, financialCategory: v }))} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>Salvar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
