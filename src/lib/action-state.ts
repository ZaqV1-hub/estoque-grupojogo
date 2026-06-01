export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
  entityId?: string;
};

export const INITIAL_ACTION_STATE: ActionState = {
  status: "idle",
  message: "",
  entityId: undefined,
};
