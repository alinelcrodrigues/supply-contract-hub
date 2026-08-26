import { createFileRoute } from "@tanstack/react-router";
import HistoricoAlteracoes from "@/components/HistoricoAlteracoes";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de alterações | BALI CONSTRUTORA" },
      {
        name: "description",
        content: "Registro central de todas as alterações do sistema: quem alterou, quando e o que mudou.",
      },
      { property: "og:title", content: "Histórico de alterações | BALI CONSTRUTORA" },
      { property: "og:description", content: "Auditoria completa das alterações de contratos, medições e cadastros." },
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
        <h1 className="text-2xl font-semibold">Histórico de alterações</h1>
        <p className="text-sm text-muted-foreground">
          Toda criação, alteração e exclusão nas tabelas de negócio fica registrada aqui.
        </p>
      </div>
      <HistoricoAlteracoes />
    </div>
  );
}
