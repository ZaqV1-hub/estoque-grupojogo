# Controle de Estoque Rincao

Web app de controle de estoque com:

- login simples
- locais de estoque
- espacos internos
- produtos
- movimentacoes de entrada, saida para consumo e transferencia
- modo demonstracao persistente em arquivo
- adaptador pronto para Google Sheets

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Login inicial:

- usuario: `diego`
- senha: `rincao5979`

## Modo demonstracao

Sem variaveis do Google configuradas, o sistema grava em `data/demo-db.json`.

Isso permite testar toda a UX em localhost sem depender da planilha ainda.

## Ativando Google Sheets

Crie um `.env.local` com base em `.env.example`:

```bash
SESSION_SECRET=um-segredo-forte
GOOGLE_SHEET_ID=id-da-sua-planilha
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Depois rode:

```bash
npm run setup:sheets
npm run dev
```

O comando `setup:sheets` cria/atualiza as abas da planilha usando `data/demo-db.json`
como estrutura inicial. Compartilhe a planilha com o email `client_email` da service
account antes de rodar o comando.

Abas esperadas na planilha:

- `users`
- `localStocks`
- `spaces`
- `products`
- `balances`
- `movements`

Cada aba usa a primeira linha como cabecalho.

## Qualidade

```bash
npm test
npm run lint
npm run build
```
