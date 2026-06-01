import { describe, expect, it } from "vitest";

import { applyInventoryMovement } from "./stock";
import type { BalanceMap } from "@/lib/types";

describe("applyInventoryMovement", () => {
  it("adds quantity on entrada movements", () => {
    const balances: BalanceMap = {
      "arroz:rincao": 10,
    };

    const next = applyInventoryMovement(balances, {
      type: "entrada",
      productId: "arroz",
      quantity: 5,
      unit: "kg",
      destinationLocalId: "rincao",
    });

    expect(next["arroz:rincao"]).toBe(15);
  });

  it("removes quantity on saida when there is stock", () => {
    const balances: BalanceMap = {
      "arroz:rincao": 10,
    };

    const next = applyInventoryMovement(balances, {
      type: "saida",
      productId: "arroz",
      quantity: 4,
      unit: "kg",
      originLocalId: "rincao",
    });

    expect(next["arroz:rincao"]).toBe(6);
  });

  it("keeps destination only as context on saida", () => {
    const balances: BalanceMap = {
      "arroz:rincao": 10,
      "arroz:estancia": 3,
    };

    const next = applyInventoryMovement(balances, {
      type: "saida",
      productId: "arroz",
      quantity: 4,
      unit: "kg",
      originLocalId: "rincao",
      destinationLocalId: "estancia",
    });

    expect(next["arroz:rincao"]).toBe(6);
    expect(next["arroz:estancia"]).toBe(3);
  });

  it("rejects movements that would make stock negative", () => {
    const balances: BalanceMap = {
      "arroz:rincao": 2,
    };

    expect(() =>
      applyInventoryMovement(balances, {
        type: "saida",
        productId: "arroz",
        quantity: 5,
        unit: "kg",
        originLocalId: "rincao",
      }),
    ).toThrow("Estoque insuficiente");
  });
});
