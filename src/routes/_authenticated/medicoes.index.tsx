import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PainelAprovacaoMedicao from "@/components/PainelAprovacaoMedicao";
import FiltrosPesquisa, { emptyFilters, useSearchIds, type SearchFilters } from "@/components/FiltrosPesquisa";

export const Route = createFileRoute("/_authenticated/medicoes/")({
  head: () => ({
    meta: [
      { title: "Aprovação de medições | BALI CONSTRUTORA" },
      { name: "description", content: "Painel de aprovação sequencial das medições de contrato por faixa de alçada." },
      { property: "og:title", content: "Aprovação de medições | BALI CONSTRUTORA" },
      { property: "og:description", content: "Aprovação de medições de contrato da BALI Construtora." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);
  const { ids } = useSearchIds("measurements", filters);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Medições em aprovação</h1>
          <p className="text-sm text-muted-foreground">Alçada própria, separada da solicitação de contrato.</p>
        </div>
        <Button asChild>
          <Link to="/medicoes/new" search={{ contractId: undefined }}><FilePlus2 className="mr-2 h-4 w-4" /> Lançar medição</Link>
        </Button>
      </div>
      <FiltrosPesquisa value={filters} onChange={setFilters} showCompetenceMonth />
      <PainelAprovacaoMedicao idFilter={ids} />
    </div>
  );
}