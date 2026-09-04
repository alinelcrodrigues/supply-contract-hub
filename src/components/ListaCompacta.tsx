import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/* =========================================================
   Padrão visual de status — usado por todas as listagens
   ========================================================= */

type Tone = "success" | "warning" | "danger" | "muted" | "info";

const TONE_CLASS: Record<Tone, string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/20 text-warning-foreground border-warning/40",
  danger: "bg-destructive/12 text-destructive border-destructive/30",
  muted: "bg-muted text-muted-foreground border-border",
  info: "bg-primary/10 text-primary border-primary/25",
};

const STATUS_MAP: Record<string, { label: string; tone: Tone }> = {
  // solicitações / medições
  rascunho: { label: "Rascunho", tone: "muted" },
  em_aprovacao: { label: "Em aprovação", tone: "warning" },
  aprovada: { label: "Aprovada", tone: "success" },
  reprovada: { label: "Reprovada", tone: "danger" },
  cancelado: { label: "Cancelado", tone: "muted" },
  cancelada: { label: "Cancelada", tone: "muted" },
  // contratos
  ativo: { label: "Ativo", tone: "success" },
  assinado: { label: "Assinado", tone: "success" },
  pendente: { label: "Pendente", tone: "warning" },
  vencido: { label: "Vencido", tone: "danger" },
  // financeiro
  aguardando_documento: { label: "Aguardando documento", tone: "warning" },
  aguardando_pagamento: { label: "Aguardando pagamento", tone: "info" },
  pago: { label: "Pago", tone: "success" },
};

export function StatusBadge({
  status,
  label,
  tone,
  className,
}: {
  status?: string;
  label?: string;
  tone?: Tone;
  className?: string;
}) {
  const cfg = (status && STATUS_MAP[status]) || undefined;
  const t = tone ?? cfg?.tone ?? "muted";
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4",
        TONE_CLASS[t],
        className,
      )}
    >
      {label ?? cfg?.label ?? status ?? "—"}
    </span>
  );
}

/* =========================================================
   Tabela compacta genérica
   ========================================================= */

export type ColunaCompacta<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** classes aplicadas à célula e ao cabeçalho (largura, alinhamento…) */
  className?: string;
  /** oculta a coluna em telas pequenas */
  hideBelow?: "sm" | "md" | "lg";
};

const HIDE: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

export function TabelaCompacta<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  renderExpanded,
  expandedId,
  rowClassName,
  empty = "Nenhum registro encontrado.",
  className,
}: {
  columns: ColunaCompacta<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  renderExpanded?: (row: T) => ReactNode;
  expandedId?: string | null;
  rowClassName?: (row: T) => string | undefined;
  empty?: ReactNode;
  className?: string;
}) {
  if (rows.length === 0) {
    return <p className="px-1 py-6 text-sm text-muted-foreground">{empty}</p>;
  }

  const clickable = Boolean(onRowClick);

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur-sm", className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((c) => (
              <TableHead
                key={c.key}
                className={cn(
                  "h-9 whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                  c.hideBelow && HIDE[c.hideBelow],
                  c.className,
                )}
              >
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const open = expandedId === row.id;
            return (
              <Fragment key={row.id}>
                <TableRow
                  onClick={clickable ? () => onRowClick?.(row) : undefined}
                  data-state={open ? "selected" : undefined}
                  className={cn(clickable && "cursor-pointer", rowClassName?.(row))}
                >
                  {columns.map((c) => (
                    <TableCell
                      key={c.key}
                      className={cn("py-2.5 table-text", c.hideBelow && HIDE[c.hideBelow], c.className)}
                    >
                      {c.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
                {open && renderExpanded && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={columns.length} className="bg-muted/30 p-4">
                      {renderExpanded(row)}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default TabelaCompacta;
