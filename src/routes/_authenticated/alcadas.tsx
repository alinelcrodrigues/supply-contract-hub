import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConfiguracaoAlcada from "@/components/ConfiguracaoAlcada";
import { useCurrentUserRole } from "@/lib/params-hooks";

export const Route = createFileRoute("/_authenticated/alcadas")({
  head: () => ({
    meta: [
      { title: "Configuração de alçadas | BALI CONSTRUTORA" },
      { name: "description", content: "Defina faixas de valor e a sequência de aprovadores para solicitações de contrato e medições." },
      { property: "og:title", content: "Configuração de alçadas | BALI CONSTRUTORA" },
      { property: "og:description", content: "Faixas de aprovação por valor da BALI Construtora." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: role, isLoading } = useCurrentUserRole();

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (role !== "admin") {
    return <p className="text-sm text-muted-foreground">Somente administradores podem configurar as faixas de alçada.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuração de alçadas</h1>
        <p className="text-sm text-muted-foreground">Faixas de valor e ordem dos aprovadores.</p>
      </div>
      <Tabs defaultValue="contract">
        <TabsList>
          <TabsTrigger value="contract">Solicitação de contrato</TabsTrigger>
          <TabsTrigger value="measurement">Medição</TabsTrigger>
        </TabsList>
        <TabsContent value="contract" className="mt-6">
          <ConfiguracaoAlcada kind="contract" title="Nova faixa — solicitação de contrato" />
        </TabsContent>
        <TabsContent value="measurement" className="mt-6">
          <ConfiguracaoAlcada kind="measurement" title="Nova faixa — medição" />
        </TabsContent>
      </Tabs>
    </div>
  );
}