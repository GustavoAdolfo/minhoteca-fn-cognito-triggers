# Contribuindo com o projeto minhoteca-fn-cognito-triggers

Obrigado por contribuir com esta Lambda de triggers do Cognito.

## Código de conduta

Mantenha um comportamento respeitoso, claro e colaborativo. Discussões técnicas são bem-vindas, mas assédio e comportamento tóxico não serão tolerados.

## Como começar

### 1. Pré-requisitos

- Node.js `>=24.0.0`
- npm
- Terraform, caso você vá alterar a infraestrutura

### 2. Instalar dependências

```bash
npm install
```

### 3. Verificar o ambiente

Execute a suíte atual antes de alterar o código:

```bash
npm test
npx tsc --noEmit
```

## Estrutura do projeto

```text
src/
  index.ts                # handler principal e roteamento dos trigger sources
  proxies/                # utilitários de integração com serviços AWS
  triggers/               # implementações de cada evento Cognito
tests/
  index.test.ts           # testes do handler principal
  triggers/*.test.ts      # testes unitários dos handlers por trigger
terraform/
  envs/prod/              # configuração do ambiente de produção
  modules/                # módulos Terraform da Lambda e dependências
```

## Fluxo de desenvolvimento

1. Crie uma branch com nome descritivo.
2. Faça alterações pequenas e focadas.
3. Atualize ou adicione testes quando a lógica mudar.
4. Rode os comandos abaixo antes de abrir um PR:

```bash
npm test
npm run test:coverage
npx tsc --noEmit
npm run build
npm run lint
```

## Scripts úteis

```bash
npm test
npm run test:coverage
npm run test:watch
npm run build
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

## Convenção de commits

Prefira mensagens no padrão Conventional Commits, por exemplo:

```text
feat: adicionar suporte a novo trigger Cognito
fix: corrigir roteamento de evento de autenticação
test: cobrir caminho de erro no handler
docs: atualizar documentação do projeto
```

## Regras importantes

- Mantenha a lógica em `src/`.
- Adicione testes em `tests/` quando alterar o comportamento da Lambda.
- Respeite o threshold global de cobertura (90% para statements/branches/functions/lines).
- Se alterar Terraform, valide a mudança no ambiente correspondente.
- Evite mudanças não relacionadas no mesmo PR.
- Se mexer no Cognito, deixe explícito se a mudança exige importação prévia do state.

## Bootstrap da infraestrutura

Se você estiver preparando o ambiente pela primeira vez, o User Pool do Cognito deve ser importado para o state antes do primeiro `apply`.

Use o workflow manual [Import Cognito User Pool](.github/workflows/import-user-pool.yml) e informe o `user_pool_id` existente.

Antes de executar o import, confirme que o environment `prod` contém os dados de integração usados pelo workflow:

- `AWS_ACCOUNT_ID`
- `APPREGISTRY_ID`
- `USER_POOL_CLIENT_ID`
- `BUCKET_RESOURCES`
- `BUCKET_TEMPLATES`
- `LOGO_CONTENT_TYPE`
- `LOGO_IMG`
- `TEMPLATE_EMAIL_CONFIRMATION`
- `TEMPLATE_EMAIL_LOGIN`
- `TEMPLATE_EMAIL_SIGNUP`
- `EMAIL_ABOUT_LINK`
- `EMAIL_PRIVACY_POLICY_LINK`
- `EMAIL_USE_TERM`

Depois do import, o fluxo normal passa a ser `terraform plan`/`apply` no pipeline.

## PR

Ao abrir um pull request, descreva:

- qual trigger ou comportamento foi alterado
- quais testes foram executados
- resultado de cobertura quando houver alteração de lógica
- se há impacto em infra ou variáveis de ambiente
