import { describe, test } from "vitest";

import createModule from "wavelibjs";

describe("useStanSampler", () => {
  test("empty URL should return undefined", async () => {
    const mod = await createModule({});
    console.log(mod);
  });
});
