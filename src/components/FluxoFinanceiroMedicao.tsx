import { useState } from "react";
import { Paperclip, Upload, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBRL, formatDate } from "@/lib/contracts-store";
import { TabelaCompacta, StatusBadge, type ColunaCompacta } from "@/components/ListaCompacta";
import { useFinancialMovements, useMovementMutations, downloadFile, type FinancialMovement } from "@/lib/approvals-hooks";

const DOC_TYPES = [
  { id: "nota_fiscal", label: "Nota fiscal" },
  { id: "fatura", label: "Fatura" },
  { id: "boleto", label: "Boleto" },
];

type Draft = { type: string; number: string; due: string; file: File | null };

export default function FluxoFinanceiroMedicao() {
  const { data: movements, isLoading } = useFinancialMovements();
  const { attachDocument, markPaid } = useMovementMutations();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const draft = (id: string): Draft => drafts[id] ?? { type: "nota_fiscal", number: "", due: "", file: null };
  const setDraft = (id: string, patch: Partial<Draft>) =>
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
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum movimento financeiro. Eles são gerados quando uma medição é aprovada por toda a alçada.
      </p>
    );
  }

  const columns: ColunaCompacta<FinancialMovement>[] = [
    { key: "code", header: "Código", cell: (mv) => <span className="font-medium text-foreground">#{mv.id.slice(0, 8)}</span> },
    {
      key: "contract",
      header: "Contrato / fornecedor",
      cell: (mv) => (
        <div className="min-w-0">
          <div className="truncate">{mv.contracts?.number ?? "—"}</div>
          <div className="truncate text-xs text-muted-foreground">{mv.contracts?.supplier ?? ""}</div>
        </div>
      ),
    },
    { key: "amount", header: "Valor", className: "text-right tabular-nums", cell: (mv) => formatBRL(Number(mv.amount)) },
    {
      key: "due",
      header: "Vencimento",
      hideBelow: "md",
      cell: (mv) => <span className="text-muted-foreground">{mv.due_date ? formatDate(mv.due_date) : "—"}</span>,
    },
    { key: "status", header: "Status", className: "text-right", cell: (mv) => <StatusBadge status={mv.status} /> },
  ];

  const renderDetalhe = (mv: FinancialMovement) => {
    const d = draft(mv.id);
    return (
      <div className="space-y-4 text-sm">
        {mv.paid_at && <p className="text-muted-foreground">Pago em {formatDate(mv.paid_at.slice(0, 10))}</p>}

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
      </div>
    );
  };

  return (
    <TabelaCompacta
      columns={columns}
      rows={movements}
      expandedId={expanded}
      onRowClick={(mv) => setExpanded(expanded === mv.id ? null : mv.id)}
      renderExpanded={renderDetalhe}
    />
  );
}
