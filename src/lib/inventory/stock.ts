import type { BalanceMap, MovementInput } from "@/lib/types";

function getBalanceKey(productId: string, localId: string) {
  return `${productId}:${localId}`;
}

function getCurrentBalance(
  balances: BalanceMap,
  productId: string,
  localId: string,
) {
  return balances[getBalanceKey(productId, localId)] ?? 0;
}

function setBalance(
  balances: BalanceMap,
  productId: string,
  localId: string,
  quantity: number,
) {
  return {
    ...balances,
    [getBalanceKey(productId, localId)]: quantity,
  };
}

function ensurePositiveQuantity(quantity: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantidade invalida");
  }
}

export function applyInventoryMovement(
  balances: BalanceMap,
  movement: MovementInput,
) {
  ensurePositiveQuantity(movement.quantity);

  if (movement.type === "entrada") {
    if (!movement.destinationLocalId) {
      throw new Error("Destino obrigatorio");
    }

    const currentBalance = getCurrentBalance(
      balances,
      movement.productId,
      movement.destinationLocalId,
    );

    return setBalance(
      balances,
      movement.productId,
      movement.destinationLocalId,
      currentBalance + movement.quantity,
    );
  }

  if (!movement.originLocalId) {
    throw new Error("Origem obrigatoria");
  }

  const originBalance = getCurrentBalance(
    balances,
    movement.productId,
    movement.originLocalId,
  );

  if (originBalance < movement.quantity) {
    throw new Error("Estoque insuficiente");
  }

  const debitedBalances = setBalance(
    balances,
    movement.productId,
    movement.originLocalId,
    originBalance - movement.quantity,
  );

  if (movement.type === "saida") {
    return debitedBalances;
  }

  return debitedBalances;
}
