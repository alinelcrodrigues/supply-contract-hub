import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinancialCategorySelect } from "@/components/FinancialCategorySelect";
import { useActiveCostCenters } from "@/lib/params-hooks";
import { formatBRL } from "@/lib/contracts-store";
import { useContractRequestMutations, type ContractRequest } from "@/lib/approvals-hooks";

type Line = { key: string; costCenterId: string; value: string };

export default function EditarSolicitacaoDialog({
  request,
  open,
  onOpenChange,
}: {
  request: ContractRequest;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: costCenters } = useActiveCostCenters();
  const { update } = useContractRequestMutations();

  const [form, setForm] = useState({
    supplier_cnpj: request.supplier_cnpj ?? "",
    supplier_name: request.supplier_name ?? "",
    supplier_address: request.supplier_address ?? "",
    supplier_representative: request.supplier_representative ?? "",
    object: request.object ?? "",
    specification: request.specification ?? "",
    deadline_days: String(request.deadline_days ?? 0),
    payment_terms: request.payment_terms ?? "",
    obligations_contractor: request.obligations_contractor ?? "",
    obligations_contracted: request.obligations_contracted ?? "",
    financial_category: request.financial_category ?? "",
    total_value: String(request.total_value ?? ""),
  });
  const [rateio, setRateio] = useState<Line[]>(
    (request.contract_request_cost_centers ?? []).map((r) => ({
      key: r.id,
      costCenterId: r.cost_center_id ?? "",
      value: String(r.value ?? ""),
    })),
  );

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const total = Number(form.total_value || 0);
  const rateioTotal = rateio.reduce((s, l) => s + Number(l.value || 0), 0);

  const save = async () => {
    if (!form.supplier_name.trim() || !form.object.trim()) {
      return toast.error("Informe ao menos a razão social e o objeto.");
    }
    if (total <= 0) return toast.error("Informe o valor total da contratação.");
    try {
      await update.mutateAsync({
        id: request.id,
        fields: { ...form, deadline_days: Number(form.deadline_days || 0), total_value: total },
        rateio: rateio
          .filter((l) => l.costCenterId && Number(l.value) > 0)
          .map((l) => ({ cost_center_id: l.costCenterId, value: Number(l.value) })),
      });
      toast.success("Solicitação atualizada.");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Editar solicitação</DialogTitle></DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CNPJ"><Input value={form.supplier_cnpj} onChange={(e) => set("supplier_cnpj", e.target.value)} /></Field>
          <Field label="Razão social"><Input value={form.supplier_name} onChange={(e) => set("supplier_name", e.target.value)} /></Field>
          <Field label="Endereço"><Input value={form.supplier_address} onChange={(e) => set("supplier_address", e.target.value)} /></Field>
          <Field label="Representante legal"><Input value={form.supplier_representative} onChange={(e) => set("supplier_representative", e.target.value)} /></Field>
          <Field label="Objeto" className="sm:col-span-2"><Input value={form.object} onChange={(e) => set("object", e.target.value)} /></Field>
          <Field label="Especificação" className="sm:col-span-2"><Textarea rows={3} value={form.specification} onChange={(e) => set("specification", e.target.value)} /></Field>
          <Field label="Prazo (dias)"><Input type="number" min={0} value={form.deadline_days} onChange={(e) => set("deadline_days", e.target.value)} /></Field>
          <Field label="Valor total (R$)"><Input type="number" min={0} step="0.01" value={form.total_value} onChange={(e) => set("total_value", e.target.value)} /></Field>
          <Field label="Condição de pagamento" className="sm:col-span-2"><Textarea rows={2} value={form.payment_terms} onChange={(e) => set("payment_terms", e.target.value)} /></Field>
          <Field label="Categoria financeira" className="sm:col-span-2">
            <FinancialCategorySelect value={form.financial_category} onChange={(v) => set("financial_category", v)} />
          </Field>
          <Field label="Obrigações da contratante" className="sm:col-span-2"><Textarea rows={2} value={form.obligations_contractor} onChange={(e) => set("obligations_contractor", e.target.value)} /></Field>
          <Field label="Obrigações da contratada" className="sm:col-span-2"><Textarea rows={2} value={form.obligations_contracted} onChange={(e) => set("obligations_contracted", e.target.value)} /></Field>
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
          <p className={`text-sm ${Math.abs(rateioTotal - total) > 0.01 ? "text-destructive" : "text-muted-foreground"}`}>
            Rateio: {formatBRL(rateioTotal)} de {formatBRL(total)}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={update.isPending}>Salvar alterações</Button>
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
