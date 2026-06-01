import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password auth", () => {
  it("accepts the correct password against its hash", async () => {
    const hash = await hashPassword("rincao5979");

    await expect(verifyPassword("rincao5979", hash)).resolves.toBe(true);
  });

  it("rejects the wrong password against its hash", async () => {
    const hash = await hashPassword("rincao5979");

    await expect(verifyPassword("senha-errada", hash)).resolves.toBe(false);
  });
});
