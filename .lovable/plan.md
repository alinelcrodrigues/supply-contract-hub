## Escopo

Criar o componente `src/components/AditivosContratuais.tsx` como um bloco puramente visual/local, sem alterar o store de contratos nem o `globalValue`. Renderizá-lo na tela de detalhes do contrato (`src/routes/_authenticated/contracts.$id.tsx`).

## O que o componente faz

Props: `contractId: string`, `valorOriginal: number`.

Estado local (dentro do próprio componente, sem persistência):
- Lista de aditivos adicionados na sessão.
- Cada aditivo tem: `tipo` ("Ajuste de valor/prazo" | "Inclusão de item"), `descricao`, `valor` (número, pode ser negativo para reduções), `data`.

UI:
- Card "Aditivos contratuais" com formulário inline:
  - `Select` "Tipo de aditivo" (as duas opções acima).
  - `Input` descrição, `Input` valor (R$), `Input` data.
  - Botão "Adicionar aditivo".
- Lista dos aditivos adicionados, cada linha com `Badge` do tipo, descrição, valor formatado em BRL, data e botão `X` (lucide-react) para remover.
- Rodapé mostrando: Valor original, Soma dos aditivos, "Valor atual estimado" = `valorOriginal + soma dos aditivos` (apenas exibição, não grava nada).

Sem chamada a `updateContract` nem escrita em Lovable Cloud/localStorage — o estado vive só enquanto a tela estiver montada, conforme o "escopo menor" solicitado.

## Integração

- Em `src/routes/_authenticated/contracts.$id.tsx`, importar e renderizar `<AditivosContratuais contractId={contract.id} valorOriginal={contract.globalValue} />` como uma seção nova entre o card principal e o grid de medições.
- Nenhuma outra mudança na rota, no store ou nas medições.

## Detalhes técnicos

- Reutilizar `Select`, `Badge`, `Card`, `Input`, `Label`, `Button` de `@/components/ui/*` (todos já existem).
- Ícone `X` de `lucide-react` (já instalado).
- Formatação BRL via `formatBRL` de `@/lib/contracts-store`.
- IDs locais gerados via `crypto.randomUUID()`.
