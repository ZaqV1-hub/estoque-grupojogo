export type MovementType = "entrada" | "saida";

export type BalanceMap = Record<string, number>;

export type User = {
  id: string;
  name: string;
  login: string;
  passwordHash: string;
  active: boolean;
};

export type LocalStock = {
  id: string;
  name: string;
  active: boolean;
};

export type Space = {
  id: string;
  name: string;
  localStockId: string;
  type: string;
  active: boolean;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  active: boolean;
};

export type BalanceEntry = {
  id: string;
  productId: string;
  localStockId: string;
  quantity: number;
  updatedAt: string;
};

export type MovementRecord = {
  id: string;
  type: MovementType;
  productId: string;
  originLocalId: string;
  originSpaceId: string;
  destinationLocalId: string;
  destinationSpaceId: string;
  quantity: number;
  unit: string;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type InventoryDatabase = {
  users: User[];
  localStocks: LocalStock[];
  spaces: Space[];
  products: Product[];
  balances: BalanceEntry[];
  movements: MovementRecord[];
};

export type MovementInput = {
  type: MovementType;
  productId: string;
  quantity: number;
  unit: string;
  originLocalId?: string;
  destinationLocalId?: string;
  originSpaceId?: string;
  destinationSpaceId?: string;
  notes?: string;
  createdBy?: string;
};
