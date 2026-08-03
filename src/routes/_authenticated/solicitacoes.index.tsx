import { createFileRoute, Link } from "@tanstack/react-router";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PainelAprovacaoContrato from "@/components/PainelAprovacaoContrato";

export const Route = createFileRoute("/_authenticated/solicitacoes/")({
  head: () => ({
    meta: [
      { title: "Solicitações de contrato | BALI CONSTRUTORA" },
      { name: "description", content: "Acompanhe e aprove as solicitações de contrato pendentes na sua alçada." },
      { property: "og:title", content: "Solicitações de contrato | BALI CONSTRUTORA" },
      { property: "og:description", content: "Painel de aprovação de solicitações de contrato da BALI Construtora." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Solicitações de contrato</h1>
          <p className="text-sm text-muted-foreground">Aprovação sequencial por faixa de alçada.</p>
        </div>
        <Button asChild>
          <Link to="/solicitacoes/new"><FilePlus2 className="mr-2 h-4 w-4" /> Nova solicitação</Link>
        </Button>
      </div>
      <PainelAprovacaoContrato />
    </div>
  );
}