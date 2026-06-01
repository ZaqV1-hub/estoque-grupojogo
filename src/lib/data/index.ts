import { FileInventoryRepository } from "@/lib/data/file-repository";
import { GoogleSheetsInventoryRepository } from "@/lib/data/google-sheets-repository";

export function isGoogleSheetsConfigured() {
  return Boolean(
    process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
  );
}

export function getInventoryRepository() {
  if (isGoogleSheetsConfigured()) {
    return new GoogleSheetsInventoryRepository();
  }

  return new FileInventoryRepository();
}
