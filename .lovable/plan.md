## Objetivo

Ativar o **Lovable Cloud** no projeto BALI CONSTRUTORA para ter banco de dados real, autenticação e permissões de verdade — substituindo o armazenamento atual em `localStorage` da aba **Parametrização**.

## O que será feito

### 1. Ativar Lovable Cloud
- Provisiona banco de dados, autenticação e storage integrados (sem necessidade de contas externas).

### 2. Autenticação real de usuários
- Tela de login (`/auth`) com **e-mail + senha** e **Login com Google**.
- Layout protegido: todas as rotas do sistema (contratos, medições, parametrização) passam a exigir login.
- Botão de **Sair** no cabeçalho.
- Primeiro usuário que se cadastrar vira **Administrador** automaticamente.

### 3. Migração das tabelas para o banco
Criar no banco (com RLS — Row Level Security):
- `profiles` — nome e e-mail de cada usuário logado.
- `user_roles` — papel de cada usuário (`admin`, `gestor`, `financeiro`, `leitura`), em tabela separada por segurança.
- `cost_centers` — centros de custo (código, nome, ativo).
- `role_permissions` — matriz de permissões editável (papel × permissão).

Os contratos e medições **continuam em `localStorage` por enquanto** — a migração deles para o banco fica para uma próxima etapa, para não misturar dois trabalhos grandes.

### 4. Atualizar a aba Parametrização
- **Usuários:** lista real do banco. Admin pode convidar novo usuário (cria conta + define papel) e alterar papel/ativação.
- **Permissões:** matriz continua editável, mas persistida no banco e compartilhada entre todos os usuários.
- **Centros de custo:** CRUD passa a gravar no banco; a tela de cadastro de contrato lê a mesma tabela.

### 5. Aplicar permissões na interface
- Apenas quem tem `params.manage` vê a aba **Parametrização**.
- Apenas quem tem `contracts.manage` vê botões de novo contrato / editar.
- Perfil "Somente leitura" vê tudo, mas sem botões de ação.

## O que NÃO muda nesta etapa
- Visual e organização por centro de custo permanecem como estão.
- Contratos e medições continuam salvos localmente (migração futura).
- Nenhum dado atual do `localStorage` é perdido — ele apenas deixa de ser usado para usuários/permissões/centros de custo.

## Detalhes técnicos (para referência)
- Server functions (`createServerFn`) com `requireSupabaseAuth` para todas as operações de parametrização.
- Função `has_role(user_id, role)` `SECURITY DEFINER` para checagens de RLS sem recursão.
- Rota `_authenticated/` gerenciada pela integração protege o app; `/auth` fica pública.
- Google OAuth configurado via `supabase--configure_social_auth`.

Confirma para eu implementar?