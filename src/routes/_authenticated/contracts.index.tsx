import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FiltrosPesquisa, { emptyFilters, useSearchIds, type SearchFilters } from "@/components/FiltrosPesquisa";
import { TabelaCompacta, StatusBadge, type ColunaCompacta } from "@/components/ListaCompacta";
import { contractBalance, daysUntil, formatBRL, useContractsStable } from "@/lib/contracts-store";

export const Route = createFileRoute("/_authenticated/contracts/")({
  head: () => ({
    meta: [
      { title: "Contratos — Gestão de Suprimentos" },
      { name: "description", content: "Lista de contratos de suprimentos da construtora." },
    ],
  }),
  component: ContractsList,
});

type Row = ReturnType<typeof useContractsStable>[number];

function ContractsList() {
  const contracts = useContractsStable();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);
  const { ids } = useSearchIds("contracts", filters);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byIds = ids ? contracts.filter((c) => ids.includes(c.id)) : contracts;
    const filtered = q
      ? byIds.filter((c) =>
          [c.number, c.supplier, c.object, c.costCenter, c.financialCategory]
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
      : byIds;
    return [...filtered].sort((a, b) => b.globalValue - a.globalValue);
  }, [contracts, query, ids]);

  const columns: ColunaCompacta<Row>[] = [
    {
      key: "object",
      header: "Contrato",
      cell: (c) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{c.number}</div>
          <div className="truncate text-xs text-muted-foreground">{c.object}</div>
        </div>
      ),
    },
    { key: "supplier", header: "Fornecedor", hideBelow: "md", cell: (c) => <span className="truncate">{c.supplier}</span> },
    {
      key: "cc",
      header: "Centro de custo",
      hideBelow: "lg",
      cell: (c) => <span className="truncate text-muted-foreground">{c.costCenter || "—"}</span>,
    },
    {
      key: "global",
      header: "Valor global",
      className: "text-right tabular-nums",
      hideBelow: "sm",
      cell: (c) => formatBRL(c.globalValue),
    },
    {
      key: "balance",
      header: "Saldo",
      className: "text-right font-semibold tabular-nums text-primary",
      cell: (c) => formatBRL(contractBalance(c).balance),
    },
    {
      key: "status",
      header: "Status",
      className: "text-right",
      cell: (c) => {
        const days = daysUntil(c.endDate);
        if (c.status === "cancelado") return <StatusBadge status="cancelado" />;
        if (days < 0) return <StatusBadge status="vencido" label={`Vencido há ${-days}d`} />;
        if (days <= 60) return <StatusBadge tone="warning" label={`Vence em ${days}d`} />;
        return <StatusBadge status={c.signed ? "assinado" : "pendente"} />;
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Contratos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{contracts.length} contratos cadastrados</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar contrato, fornecedor…"
              className="h-10 w-[280px] pl-9"
            />
          </div>
          <Button asChild variant="secondary" className="font-semibold">
            <Link to="/contracts/new">+ Novo contrato</Link>
          </Button>
        </div>
      </div>

      <FiltrosPesquisa value={filters} onChange={setFilters} />

      {rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            {contracts.length === 0 ? "Nenhum contrato cadastrado ainda." : "Nenhum contrato encontrado."}
          </CardContent>
        </Card>
      ) : (
        <TabelaCompacta
          columns={columns}
          rows={rows}
          rowClassName={(c) => (c.status === "cancelado" ? "opacity-60" : undefined)}
          onRowClick={(c) => navigate({ to: "/contracts/$id", params: { id: c.id } })}
        />
      )}
    </div>
  );
}
