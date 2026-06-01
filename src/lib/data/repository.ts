import type {
  InventoryDatabase,
  LocalStock,
  MovementInput,
  Product,
  Space,
  User,
} from "@/lib/types";

export type RepositoryMode = "demo" | "google_sheets";

export type CreateLocalInput = {
  name: string;
};

export type CreateSpaceInput = {
  name: string;
  localStockId: string;
  type: string;
};

export type CreateProductInput = {
  name: string;
  unit: string;
};

export interface InventoryRepository {
  mode: RepositoryMode;
  authenticate(login: string, password: string): Promise<User | null>;
  getUserById(userId: string): Promise<User | null>;
  getDatabase(): Promise<InventoryDatabase>;
  createLocal(input: CreateLocalInput): Promise<LocalStock>;
  createSpace(input: CreateSpaceInput): Promise<Space>;
  createProduct(input: CreateProductInput): Promise<Product>;
  createMovement(input: MovementInput): Promise<void>;
}
