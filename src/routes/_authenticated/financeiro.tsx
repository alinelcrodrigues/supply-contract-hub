import { createFileRoute } from "@tanstack/react-router";
import FluxoFinanceiroMedicao from "@/components/FluxoFinanceiroMedicao";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Fluxo financeiro das medições | BALI CONSTRUTORA" },
      { name: "description", content: "Anexe nota fiscal, fatura ou boleto e registre o pagamento das medições aprovadas." },
      { property: "og:title", content: "Fluxo financeiro das medições | BALI CONSTRUTORA" },
      { property: "og:description", content: "Documentos de cobrança e baixa de pagamentos da BALI Construtora." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fluxo financeiro das medições</h1>
        <p className="text-sm text-muted-foreground">
          Aguardando documento → aguardando pagamento → pago. Não substitui o histórico de medições do contrato.
        </p>
      </div>
      <FluxoFinanceiroMedicao />
    </div>
  );
}