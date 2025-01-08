import { describe, expect, test } from "vitest";

import { init, wavedec, waverec } from "wasmlets";

function expectArrayCloseTo(
  a: Float64Array | number[],
  b: Float64Array | number[],
) {
  expect(a.length).toBe(b.length);
  for (let i = 0; i < a.length; i++) {
    expect(a[i]).toBeCloseTo(b[i]);
  }
}

describe("wavedec", () => {
  // https://github.com/PyWavelets/pywt/blob/cf622996f3f0dedde214ab696afcd024660826dc/pywt/tests/test_multilevel.py#L69
  test("basic", async () => {
    await init();

    const x = new Float64Array([3, 7, 1, 1, -2, 5, 4, 6]);
    const [cA3, cD3, cD2, cD1] = wavedec(x, "db1");
    expect(cA3).toBeCloseTo(8.83883476);
    expect(cD3).toBeCloseTo(-0.35355339);
    expectArrayCloseTo(cD2, [4, -3.5]);
    expectArrayCloseTo(cD1, [-2.82842712, 0, -4.94974747, -1.41421356]);
  });
});

describe("waverec", () => {
  test("basic_roundtrip", async () => {
    await init();

    const x = new Float64Array([3, 7, 1, 1, -2, 5, 4, 6]);
    const coeffs = wavedec(x, "db1");
    const x_rec = waverec(coeffs, "db1", x.length);
    expectArrayCloseTo(x, x_rec);
  });

  test("odd_length", async () => {
    await init();

    const x = new Float64Array([3, 7, 1, 1, -2, 5]);
    const coeffs = wavedec(x, "db1");
    const x_rec = waverec(coeffs, "db1", x.length);
    expectArrayCloseTo(x, x_rec);
  });

  test("per_mode", async () => {
    await init();

    const x = new Float64Array([3, 7, 1, 1, -2, 5, 4, 6]);
    const coeffs = wavedec(x, "db2", "per");
    const x_rec = waverec(coeffs, "db2", x.length, "per");
    expectArrayCloseTo(x, x_rec);
  });
});
