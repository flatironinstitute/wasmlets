import { expect } from "vitest";

export function expectArrayCloseTo(
  a: Float64Array | number[],
  b: Float64Array | number[],
) {
  expect(a.length).toBe(b.length);
  for (let i = 0; i < a.length; i++) {
    expect(a[i]).toBeCloseTo(b[i]);
  }
}
