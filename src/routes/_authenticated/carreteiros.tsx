import { createFileRoute } from "@tanstack/react-router";
import { FileText, Fuel, Package, Truck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CadastroPlacas from "@/components/CadastroPlacas";
import CadastroContratoCarreteiro from "@/components/CadastroContratoCarreteiro";
import LancamentoCarga from "@/components/LancamentoCarga";
import AbastecimentoEFechamentoCarreteiro from "@/components/AbastecimentoEFechamentoCarreteiro";

export const Route = createFileRoute("/_authenticated/carreteiros")({
  head: () => ({
    meta: [
      { title: "Contratos de carreteiro | BALI CONSTRUTORA" },
      {
        name: "description",
        content: "Placas, contratos por km e tonelada, cargas, combustível e fechamento mensal dos carreteiros.",
      },
      { property: "og:title", content: "Contratos de carreteiro | BALI CONSTRUTORA" },
      { property: "og:description", content: "Gestão de carreteiros por placa, carga e fechamento mensal." },
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
        <h1 className="text-2xl font-semibold">Contratos de carreteiro</h1>
        <p className="text-sm text-muted-foreground">
          Contrato por grupo de placas, sem valor fechado: preço por km e/ou tonelada, cargas calculadas automaticamente e
          fechamento mensal que entra no fluxo de medição.
        </p>
      </div>

      <Tabs defaultValue="placas" className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-4">
          <TabsTrigger value="placas" className="gap-2">
            <Truck className="h-4 w-4" /> Placas
          </TabsTrigger>
          <TabsTrigger value="contratos" className="gap-2">
            <FileText className="h-4 w-4" /> Contratos
          </TabsTrigger>
          <TabsTrigger value="cargas" className="gap-2">
            <Package className="h-4 w-4" /> Cargas
          </TabsTrigger>
          <TabsTrigger value="fechamento" className="gap-2">
            <Fuel className="h-4 w-4" /> Combustível e fechamento
          </TabsTrigger>
        </TabsList>
        <TabsContent value="placas">
          <CadastroPlacas />
        </TabsContent>
        <TabsContent value="contratos">
          <CadastroContratoCarreteiro />
        </TabsContent>
        <TabsContent value="cargas">
          <LancamentoCarga />
        </TabsContent>
        <TabsContent value="fechamento">
          <AbastecimentoEFechamentoCarreteiro />
        </TabsContent>
      </Tabs>
    </div>
  );
}
