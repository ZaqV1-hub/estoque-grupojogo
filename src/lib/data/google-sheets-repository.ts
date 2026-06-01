import { randomUUID } from "node:crypto";

import { GoogleAuth } from "google-auth-library";
import { google, type sheets_v4 } from "googleapis";

import { verifyPassword } from "@/lib/auth/password";
import { applyInventoryMovement } from "@/lib/inventory/stock";
import type {
  BalanceEntry,
  BalanceMap,
  InventoryDatabase,
  LocalStock,
  MovementInput,
  MovementRecord,
  Product,
  Space,
  User,
} from "@/lib/types";
import type {
  CreateLocalInput,
  CreateProductInput,
  CreateSpaceInput,
  InventoryRepository,
} from "@/lib/data/repository";
import { slugify } from "@/lib/utils";

const TAB_ORDER: Array<keyof InventoryDatabase> = [
  "users",
  "localStocks",
  "spaces",
  "products",
  "balances",
  "movements",
];

function parseGoogleCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON nao configurado");
  }

  return JSON.parse(raw);
}

async function createSheetsClient() {
  const auth = new GoogleAuth({
    credentials: parseGoogleCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({
    version: "v4",
    auth,
  });
}

function mapRows(rows: string[][]): Record<string, string>[] {
  const [headers = [], ...body] = rows;

  return body
    .filter((row) => row.some((cell) => String(cell ?? "").trim()))
    .map((row) =>
      headers.reduce<Record<string, string>>((acc, header, index) => {
        acc[header] = row[index] ?? "";
        return acc;
      }, {}),
    );
}

function toSheetRows(items: Record<string, string | number | boolean>[]) {
  if (!items.length) {
    return [[]];
  }

  const headers = Object.keys(items[0]);
  return [headers, ...items.map((item) => headers.map((header) => String(item[header] ?? "")))];
}

function getBalanceMap(entries: BalanceEntry[]): BalanceMap {
  return Object.fromEntries(
    entries.map((entry) => [`${entry.productId}:${entry.localStockId}`, Number(entry.quantity) || 0]),
  );
}

function toBalanceEntries(balanceMap: BalanceMap, current: BalanceEntry[]) {
  const map = new Map(current.map((entry) => [`${entry.productId}:${entry.localStockId}`, entry]));
  const now = new Date().toISOString();

  return Object.entries(balanceMap).map(([key, quantity]) => {
    const [productId, localStockId] = key.split(":");
    const existing = map.get(key);

    return {
      id: existing?.id ?? `bal_${randomUUID()}`,
      productId,
      localStockId,
      quantity,
      updatedAt: now,
    };
  });
}

function createZeroBalance(productId: string, localStockId: string): BalanceEntry {
  return {
    id: `bal_${productId}_${localStockId}`,
    productId,
    localStockId,
    quantity: 0,
    updatedAt: new Date().toISOString(),
  };
}

export class GoogleSheetsInventoryRepository implements InventoryRepository {
  mode = "google_sheets" as const;

  private async getSheetId() {
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId) {
      throw new Error("GOOGLE_SHEET_ID nao configurado");
    }

    return sheetId;
  }

  private async readTab(sheets: sheets_v4.Sheets, tabName: string) {
    const sheetId = await this.getSheetId();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tabName}!A:Z`,
    });

    return (response.data.values ?? []) as string[][];
  }

  private async writeTab(
    sheets: sheets_v4.Sheets,
    tabName: string,
    rows: Record<string, string | number | boolean>[],
  ) {
    const sheetId = await this.getSheetId();
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: `${tabName}!A:Z`,
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${tabName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: toSheetRows(rows),
      },
    });
  }

  async getDatabase() {
    const sheets = await createSheetsClient();
    const [usersRows, localStocksRows, spacesRows, productsRows, balancesRows, movementsRows] =
      await Promise.all(TAB_ORDER.map((tab) => this.readTab(sheets, tab)));

    return {
      users: mapRows(usersRows).map((item) => ({ ...item, active: item.active === "true" })) as User[],
      localStocks: mapRows(localStocksRows).map((item) => ({
        ...item,
        active: item.active === "true",
      })) as LocalStock[],
      spaces: mapRows(spacesRows).map((item) => ({ ...item, active: item.active === "true" })) as Space[],
      products: mapRows(productsRows).map((item) => ({ ...item, active: item.active === "true" })) as Product[],
      balances: mapRows(balancesRows).map((item) => ({
        ...item,
        quantity: Number(item.quantity) || 0,
      })) as BalanceEntry[],
      movements: mapRows(movementsRows).map((item) => ({
        ...item,
        quantity: Number(item.quantity) || 0,
      })) as MovementRecord[],
    };
  }

  private async persistDatabase(database: InventoryDatabase) {
    const sheets = await createSheetsClient();
    await Promise.all(
      TAB_ORDER.map((tab) =>
        this.writeTab(sheets, tab, database[tab] as Record<string, string | number | boolean>[]),
      ),
    );
  }

  async authenticate(login: string, password: string) {
    const database = await this.getDatabase();
    const user = database.users.find(
      (item) => item.active && item.login.toLowerCase() === login.trim().toLowerCase(),
    );

    if (!user) {
      return null;
    }

    return (await verifyPassword(password, user.passwordHash)) ? user : null;
  }

  async getUserById(userId: string) {
    const database = await this.getDatabase();
    return database.users.find((user) => user.id === userId && user.active) ?? null;
  }

  async createLocal(input: CreateLocalInput) {
    const database = await this.getDatabase();
    const localStock: LocalStock = {
      id: `loc_${slugify(input.name) || randomUUID()}`,
      name: input.name.trim(),
      active: true,
    };

    database.localStocks.unshift(localStock);
    database.balances.push(
      ...database.products.map((product) => createZeroBalance(product.id, localStock.id)),
    );
    await this.persistDatabase(database);
    return localStock;
  }

  async createSpace(input: CreateSpaceInput) {
    const database = await this.getDatabase();
    const space: Space = {
      id: `spc_${slugify(input.name) || randomUUID()}`,
      name: input.name.trim(),
      localStockId: input.localStockId,
      type: input.type.trim(),
      active: true,
    };

    database.spaces.unshift(space);
    await this.persistDatabase(database);
    return space;
  }

  async createProduct(input: CreateProductInput) {
    const database = await this.getDatabase();
    const product: Product = {
      id: `prd_${slugify(input.name) || randomUUID()}`,
      name: input.name.trim(),
      category: "",
      unit: input.unit.trim(),
      active: true,
    };

    database.products.unshift(product);
    database.balances.push(
      ...database.localStocks.map((localStock) => createZeroBalance(product.id, localStock.id)),
    );
    await this.persistDatabase(database);
    return product;
  }

  async createMovement(input: MovementInput) {
    const database = await this.getDatabase();
    const nextBalances = applyInventoryMovement(getBalanceMap(database.balances), input);

    database.balances = toBalanceEntries(nextBalances, database.balances);
    database.movements.unshift({
      id: `mov_${randomUUID()}`,
      type: input.type,
      productId: input.productId,
      originLocalId: input.originLocalId ?? "",
      originSpaceId: input.originSpaceId ?? "",
      destinationLocalId: input.destinationLocalId ?? "",
      destinationSpaceId: input.destinationSpaceId ?? "",
      quantity: input.quantity,
      unit: input.unit,
      notes: input.notes?.trim() ?? "",
      createdBy: input.createdBy ?? "",
      createdAt: new Date().toISOString(),
    });

    await this.persistDatabase(database);
  }
}
