import { describe, expect, test } from "vitest";

import { init, wavedec } from "wavelibjs";

describe("wavedec", () => {
  // https://github.com/PyWavelets/pywt/blob/cf622996f3f0dedde214ab696afcd024660826dc/pywt/tests/test_multilevel.py#L69
  test("basic", async () => {
    await init();

    const x = new Float64Array([3, 7, 1, 1, -2, 5, 4, 6]);
    const [cA3, cD3, cD2, cD1] = wavedec(x, "db1");
    expect(cA3).toBeCloseTo(8.83883476);
    expect(cD3).toBeCloseTo(-0.35355339);
    expect(cD2[0]).toBeCloseTo(4);
    expect(cD2[1]).toBeCloseTo(-3.5);
    expect(cD1[0]).toBeCloseTo(-2.82842712);
    expect(cD1[1]).toBeCloseTo(0);
    expect(cD1[2]).toBeCloseTo(-4.94974747);
    expect(cD1[3]).toBeCloseTo(-1.41421356);
  });
});
