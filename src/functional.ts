import type { Wavelet, Mode } from "./types";
import type { MainModule, Pointers } from "./wasm/wavelib";
type cstr = Pointers["cstr"];
type ptr = Pointers["ptr"];
type wave_object = Pointers["wave_object"];

import createModule from "./wasm/wavelib";

let module: MainModule;

type InitOptions = {
  // TODO: consider alt wasm source?
  // https://nickb.dev/blog/recommendations-when-publishing-a-wasm-library/
  // wasmUrl?: string;
};

/**
 * Initialize the module. This must be called before using any of the functions
 * in order to load the WebAssembly module. Calling this function multiple times
 * will have no effect.
 *
 * @param options
 * @returns a promise that resolves when the module is initialized
 */
export async function init(_options: InitOptions = {}): Promise<void> {
  if (module) {
    return;
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
  // TODO: verify this is the same as pywt.dwt_max_level
  let filter_len: number = module._wave_filtlength(wavelet);

  if (filter_len <= 1 || input_len < filter_len - 1) return 0;

  return Math.floor(Math.log2(input_len / (filter_len - 1)));
}

/**
 * Perform a wavelet decomposition on a 1D signal.
 *
 * @param data - the 1D signal to decompose
 * @param wavelet - the name of the wavelet to use
 * @param mode - the mode to use for the DWT, either "sym" (default)
 * or "per"
 * @param level - the level of decomposition to perform. If undefined
 * (default), the maximum level is used.
 * @returns an array of Float64Arrays, where the first element is the
 * approximation coefficients and the rest are detail coefficients
 */
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
    const str = encodeString("per");
    module._setDWTExtension(wt, str);
    module._free(str);
  }

  const a_ptr = module._malloc(
    data.length * Float64Array.BYTES_PER_ELEMENT,
  ) as unknown as ptr;
  module.HEAPF64.set(data, a_ptr / Float64Array.BYTES_PER_ELEMENT);
  module._dwt(wt, a_ptr);
  module._free(a_ptr);

  // output is a flat buffer, but we can use the lengths array to split it
  const len_len = module._wt_lenlength(wt) - 1; // note: -1 because the last element is the original signal length
  const lens_ptr = module._wt_length(wt) / Int32Array.BYTES_PER_ELEMENT;
  const lens = module.HEAP32.subarray(lens_ptr, lens_ptr + len_len);

  const outlength = module._wt_outlength(wt);
  const out_ptr = module._wt_output(wt) / Float64Array.BYTES_PER_ELEMENT;
  const coeffs_flat = module.HEAPF64.slice(out_ptr, out_ptr + outlength);

  let coeffs: Float64Array[] = [];

  let offset = 0;
  for (let i = 0; i < lens.length; i++) {
    let len = lens[i];
    coeffs.push(coeffs_flat.subarray(offset, offset + len));
    offset += len;
  }

  module._wt_free(wt);
  module._wave_free(w);
  return coeffs;
}

/**
 * Perform a wavelet reconstruction on a set of wavelet coefficients.
 *
 * @param coeffs - an array of Float64Arrays, where the first element is the
 * approximation coefficients and the rest are detail coefficients
 * @param wavelet - the name of the wavelet to use
 * @param signallength - the length of the reconstructed signal
 * @param mode - the mode to use for the DWT, either "sym" (default)
 * or "per"
 * @returns the reconstructed signal as a Float64Array
 */
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

  // wavelib has no way to provide coefficients, it assumes
  // they were populated by a previous call to _dwt.
  // This code tries to mimic that behavior as best we can.
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

  // call the inverse transform
  const dwtop = module._malloc(
    signallength * Float64Array.BYTES_PER_ELEMENT,
  ) as ptr;
  module._idwt(wt, dwtop);
  let result = module.HEAPF64.slice(
    dwtop / Float64Array.BYTES_PER_ELEMENT,
    dwtop / Float64Array.BYTES_PER_ELEMENT + signallength,
  );

  module._free(dwtop);
  // still needs to be freed, even though
  // we passed it in to _set_wt_output, because
  // the normal output is just extra storage at the end of
  // the struct, so the pointer is never directly freed
  module._free(output);
  module._wt_free(wt);
  module._wave_free(w);

  return result;
}
