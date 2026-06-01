# Controle de Estoque Rincao Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar um MVP local de controle de estoque com login simples, dashboard operacional e adaptador pronto para Google Sheets.

**Architecture:** O app usa Next.js App Router com Server Actions para autenticacao e mutacoes. O dominio de estoque fica em modulos puros e testaveis, enquanto a persistencia troca entre arquivo JSON local e Google Sheets por uma interface comum.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Zod, Vitest, Google Sheets API

---

### Task 1: Preparar testes do dominio

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`
- Create: `src/lib/inventory/stock.test.ts`
- Create: `src/lib/auth/auth.test.ts`

- [ ] Escrever os testes do motor de estoque
- [ ] Rodar Vitest e confirmar falha inicial
- [ ] Escrever os testes de autenticacao
- [ ] Rodar Vitest e confirmar falha inicial

### Task 2: Implementar dominio puro

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/inventory/stock.ts`
- Create: `src/lib/auth/password.ts`
- Create: `src/lib/auth/session.ts`

- [ ] Implementar regras de movimentacao
- [ ] Implementar hash e verificacao de senha
- [ ] Rodar testes e confirmar verde

### Task 3: Persistencia

**Files:**
- Create: `data/demo-db.json`
- Create: `src/lib/data/repository.ts`
- Create: `src/lib/data/file-repository.ts`
- Create: `src/lib/data/google-sheets-repository.ts`
- Create: `src/lib/data/index.ts`

- [ ] Criar estrutura de dados de demonstracao persistente
- [ ] Implementar repositorio local
- [ ] Implementar esqueleto funcional do repositorio Google Sheets

### Task 4: UI e acoes

**Files:**
- Create: `src/app/actions.ts`
- Create: `src/components/*.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] Montar login com estado de erro
- [ ] Montar dashboard
- [ ] Montar formularios de cadastro e movimentacao
- [ ] Montar historico e relatorios simples

### Task 5: Configuracao e verificacao

**Files:**
- Create: `.env.example`
- Modify: `README.md`

- [ ] Documentar configuracao do Google Sheets
- [ ] Rodar testes
- [ ] Rodar lint
- [ ] Rodar build
- [ ] Subir em localhost para validacao manual
