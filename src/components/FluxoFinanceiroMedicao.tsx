import { useState } from "react";
import { Paperclip, Upload, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBRL, formatDate } from "@/lib/contracts-store";
import { useFinancialMovements, useMovementMutations, downloadFile, type FinancialMovement } from "@/lib/approvals-hooks";

const STATUS: Record<string, { label: string; variant: "outline" | "secondary" | "default" }> = {
  aguardando_documento: { label: "Aguardando documento", variant: "outline" },
  aguardando_pagamento: { label: "Aguardando pagamento", variant: "secondary" },
  pago: { label: "Pago", variant: "default" },
};

const DOC_TYPES = [
  { id: "nota_fiscal", label: "Nota fiscal" },
  { id: "fatura", label: "Fatura" },
  { id: "boleto", label: "Boleto" },
];

export default function FluxoFinanceiroMedicao() {
  const { data: movements, isLoading } = useFinancialMovements();
  const { attachDocument, markPaid } = useMovementMutations();
  const [drafts, setDrafts] = useState<Record<string, { type: string; number: string; due: string; file: File | null }>>({});

  const draft = (id: string) => drafts[id] ?? { type: "nota_fiscal", number: "", due: "", file: null };
  const setDraft = (id: string, patch: Partial<{ type: string; number: string; due: string; file: File | null }>) =>
    setDrafts((d) => ({ ...d, [id]: { ...draft(id), ...patch } }));

  const attach = async (mv: FinancialMovement) => {
    const d = draft(mv.id);
    if (!d.file) return toast.error("Selecione o arquivo do documento.");
    try {
      await attachDocument.mutateAsync({
        movementId: mv.id, docType: d.type, docNumber: d.number, file: d.file, dueDate: d.due || undefined,
      });
      toast.success("Documento anexado. Movimento liberado para pagamento.");
      setDrafts((s) => ({ ...s, [mv.id]: { type: "nota_fiscal", number: "", due: "", file: null } }));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando movimentos…</p>;
  if (!movements?.length) {
    return <p className="text-sm text-muted-foreground">Nenhum movimento financeiro. Eles são gerados quando uma medição é aprovada por toda a alçada.</p>;
  }

  return (
    <div className="space-y-4">
      {movements.map((mv) => {
        const st = STATUS[mv.status] ?? { label: mv.status, variant: "outline" as const };
        const d = draft(mv.id);
        return (
          <Card key={mv.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">
                  {mv.contracts?.number ?? "Contrato"} — {formatBRL(Number(mv.amount))}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {mv.contracts?.supplier}
                  {mv.due_date ? ` · vence em ${formatDate(mv.due_date)}` : ""}
                  {mv.paid_at ? ` · pago em ${formatDate(mv.paid_at.slice(0, 10))}` : ""}
                </p>
              </div>
              <Badge variant={st.variant}>{st.label}</Badge>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {mv.billing_documents.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {mv.billing_documents.map((doc) => (
                    <Button key={doc.id} size="sm" variant="outline"
                      onClick={() => downloadFile("billing-documents", doc.file_path).catch((e) => toast.error(e.message))}>
                      <Paperclip className="mr-1 h-3 w-3" />
                      {DOC_TYPES.find((t) => t.id === doc.doc_type)?.label ?? doc.doc_type}
                      {doc.doc_number ? ` ${doc.doc_number}` : ""}
                    </Button>
                  ))}
                </div>
              )}

              {mv.status !== "pago" && (
                <div className="flex flex-wrap items-end gap-3">
                  <div className="w-44">
                    <Label className="text-xs text-muted-foreground">Tipo de documento</Label>
                    <Select value={d.type} onValueChange={(v) => setDraft(mv.id, { type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DOC_TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-40">
                    <Label className="text-xs text-muted-foreground">Número</Label>
                    <Input value={d.number} onChange={(e) => setDraft(mv.id, { number: e.target.value })} />
                  </div>
                  <div className="w-44">
                    <Label className="text-xs text-muted-foreground">Vencimento</Label>
                    <Input type="date" value={d.due} onChange={(e) => setDraft(mv.id, { due: e.target.value })} />
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <Label className="text-xs text-muted-foreground">Arquivo</Label>
                    <Input type="file" onChange={(e) => setDraft(mv.id, { file: e.target.files?.[0] ?? null })} />
                  </div>
                  <Button variant="outline" disabled={attachDocument.isPending} onClick={() => attach(mv)}>
                    <Upload className="mr-1 h-4 w-4" /> Anexar
                  </Button>
                </div>
              )}

              {mv.status === "aguardando_pagamento" && (
                <Button
                  disabled={markPaid.isPending}
                  onClick={() =>
                    markPaid.mutateAsync(mv.id)
                      .then(() => toast.success("Pagamento registrado."))
                      .catch((e) => toast.error(e.message))
                  }
                >
                  <BadgeCheck className="mr-1 h-4 w-4" /> Marcar como pago
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}