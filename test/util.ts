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

// test equality but allow the reconstruction
// to be 1-bigger if the original signal is odd
// this matches PyWavelets behavior
export function expectWaveletRoundtripped(
  signal: Float64Array | number[],
  reconstruction: Float64Array | number[],
){
  if (signal.length % 2 !== 0) {
    expectArrayCloseTo(signal, reconstruction.slice(0, -1));
  } else {
    expectArrayCloseTo(signal, reconstruction);
  }
}
