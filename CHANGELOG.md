# Changelog

Todas as mudanças relevantes deste repositório serão registradas aqui.

## [Unreleased]

### Added

- Expansão da suíte de testes unitários para handlers de triggers em `tests/triggers/`.
- Testes adicionais de roteamento e tratamento de eventos no handler principal (`tests/index.test.ts`).

### Changed

- Tipagem de handlers de triggers com tipos do `aws-lambda` e `Logger` do `winston`.
- Documentação (`README.md` e `CONTRIBUTING.md`) alinhada ao estado atual de scripts, estrutura e thresholds de cobertura.

### Fixed

- Ajustes em fluxos de triggers para manter compatibilidade com os tipos e contratos de evento do Cognito.

## [1.0.0] - 2026-06-14

### Added

- Primeira versão inicial do projeto `minhoteca-fn-cognito-triggers`.
- Estrutura base com TypeScript, Jest, ESLint, Terraform e handlers para triggers Cognito.
