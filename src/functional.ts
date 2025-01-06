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
  // https://nickb.dev/blog/recommendations-when-publishing-a-wasm-library/
  console.log("TODO: implement custom loading from", wasmUrl);
  module = await createModule({});
}

function check() {
  if (!module) {
    throw new Error("need to call init() before using this function");
  }
}

function encodeString(s: string): cstr {
  check();

  const len = module.lengthBytesUTF8(s) + 1;
  const ptr = module._malloc(len) as unknown as cstr;
  module.stringToUTF8(s, ptr, len);
  return ptr;
}

function dwt_max_level(input_len: number, wavelet: wave_object): number {
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
  check();

  const wave_str = encodeString(wavelet);
  const w = module._wave_init(wave_str);
  module._free(wave_str);
  if (level === undefined) {
    level = dwt_max_level(data.length, w);
  }

  console.log("level", level);

  const mode_str = encodeString("dwt");

  const wt = module._wt_init(w, mode_str, data.length, level);
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
  module._wt_summary(wt);

  // TODO investigate why -1 
  let len_len = module._wt_lenlength(wt) - 1;
  let lens_ptr = module._wt_length(wt) / Int32Array.BYTES_PER_ELEMENT;
  let lens = module.HEAP32.subarray(lens_ptr, lens_ptr + len_len);
  let out_ptr = module._wt_output(wt);

  let coeffs: Float64Array[] = [];

  for (let i = 0; i < lens.length; i++) {
    let len = lens[i];
    let coeff = module.HEAPF64.subarray(
      out_ptr / Float64Array.BYTES_PER_ELEMENT,
      out_ptr / Float64Array.BYTES_PER_ELEMENT + len,
    );
    coeffs.push(coeff);
    out_ptr = ((out_ptr as number) +
      len * Float64Array.BYTES_PER_ELEMENT) as unknown as ptr;
  }

  module._wt_free(wt);
  module._free(mode_str);
  return coeffs;
}

export function waverec(
  coeffs: Float64Array[],
  wavelet: Wavelet,
  mode: Mode = "sym",
): Float64Array {
  check();

  // if (coeffs.length < 1) {
  //   throw new Error("coeffs must have at least one element");
  // } else if (coeffs.length === 1) {
  //   // level 0 transform (just returns the approximation coefficients)
  //   return coeffs[0];
  // }

  // const mode_str = encodeString("dwt");

  // let [a, ...ds] = coeffs;

  // for (let i = 0; i < ds.length; i++) {
  //   if (a.length != ds[i].length + 1 + i) {
  //     throw new Error("coeffs must be in order of increasing resolution");
  //   }
  // }

  // const wave_str = encodeString(wavelet);
  // const w = module._wave_init(wave_str);
  // module._free(wave_str);
  // for (let i = 0; i < ds.length; i++) {
  //   const d = ds[i];
  //   // TODO no idea what the final argument is for
  //   const wt = module._wt_init(w, mode_str, d.length, i);
  //   if (mode == "per") {
  //     let str = encodeString("per");
  //     module._setDWTExtension(wt, str);
  //     module._free(str);
  //   }

  //   module._wt_free(wt);
  // }

  // module._free(mode_str);

  // return a;
}
