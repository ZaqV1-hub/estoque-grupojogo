# Controle de Estoque Rincao Design

## Objetivo

Construir um web app de controle de estoque para o grupo, com interface simples e bonita, usando Google Sheets como banco oficial de dados e um modo demonstracao local para desenvolvimento inicial em localhost.

## Escopo do MVP

- Login simples com um usuario inicial.
- Cadastro de locais de estoque.
- Cadastro de espacos vinculados a cada local.
- Cadastro de produtos com unidade e categoria.
- Registro de movimentacoes de entrada, saida para consumo e transferencia.
- Dashboard com saldo atual por local, alertas e historico recente.
- Relatorios simples de saldo e extrato por produto.

## Estrutura de dados

Abas previstas no Google Sheets:

- `usuarios`
- `locais_estoque`
- `espacos`
- `produtos`
- `saldos`
- `movimentacoes`

O saldo oficial do MVP sera consolidado por local de estoque. Espacos internos entram como origem ou destino contextual das movimentacoes.

## Arquitetura

- Frontend em Next.js App Router.
- Server Actions para login e mutacoes principais.
- Repositorio de dados com interface unica.
- Adaptador `Google Sheets` para producao.
- Adaptador `arquivo JSON local` para modo demonstracao persistente enquanto as credenciais do Sheets nao estiverem configuradas.

## UX

- Tema claro com identidade administrativa premium.
- Layout com coluna lateral, cards e formularios curtos.
- Navegacao de uma pagina para acelerar operacao.
- Desktop-first com boa leitura em tablet.

## Seguranca

- Senha armazenada com hash.
- Sessao por cookie `httpOnly`.
- Validacao em toda Server Action.

## Integracao com Google Sheets

O app deve detectar as variaveis de ambiente de credenciais e `sheet id`. Quando presentes, usa o adaptador Google Sheets. Quando ausentes, ativa modo demonstracao e informa isso na interface.

## Entrega inicial

O MVP local precisa subir em `localhost`, permitir navegar pelo fluxo principal e deixar a integracao com Sheets pronta para configuracao via `.env`.
