import { describe, expect, test } from "vitest";

import { init, wavedec, waverec } from "wasmlets";
import { expectArrayCloseTo, expectWaveletRoundtripped } from "./util";

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

  test("zero levels returns input", async () => {
    await init();

    const x = new Float64Array([3, 7, 1, 1, -2, 5, 4, 6]);
    const [cA] = wavedec(x, "db1", "sym", 0);
    expect(cA).toBe(x);
  });
});

describe("waverec", () => {
  test("basic_roundtrip", async () => {
    await init();

    const x = new Float64Array([3, 7, 1, 1, -2, 5, 4, 6]);
    const coeffs = wavedec(x, "db1");
    const x_rec = waverec(coeffs, "db1");
    expectWaveletRoundtripped(x, x_rec);
  });

  test("too few coeffs", async () => {
    await init();

    expect(() => waverec([], "db1")).toThrow(/.*have at least one.*/);
  });

  test("level 0 just returns input", async () => {
    await init();

    const x = new Float64Array([3, 7, 1, 1, -2, 5, 4, 6]);
    const coeffs = wavedec(x, "db1", "sym", 0);

    const x_rec = waverec(coeffs, "db1");
    expect(x_rec).toBe(x);
  });

  test("odd_middle_level", async () => {
    await init();

    const x = new Float64Array([3, 7, 1, 1, -2, 5]);
    const coeffs = wavedec(x, "db1");
    const x_rec = waverec(coeffs, "db1");
    expectWaveletRoundtripped(x, x_rec);
  });

  test("odd_length", async () => {
    await init();

    const x = new Float64Array([3, 7, 1, 1, 1, -2, 5]);
    const coeffs = wavedec(x, "db1");
    const x_rec = waverec(coeffs, "db1");
    expectWaveletRoundtripped(x, x_rec);
  });

  test("per_mode", async () => {
    await init();

    const x = new Float64Array([3, 7, 1, 1, -2, 5, 4, 6]);
    const coeffs = wavedec(x, "db2", "per");
    const x_rec = waverec(coeffs, "db2", "per");
    expectWaveletRoundtripped(x, x_rec);

    const x_odd = new Float64Array([3, 7, 1, 1, 1, -2, 5, 4, 6]);
    const coeffs_odd = wavedec(x_odd, "db2", "per");
    const x_rec_odd = waverec(coeffs_odd, "db2", "per");
    expectWaveletRoundtripped(x_odd, x_rec_odd);
  });
});
