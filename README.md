# minhoteca-fn-cognito-triggers

Função AWS Lambda para processamento de eventos de trigger do Amazon Cognito na plataforma Minhoteca.

## Objetivo

Este repositório centraliza a lógica de autenticação/autorização baseada em Cognito, incluindo:

- cadastro e validação de conta (`PreSignUp`, `PostConfirmation`)
- fluxos de autenticação customizada (`DefineAuthChallenge`, `CreateAuthChallenge`, `VerifyAuthChallenge`)
- eventos pré/pós autenticação (`PreAuthentication`, `PostAuthentication`)
- geração e enriquecimento de tokens (`TokenGeneration_*`)
- envio de e-mails customizados do Cognito (`CustomEmailSender_*`)

O entrypoint principal está em `src/index.ts`, responsável por rotear cada `triggerSource` para os handlers em `src/triggers/`.

## Estrutura do repositório

- `src/index.ts` - handler principal e roteamento por `triggerSource`
- `src/triggers/` - implementações dos gatilhos Cognito
- `src/proxies/` - utilitários/proxies de integração com serviços AWS (ex.: S3)
- `tests/index.test.ts` - cobertura do handler principal
- `tests/triggers/*.test.ts` - cobertura unitária dos handlers por trigger
- `terraform/` - provisionamento de infraestrutura da Lambda

## Pré-requisitos

- Node.js `>=24.0.0` (conforme `package.json`)
- npm
- Terraform (apenas para alterações de infraestrutura)

## Instalação

```bash
npm install
```

## Scripts principais

```bash
# testes
npm test
npm run test:coverage

# qualidade
npm run lint
npm run lint:fix
npm run format
npm run format:check

# build para deploy
npm run build
```

## Qualidade e cobertura

O projeto utiliza Jest com `ts-jest` e possui threshold global de cobertura configurado em `jest.config.js`:

- statements: 90%
- branches: 90%
- functions: 90%
- lines: 90%

## Desenvolvimento

Ao adicionar/alterar um fluxo:

1. Atualize o roteamento em `src/index.ts` quando necessário.
2. Implemente/ajuste o handler em `src/triggers/`.
3. Adicione ou ajuste testes em `tests/index.test.ts` e `tests/triggers/*.test.ts`.
4. Execute `npm test` e `npx tsc --noEmit` antes de abrir PR.

## Infraestrutura

A pasta `terraform/` contém ambientes e módulos para provisionar Lambda e recursos associados.

## Importação do User Pool

O projeto trata o Cognito como um recurso já existente. Para o Terraform passar a gerenciar apenas os triggers e as permissões associadas, use o workflow manual [Import Cognito User Pool](.github/workflows/import-user-pool.yml) uma única vez antes do primeiro `plan/apply` do ambiente.

Fluxo recomendado:

1. Garanta que o environment `prod` tenha os valores necessários para AWS e Terraform.
2. Execute o workflow manual informando o `user_pool_id` real do Cognito existente.
3. Valide o state com `terraform state list` no job do workflow.
4. Depois disso, use o pipeline normal de CI/CD para validar e aplicar as mudanças de triggers.

O recurso é importado para o endereço padrão `module.lambda.aws_cognito_user_pool.existing`.
