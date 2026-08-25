import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addAddendum,
  deleteAddendum,
  formatBRL,
  formatDate,
  type Addendum,
  type AddendumType,
} from "@/lib/contracts-store";
import { useActiveCostCenters } from "@/lib/params-hooks";
import { FinancialCategorySelect } from "@/components/FinancialCategorySelect";

interface Props {
  contractId: string;
  valorOriginal: number;
  aditivos: Addendum[];
}

const TIPO_LABEL: Record<AddendumType, string> = {
  ajuste_valor: "Ajuste de valor/prazo",
  inclusao_item: "Inclusão de item",
};

export function AditivosContratuais({ contractId, valorOriginal, aditivos }: Props) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const { data: costCenters = [] } = useActiveCostCenters();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tipo: "ajuste_valor" as AddendumType,
    descricao: "",
    valor: "",
    data: todayIso,
    costCenterId: "",
    financialCategory: "",
  });

  const somaAditivos = aditivos.reduce(
    (acc, a) => acc + (a.tipo === "ajuste_valor" ? a.value : a.items.reduce((s, i) => s + i.value, 0)),
    0,
  );
  const valorAtual = valorOriginal + somaAditivos;

  const adicionar = (e: React.FormEvent) => {
    e.preventDefault();
    const valor = Number(form.valor);
    if (!form.descricao.trim()) {
      toast.error("Informe a descrição do aditivo.");
      return;
    }
    if (!valor) {
      toast.error("Informe o valor do aditivo.");
      return;
    }
    if (form.tipo === "inclusao_item" && !form.costCenterId) {
      toast.error("Selecione o centro de custo do item incluído.");
      return;
    }
    setSaving(true);
    void addAddendum({
      contractId,
      tipo: form.tipo,
      description: form.descricao.trim(),
      value: valor,
      date: form.data,
      item:
        form.tipo === "inclusao_item"
          ? {
              description: form.descricao.trim(),
              value: valor,
              costCenterId: form.costCenterId,
              financialCategory: form.financialCategory,
            }
          : undefined,
    })
      .then(() => {
        toast.success("Aditivo registrado.");
        setForm({ ...form, descricao: "", valor: "" });
      })
      .catch((err) => toast.error(err?.message ?? "Não foi possível salvar o aditivo."))
      .finally(() => setSaving(false));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Aditivos contratuais</CardTitle>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Valor vigente</div>
          <div className="text-sm font-semibold text-primary">{formatBRL(valorAtual)}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={adicionar} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tipo de aditivo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as AddendumType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ajuste_valor">Ajuste de valor/prazo</SelectItem>
                  <SelectItem value="inclusao_item">Inclusão de item</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Data</Label>
              <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição</Label>
            <Input
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Ex.: Aditivo 01 — reajuste INCC"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                placeholder="0,00"
              />
            </div>
            {form.tipo === "inclusao_item" && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Centro de custo</Label>
                  <Select value={form.costCenterId} onValueChange={(v) => setForm({ ...form, costCenterId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {costCenters.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Categoria financeira</Label>
                  <Select value={form.financialCategory} onValueChange={(v) => setForm({ ...form, financialCategory: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FINANCIAL_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Aditivos de ajuste de valor são rateados proporcionalmente entre os centros de custo do contrato.
            Itens incluídos por aditivo somam no centro de custo escolhido.
          </p>

          <div className="flex justify-end">
            <Button type="submit" variant="secondary" className="font-semibold" disabled={saving}>
              {saving ? "Salvando..." : "Adicionar aditivo"}
            </Button>
          </div>
        </form>

        {aditivos.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Nenhum aditivo registrado.
          </div>
        ) : (
          <div className="space-y-2">
            {aditivos.map((a) => {
              const total = a.tipo === "ajuste_valor" ? a.value : a.items.reduce((s, i) => s + i.value, 0);
              return (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{TIPO_LABEL[a.tipo]}</Badge>
                      <span className="text-sm font-medium">{a.description}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(a.date)}
                      {a.items.map((i) => ` · ${i.costCenter}`).join("")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums text-primary">{formatBRL(total)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Remover este aditivo?")) {
                          void deleteAddendum(a.id).catch(() => toast.error("Não foi possível remover."));
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remover aditivo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
