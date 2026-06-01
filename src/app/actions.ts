"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/lib/action-state";
import { clearSessionCookie, getSessionUserId, setSessionCookie } from "@/lib/auth/session";
import { getInventoryRepository } from "@/lib/data";

const loginSchema = z.object({
  login: z.string().min(1, "Informe o login"),
  password: z.string().min(1, "Informe a senha"),
});

const createLocalSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
});

const createSpaceSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  localStockId: z.string().min(1, "Selecione o estoque"),
  type: z.string().min(2, "Informe o tipo"),
});

const createProductSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  unit: z.string().min(1, "Informe a unidade"),
});

const createMovementSchema = z
  .object({
    type: z.enum(["entrada", "saida"]),
    productId: z.string().min(1, "Selecione o produto"),
    quantity: z.coerce.number().positive("Quantidade precisa ser maior que zero"),
    unit: z.string().min(1, "Selecione a unidade"),
    originLocalId: z.string().optional().default(""),
    originSpaceId: z.string().optional().default(""),
    destinationLocalId: z.string().optional().default(""),
    destinationSpaceId: z.string().optional().default(""),
    notes: z.string().optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (value.type === "entrada" && !value.destinationLocalId) {
      ctx.addIssue({
        code: "custom",
        path: ["destinationLocalId"],
        message: "Selecione o local de entrada",
      });
    }

    if (value.type === "saida" && !value.originLocalId) {
      ctx.addIssue({
        code: "custom",
        path: ["originLocalId"],
        message: "Selecione o local de saída",
      });
    }

    if (value.type === "saida" && !value.destinationLocalId) {
      ctx.addIssue({
        code: "custom",
        path: ["destinationLocalId"],
        message: "Selecione o local de destino",
      });
    }
  });

async function requireUser() {
  const repository = getInventoryRepository();
  const userId = await getSessionUserId();

  if (!userId) {
    throw new Error("Sessão expirada");
  }

  const user = await repository.getUserById(userId);

  if (!user) {
    throw new Error("Usuário não autorizado");
  }

  return user;
}

function toErrorState(error: unknown): ActionState {
  return {
    status: "error",
    message:
      error instanceof Error ? error.message : "Não foi possível concluir a operação",
    entityId: undefined,
  };
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    login: formData.get("login"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const repository = getInventoryRepository();
  const user = await repository.authenticate(parsed.data.login, parsed.data.password);

  if (!user) {
    return {
      status: "error",
      message: "Login ou senha inválidos",
    };
  }

  await setSessionCookie(user.id);
  revalidatePath("/");
  return {
    status: "success",
    message: "Login realizado",
    entityId: user.id,
  };
}

export async function logoutAction() {
  await clearSessionCookie();
  revalidatePath("/");
}

export async function createLocalAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireUser();
    const parsed = createLocalSchema.parse({
      name: formData.get("name"),
    });

    const repository = getInventoryRepository();
    const local = await repository.createLocal(parsed);
    revalidatePath("/");
    return {
      status: "success",
      message: "Estoque criado",
      entityId: local.id,
    };
  } catch (error) {
    return toErrorState(error);
  }
}

export async function createSpaceAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireUser();
    const parsed = createSpaceSchema.parse({
      name: formData.get("name"),
      localStockId: formData.get("localStockId"),
      type: formData.get("type"),
    });

    const repository = getInventoryRepository();
    const space = await repository.createSpace(parsed);
    revalidatePath("/");
    return {
      status: "success",
      message: "Espaço criado",
      entityId: space.id,
    };
  } catch (error) {
    return toErrorState(error);
  }
}

export async function createProductAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireUser();
    const parsed = createProductSchema.parse({
      name: formData.get("name"),
      unit: formData.get("unit"),
    });

    const repository = getInventoryRepository();
    const product = await repository.createProduct(parsed);
    revalidatePath("/");
    return {
      status: "success",
      message: "Produto criado",
      entityId: product.id,
    };
  } catch (error) {
    return toErrorState(error);
  }
}

export async function createMovementAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireUser();
    const parsed = createMovementSchema.parse({
      type: formData.get("type"),
      productId: formData.get("productId"),
      quantity: formData.get("quantity"),
      unit: formData.get("unit"),
      originLocalId: formData.get("originLocalId"),
      originSpaceId: formData.get("originSpaceId"),
      destinationLocalId: formData.get("destinationLocalId"),
      destinationSpaceId: formData.get("destinationSpaceId"),
      notes: formData.get("notes"),
    });

    const repository = getInventoryRepository();
    await repository.createMovement({
      ...parsed,
      createdBy: user.id,
    });

    revalidatePath("/");
    return {
      status: "success",
      message: "Movimentação registrada",
      entityId: undefined,
    };
  } catch (error) {
    return toErrorState(error);
  }
}
