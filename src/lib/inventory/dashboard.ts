import type {
  BalanceEntry,
  InventoryDatabase,
  LocalStock,
  MovementRecord,
  Space,
} from "@/lib/types";

export type EnrichedBalance = BalanceEntry & {
  productName: string;
  unit: string;
  localName: string;
};

export type EnrichedMovement = MovementRecord & {
  productName: string;
  unit: string;
  originLabel: string;
  destinationLabel: string;
  createdByName: string;
};

export type DashboardView = {
  summary: {
    totalProducts: number;
    totalLocalStocks: number;
    totalMovements: number;
    totalUnits: number;
  };
  balances: EnrichedBalance[];
  lowStockItems: EnrichedBalance[];
  recentMovements: EnrichedMovement[];
};

function indexById<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

function getLocationLabel(
  localStocks: Map<string, LocalStock>,
  spaces: Map<string, Space>,
  localId: string,
  spaceId: string,
) {
  const localName = localId ? localStocks.get(localId)?.name ?? "" : "";
  const spaceName = spaceId ? spaces.get(spaceId)?.name ?? "" : "";

  if (localName && spaceName) {
    return `${localName} / ${spaceName}`;
  }

  return localName || spaceName || "-";
}

export function buildDashboardView(database: InventoryDatabase): DashboardView {
  const products = indexById(database.products);
  const localStocks = indexById(database.localStocks);
  const spaces = indexById(database.spaces);
  const users = indexById(database.users);

  const balances = database.balances
    .map((balance) => {
      const product = products.get(balance.productId);
      const localStock = localStocks.get(balance.localStockId);

      if (!product || !localStock) {
        return null;
      }

      return {
        ...balance,
        productName: product.name,
        unit: product.unit,
        localName: localStock.name,
      };
    })
    .filter((item): item is EnrichedBalance => Boolean(item))
    .sort((a, b) => a.localName.localeCompare(b.localName) || a.productName.localeCompare(b.productName));

  const recentMovements = database.movements
    .map((movement) => {
      const product = products.get(movement.productId);

      if (!product) {
        return null;
      }

      return {
        ...movement,
        productName: product.name,
        unit: movement.unit || product.unit,
        originLabel: getLocationLabel(localStocks, spaces, movement.originLocalId, movement.originSpaceId),
        destinationLabel: getLocationLabel(
          localStocks,
          spaces,
          movement.destinationLocalId,
          movement.destinationSpaceId,
        ),
        createdByName: users.get(movement.createdBy)?.name ?? "Sistema",
      };
    })
    .filter((item): item is EnrichedMovement => Boolean(item))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    summary: {
      totalProducts: database.products.filter((product) => product.active).length,
      totalLocalStocks: database.localStocks.filter((localStock) => localStock.active).length,
      totalMovements: database.movements.length,
      totalUnits: balances.reduce((acc, item) => acc + item.quantity, 0),
    },
    balances,
    lowStockItems: balances.filter((item) => item.quantity <= 5),
    recentMovements: recentMovements.slice(0, 12),
  };
}
