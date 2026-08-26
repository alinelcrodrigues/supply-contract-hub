import { createFileRoute } from "@tanstack/react-router";
import LancamentoMedicao from "@/components/LancamentoMedicao";

export const Route = createFileRoute("/_authenticated/medicoes/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    contractId: typeof search.contractId === "string" ? search.contractId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Lançar medição | BALI CONSTRUTORA" },
      { name: "description", content: "Lance a medição do contrato com valor único ou detalhada por centro de custo para aprovação por alçada." },
      { property: "og:title", content: "Lançar medição | BALI CONSTRUTORA" },
      { property: "og:description", content: "Lançamento de medição de contrato da BALI Construtora." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { contractId } = Route.useSearch();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Lançar medição</h1>
        <p className="text-sm text-muted-foreground">
          Após a aprovação de toda a alçada, um movimento financeiro é gerado aguardando documento de cobrança.
        </p>
      </div>
      <LancamentoMedicao contractId={contractId} />
    </div>
  );
}