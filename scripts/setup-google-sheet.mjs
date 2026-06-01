import { readFile } from "node:fs/promises";
import path from "node:path";

import { GoogleAuth } from "google-auth-library";
import { google } from "googleapis";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const dataPath = path.join(root, "data", "demo-db.json");
const tabOrder = ["users", "localStocks", "spaces", "products", "balances", "movements"];
const fallbackHeaders = {
  users: ["id", "name", "login", "passwordHash", "active"],
  localStocks: ["id", "name", "active"],
  spaces: ["id", "name", "localStockId", "type", "active"],
  products: ["id", "name", "category", "unit", "active"],
  balances: ["id", "productId", "localStockId", "quantity", "updatedAt"],
  movements: [
    "id",
    "type",
    "productId",
    "originLocalId",
    "originSpaceId",
    "destinationLocalId",
    "destinationSpaceId",
    "quantity",
    "unit",
    "notes",
    "createdBy",
    "createdAt",
  ],
};

function parseEnv(content) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

function toSheetRows(items, fallbackHeaders) {
  const headers = items[0] ? Object.keys(items[0]) : fallbackHeaders;
  return [headers, ...items.map((item) => headers.map((header) => String(item[header] ?? "")))];
}

async function main() {
  const env = parseEnv(await readFile(envPath, "utf8"));
  const spreadsheetId = env.GOOGLE_SHEET_ID;
  const credentials = env.GOOGLE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON)
    : null;

  if (!spreadsheetId || !credentials) {
    throw new Error("Configure GOOGLE_SHEET_ID e GOOGLE_SERVICE_ACCOUNT_JSON no .env.local antes de rodar.");
  }

  const database = JSON.parse(await readFile(dataPath, "utf8"));
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const existingTabs = new Set(spreadsheet.data.sheets?.map((sheet) => sheet.properties?.title) ?? []);

  const missingTabs = tabOrder.filter((tab) => !existingTabs.has(tab));

  if (missingTabs.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: missingTabs.map((title) => ({ addSheet: { properties: { title } } })),
      },
    });
  }

  for (const tab of tabOrder) {
    const rows = toSheetRows(database[tab] ?? [], fallbackHeaders[tab]);

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${tab}!A:Z`,
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tab}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rows },
    });
  }

  console.log(`Planilha ${spreadsheetId} configurada com ${tabOrder.length} abas.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
