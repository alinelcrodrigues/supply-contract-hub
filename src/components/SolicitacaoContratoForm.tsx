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
import { FINANCIAL_CATEGORIES, formatBRL } from "@/lib/contracts-store";
import { useContractRequestMutations } from "@/lib/approvals-hooks";

type RateioLine = { key: string; costCenterId: string; value: string };

const newLine = (): RateioLine => ({ key: crypto.randomUUID(), costCenterId: "", value: "" });

export default function SolicitacaoContratoForm({ onDone }: { onDone?: () => void }) {
  const { data: costCenters } = useActiveCostCenters();
  const { create } = useContractRequestMutations();

  const [form, setForm] = useState({
    supplier_cnpj: "",
    supplier_name: "",
    supplier_address: "",
    supplier_representative: "",
    object: "",
    specification: "",
    deadline_days: "30",
    payment_terms: "",
    obligations_contractor: "",
    obligations_contracted: "",
    financial_category: "",
    total_value: "",
  });
  const [rateio, setRateio] = useState<RateioLine[]>([newLine()]);
  const [files, setFiles] = useState<File[]>([]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const total = Number(form.total_value || 0);
  const rateioTotal = rateio.reduce((s, l) => s + Number(l.value || 0), 0);

  const submit = async (send: boolean) => {
    if (!form.supplier_name.trim() || !form.object.trim()) {
      toast.error("Informe ao menos a razão social e o objeto.");
      return;
    }
    if (total <= 0) {
      toast.error("Informe o valor total da contratação.");
      return;
    }
    const lines = rateio.filter((l) => l.costCenterId && Number(l.value) > 0);
    if (send && Math.abs(rateioTotal - total) > 0.01) {
      toast.error("O rateio por centro de custo precisa somar o valor total.");
      return;
    }
    try {
      await create.mutateAsync({
        fields: {
          ...form,
          deadline_days: Number(form.deadline_days || 0),
          total_value: total,
        },
        rateio: lines.map((l) => ({ cost_center_id: l.costCenterId, value: Number(l.value) })),
        files,
        submit: send,
      });
      toast.success(send ? "Solicitação enviada para aprovação." : "Rascunho salvo.");
      onDone?.();
      setForm({
        supplier_cnpj: "", supplier_name: "", supplier_address: "", supplier_representative: "",
        object: "", specification: "", deadline_days: "30", payment_terms: "",
        obligations_contractor: "", obligations_contracted: "", financial_category: "", total_value: "",
      });
      setRateio([newLine()]);
      setFiles([]);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Fornecedor</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="CNPJ"><Input value={form.supplier_cnpj} onChange={(e) => set("supplier_cnpj", e.target.value)} placeholder="00.000.000/0001-00" /></Field>
          <Field label="Razão social"><Input value={form.supplier_name} onChange={(e) => set("supplier_name", e.target.value)} /></Field>
          <Field label="Endereço"><Input value={form.supplier_address} onChange={(e) => set("supplier_address", e.target.value)} /></Field>
          <Field label="Representante legal"><Input value={form.supplier_representative} onChange={(e) => set("supplier_representative", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Contratação</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Objeto" className="sm:col-span-2"><Input value={form.object} onChange={(e) => set("object", e.target.value)} /></Field>
          <Field label="Especificação" className="sm:col-span-2"><Textarea rows={3} value={form.specification} onChange={(e) => set("specification", e.target.value)} /></Field>
          <Field label="Prazo (dias)"><Input type="number" min={0} value={form.deadline_days} onChange={(e) => set("deadline_days", e.target.value)} /></Field>
          <Field label="Valor total (R$)"><Input type="number" min={0} step="0.01" value={form.total_value} onChange={(e) => set("total_value", e.target.value)} /></Field>
          <Field label="Condição de pagamento" className="sm:col-span-2"><Textarea rows={2} value={form.payment_terms} onChange={(e) => set("payment_terms", e.target.value)} /></Field>
          <Field label="Categoria financeira">
            <Select value={form.financial_category} onValueChange={(v) => set("financial_category", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {FINANCIAL_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Obrigações da contratante" className="sm:col-span-2"><Textarea rows={2} value={form.obligations_contractor} onChange={(e) => set("obligations_contractor", e.target.value)} /></Field>
          <Field label="Obrigações da contratada" className="sm:col-span-2"><Textarea rows={2} value={form.obligations_contracted} onChange={(e) => set("obligations_contracted", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rateio por centro de custo</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => setRateio((r) => [...r, newLine()])}>
            <Plus className="mr-1 h-4 w-4" /> Linha
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {rateio.map((line, i) => (
            <div key={line.key} className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
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
              <div className="w-40">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Documentos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
          {files.length > 0 && <p className="text-sm text-muted-foreground">{files.length} arquivo(s) selecionado(s)</p>}
        </CardContent>
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

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}