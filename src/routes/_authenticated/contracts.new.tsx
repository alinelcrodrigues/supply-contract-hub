import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addContract, type Contract } from "@/lib/contracts-store";
import { useActiveCostCenters } from "@/lib/params-hooks";
import { FinancialCategorySelect } from "@/components/FinancialCategorySelect";
import { uploadContractDocuments } from "@/components/ContratoDocumentos";

export const Route = createFileRoute("/_authenticated/contracts/new")({
  head: () => ({
    meta: [
      { title: "Novo contrato — Gestão de Suprimentos" },
      { name: "description", content: "Cadastre um novo contrato de suprimentos." },
    ],
  }),
  component: NewContract,
});

const indices: Contract["adjustmentIndex"][] = ["IPCA", "IGP-M", "INCC", "SINAPI", "Nenhum"];
const months = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function NewContract() {
  const navigate = useNavigate();
  const { data: activeCC = [] } = useActiveCostCenters();
  const costCenterOptions = activeCC;
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    number: "",
    supplier: "",
    object: "",
    globalValue: "",
    budgetValue: "",
    budgetNotApplicable: false,
    startDate: "",
    endDate: "",
    adjustmentIndex: "IPCA" as Contract["adjustmentIndex"],
    adjustmentMonth: 1,
    signed: false,
    costCenterId: "",
    financialCategory: "",
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(form.globalValue);
    if (!form.number || !form.supplier || !form.startDate || !form.endDate || !value || !form.costCenterId || !form.financialCategory) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error("Data de término anterior ao início.");
      return;
    }
    const budgetValue = form.budgetNotApplicable ? null : Number(form.budgetValue) || null;
    void (async () => {
    const created = await addContract({
      number: form.number,
      supplier: form.supplier,
      object: form.object,
      globalValue: value,
      budgetValue,
      startDate: form.startDate,
      endDate: form.endDate,
      adjustmentIndex: form.adjustmentIndex,
      adjustmentMonth: form.adjustmentMonth,
      signed: form.signed,
      costCenterId: form.costCenterId,
      financialCategory: form.financialCategory,
    }).catch((err) => {
      toast.error(err?.message ?? "Não foi possível cadastrar o contrato.");
      return null;
    });
    if (!created) return;
    if (files.length) {
      try {
        await uploadContractDocuments(created.id, files);
      } catch (err) {
        toast.error((err as Error).message ?? "Contrato criado, mas o anexo falhou.");
      }
    }
    toast.success("Contrato cadastrado.");
    navigate({ to: "/contracts/$id", params: { id: created.id } });
    })();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo contrato</h1>
        <p className="text-sm text-muted-foreground">Cadastre os dados gerais do contrato de suprimentos.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Número do contrato *">
                <Input value={form.number} onChange={(e) => update("number", e.target.value)} placeholder="CT-2025-001" />
              </Field>
              <Field label="Fornecedor *">
                <Input value={form.supplier} onChange={(e) => update("supplier", e.target.value)} placeholder="Ex.: Cimentos União Ltda." />
              </Field>
            </div>

            <Field label="Objeto do contrato">
              <Textarea value={form.object} onChange={(e) => update("object", e.target.value)} rows={3} placeholder="Descrição do escopo de fornecimento" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Centro de custo *">
                <Select value={form.costCenterId} onValueChange={(v) => update("costCenterId", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {costCenterOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Categoria financeira *">
                <FinancialCategorySelect value={form.financialCategory} onChange={(v) => update("financialCategory", v)} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Valor global (R$) *">
                <Input type="number" min="0" step="0.01" value={form.globalValue} onChange={(e) => update("globalValue", e.target.value)} placeholder="0,00" />
              </Field>
              <Field label="Valor de orçamento (R$)">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.budgetValue}
                  onChange={(e) => update("budgetValue", e.target.value)}
                  placeholder="0,00"
                  disabled={form.budgetNotApplicable}
                  className={form.budgetNotApplicable ? "bg-muted text-muted-foreground" : ""}
                />
              </Field>
              <Field label="Início da vigência *">
                <Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
              </Field>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-4">
              <div>
                <div className="text-sm font-medium">Não se aplica ao orçamento</div>
                <div className="text-xs text-muted-foreground">Marque quando o objeto não estiver previsto no orçamento da obra.</div>
              </div>
              <Switch checked={form.budgetNotApplicable} onCheckedChange={(v) => update("budgetNotApplicable", v)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Fim da vigência *">
                <Input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Índice de reajuste">
                <Select value={form.adjustmentIndex} onValueChange={(v) => update("adjustmentIndex", v as Contract["adjustmentIndex"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {indices.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Mês do reajuste">
                <Select value={String(form.adjustmentMonth)} onValueChange={(v) => update("adjustmentMonth", Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {months.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-4">
              <div>
                <div className="text-sm font-medium">Contrato assinado</div>
                <div className="text-xs text-muted-foreground">Marque quando todas as partes tiverem assinado.</div>
              </div>
              <Switch checked={form.signed} onCheckedChange={(v) => update("signed", v)} />
            </div>

            <Field label="Anexar contrato (PDF)">
              <Input
                type="file"
                accept="application/pdf"
                multiple
                onChange={(e) => {
                  const list = Array.from(e.target.files ?? []).filter(
                    (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
                  );
                  if (e.target.files?.length && list.length !== e.target.files.length) {
                    toast.error("Somente arquivos PDF são aceitos.");
                  }
                  setFiles(list);
                }}
              />
              {files.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {files.length} arquivo(s): {files.map((f) => f.name).join(", ")}
                </p>
              )}
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => history.back()}>Cancelar</Button>
              <Button type="submit" variant="secondary" className="font-semibold">Cadastrar contrato</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}