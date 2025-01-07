import type { Wavelet, Mode } from "./types";
import type { MainModule, Pointers } from "./wasm/wavelib";
type cstr = Pointers["cstr"];
type ptr = Pointers["ptr"];
type wave_object = Pointers["wave_object"];

import createModule from "./wasm/wavelib";

let module: MainModule;

export async function init(wasmUrl?: string) {
  if (module) {
    return;
  }
  if (wasmUrl) {
    // https://nickb.dev/blog/recommendations-when-publishing-a-wasm-library/
    console.log("TODO: implement custom loading from", wasmUrl);
  }

  module = await createModule({});
}

function check_initialized() {
  if (!module) {
    throw new Error("need to call init() before using this function");
  }
}

function encodeString(s: string): cstr {
  const len = module.lengthBytesUTF8(s) + 1;
  const ptr = module._malloc(len) as unknown as cstr;
  module.stringToUTF8(s, ptr, len);
  return ptr;
}

function dwt_max_level(input_len: number, wavelet: wave_object): number {
  // TODO: verify
  let filter_len: number = module._wave_filtlength(wavelet);

  if (filter_len <= 1 || input_len < filter_len - 1) return 0;

  return Math.floor(Math.log2(input_len / (filter_len - 1)));
}

// https://github.com/PyWavelets/pywt/blob/cf622996f3f0dedde214ab696afcd024660826dc/pywt/_multilevel.py#L112
export function wavedec(
  data: Float64Array,
  wavelet: Wavelet,
  mode: Mode = "sym",
  level: number | undefined = undefined,
): Float64Array[] {
  check_initialized();

  const wave_str = encodeString(wavelet);
  const w = module._wave_init(wave_str);
  module._free(wave_str);

  if (level === undefined) {
    level = dwt_max_level(data.length, w);
  }

  const mode_str = encodeString("dwt");
  const wt = module._wt_init(w, mode_str, data.length, level);
  module._free(mode_str);

  if (mode == "per") {
    let str = encodeString("per");
    module._setDWTExtension(wt, str);
    module._free(str);
  }

  let a_ptr = module._malloc(
    data.length * Float64Array.BYTES_PER_ELEMENT,
  ) as unknown as ptr;
  module.HEAPF64.set(data, a_ptr / Float64Array.BYTES_PER_ELEMENT);
  module._dwt(wt, a_ptr);
  module._free(a_ptr);
  // module._wt_summary(wt);

  // note: -1 because the last element is the original signal length
  let len_len = module._wt_lenlength(wt) - 1;
  let lens_ptr = module._wt_length(wt) / Int32Array.BYTES_PER_ELEMENT;
  let lens = module.HEAP32.subarray(lens_ptr, lens_ptr + len_len);
  let out_ptr = (module._wt_output(wt) / Float64Array.BYTES_PER_ELEMENT) as ptr;

  let coeffs: Float64Array[] = [];

  for (let i = 0; i < lens.length; i++) {
    let len = lens[i];
    let coeff = module.HEAPF64.slice(out_ptr, out_ptr + len);
    coeffs.push(coeff);
    out_ptr = (out_ptr + len) as ptr;
  }

  module._wt_free(wt);
  module._wave_free(w);
  return coeffs;
}

export function waverec(
  coeffs: Float64Array[],
  wavelet: Wavelet,
  signallength: number,
  mode: Mode = "sym",
): Float64Array {
  check_initialized();

  if (coeffs.length < 1) {
    throw new Error("coeffs must have at least one element");
  } else if (coeffs.length === 1) {
    // level 0 transform (just returns the approximation coefficients)
    return coeffs[0];
  }

  const wave_str = encodeString(wavelet);
  const w = module._wave_init(wave_str);
  module._free(wave_str);

  const mode_str = encodeString("dwt");
  // TODO: how to determine the signal length automatically?
  const wt = module._wt_init(w, mode_str, signallength, coeffs.length - 1);
  module._free(mode_str);

  if (mode == "per") {
    let str = encodeString("per");
    module._setDWTExtension(wt, str);
    module._free(str);
  }

  const output_len = coeffs.reduce((a, b) => a + b.length, 0);
  const output = module._malloc(
    output_len * Float64Array.BYTES_PER_ELEMENT,
  ) as ptr;

  let len_len = coeffs.length;

  const lengths = module._malloc(len_len * Int32Array.BYTES_PER_ELEMENT) as ptr;
  let offset = 0;
  for (let i = 0; i < coeffs.length; i++) {
    let coeff = coeffs[i];
    module.HEAPF64.set(coeff, output / Float64Array.BYTES_PER_ELEMENT + offset);
    offset += coeff.length;
    module.HEAP32[lengths / Int32Array.BYTES_PER_ELEMENT + i] = coeff.length;
  }

  module._set_wt_output(wt, output, output_len, lengths, len_len);
  module._free(lengths);
  // module._wt_summary(wt);

  const dwtop = module._malloc(
    signallength * Float64Array.BYTES_PER_ELEMENT,
  ) as ptr;
  module._idwt(wt, dwtop);
  // module._wt_summary(wt);
  let result = module.HEAPF64.slice(
    dwtop / Float64Array.BYTES_PER_ELEMENT,
    dwtop / Float64Array.BYTES_PER_ELEMENT + signallength,
  );

  module._free(dwtop);
  module._wt_free(wt);
  module._wave_free(w);

  return result;
}
