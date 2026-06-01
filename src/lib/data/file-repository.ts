import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { verifyPassword } from "@/lib/auth/password";
import { applyInventoryMovement } from "@/lib/inventory/stock";
import type {
  BalanceEntry,
  BalanceMap,
  InventoryDatabase,
  LocalStock,
  MovementInput,
  Product,
  Space,
} from "@/lib/types";
import type {
  CreateLocalInput,
  CreateProductInput,
  CreateSpaceInput,
  InventoryRepository,
} from "@/lib/data/repository";
import { slugify } from "@/lib/utils";

const DATA_FILE = path.join(process.cwd(), "data", "demo-db.json");

function toBalanceMap(entries: BalanceEntry[]): BalanceMap {
  return Object.fromEntries(
    entries.map((entry) => [`${entry.productId}:${entry.localStockId}`, Number(entry.quantity) || 0]),
  );
}

function toBalanceEntries(balanceMap: BalanceMap, current: BalanceEntry[]) {
  const now = new Date().toISOString();
  const entryMap = new Map(current.map((entry) => [`${entry.productId}:${entry.localStockId}`, entry]));

  return Object.entries(balanceMap).map(([key, quantity]) => {
    const [productId, localStockId] = key.split(":");
    const existing = entryMap.get(key);

    return {
      id: existing?.id ?? `bal_${randomUUID()}`,
      productId,
      localStockId,
      quantity,
      updatedAt: now,
    };
  });
}

async function readDatabase() {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  const file = await readFile(DATA_FILE, "utf8");
  return JSON.parse(file) as InventoryDatabase;
}

async function writeDatabase(database: InventoryDatabase) {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(database, null, 2), "utf8");
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

export class FileInventoryRepository implements InventoryRepository {
  mode = "demo" as const;

  async authenticate(login: string, password: string) {
    const database = await readDatabase();
    const user = database.users.find(
      (item) => item.active && item.login.toLowerCase() === login.trim().toLowerCase(),
    );

    if (!user) {
      return null;
    }

    return (await verifyPassword(password, user.passwordHash)) ? user : null;
  }

  async getUserById(userId: string) {
    const database = await readDatabase();
    return database.users.find((user) => user.id === userId && user.active) ?? null;
  }

  async getDatabase() {
    return readDatabase();
  }

  async createLocal(input: CreateLocalInput) {
    const database = await readDatabase();
    const localStock: LocalStock = {
      id: `loc_${slugify(input.name) || randomUUID()}`,
      name: input.name.trim(),
      active: true,
    };

    database.localStocks.unshift(localStock);
    database.balances.push(
      ...database.products.map((product) => createZeroBalance(product.id, localStock.id)),
    );
    await writeDatabase(database);
    return localStock;
  }

  async createSpace(input: CreateSpaceInput) {
    const database = await readDatabase();
    const space: Space = {
      id: `spc_${slugify(input.name) || randomUUID()}`,
      name: input.name.trim(),
      localStockId: input.localStockId,
      type: input.type.trim(),
      active: true,
    };

    database.spaces.unshift(space);
    await writeDatabase(database);
    return space;
  }

  async createProduct(input: CreateProductInput) {
    const database = await readDatabase();
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
    await writeDatabase(database);
    return product;
  }

  async createMovement(input: MovementInput) {
    const database = await readDatabase();
    const nextBalances = applyInventoryMovement(toBalanceMap(database.balances), input);

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

    await writeDatabase(database);
  }
}
