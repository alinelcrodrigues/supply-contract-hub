import { createFileRoute } from "@tanstack/react-router";
import SolicitacaoContratoForm from "@/components/SolicitacaoContratoForm";

export const Route = createFileRoute("/_authenticated/solicitacoes/new")({
  head: () => ({
    meta: [
      { title: "Nova solicitação de contrato | BALI CONSTRUTORA" },
      { name: "description", content: "Cadastre a solicitação de contrato com fornecedor, rateio e documentos para aprovação por alçada." },
      { property: "og:title", content: "Nova solicitação de contrato | BALI CONSTRUTORA" },
      { property: "og:description", content: "Solicitação de contrato com aprovação por alçada na BALI Construtora." },
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
        <h1 className="text-2xl font-semibold">Nova solicitação de contrato</h1>
        <p className="text-sm text-muted-foreground">
          Ao ser aprovada por todos os aprovadores da faixa de alçada, o contrato é criado automaticamente.
        </p>
      </div>
      <SolicitacaoContratoForm />
    </div>
  );
}