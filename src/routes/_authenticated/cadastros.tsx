import { createFileRoute } from "@tanstack/react-router";
import { Building2, Package, Truck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CadastroFornecedores from "@/components/CadastroFornecedores";
import CadastroProdutosServicos from "@/components/CadastroProdutosServicos";
import CadastroCentroCusto from "@/components/CadastroCentroCusto";
import { useCanManageMasterData } from "@/lib/master-data-hooks";

export const Route = createFileRoute("/_authenticated/cadastros")({
  head: () => ({
    meta: [
      { title: "Cadastros mestres | BALI CONSTRUTORA" },
      {
        name: "description",
        content: "Fornecedores, produtos e serviços e centros de custo da BALI Construtora em um só lugar.",
      },
      { property: "og:title", content: "Cadastros mestres | BALI CONSTRUTORA" },
      { property: "og:description", content: "Base de fornecedores, produtos, serviços e centros de custo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: canManage } = useCanManageMasterData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cadastros mestres</h1>
        <p className="text-sm text-muted-foreground">
          Base da empresa: fornecedores, produtos e serviços e centros de custo.
          {!canManage && " Somente administradores e compradores podem editar."}
        </p>
      </div>

      <Tabs defaultValue="fornecedores" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="fornecedores" className="gap-2">
            <Truck className="h-4 w-4" />
            Fornecedores
          </TabsTrigger>
          <TabsTrigger value="produtos" className="gap-2">
            <Package className="h-4 w-4" />
            Produtos / Serviços
          </TabsTrigger>
          <TabsTrigger value="cc" className="gap-2">
            <Building2 className="h-4 w-4" />
            Centros de custo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fornecedores">
          <CadastroFornecedores />
        </TabsContent>
        <TabsContent value="produtos">
          <CadastroProdutosServicos />
        </TabsContent>
        <TabsContent value="cc">
          <CadastroCentroCusto />
        </TabsContent>
      </Tabs>
    </div>
  );
}
