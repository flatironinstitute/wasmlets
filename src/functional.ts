import createModule from "./wasm/wavelib";
import type { WasmModule } from "./wasm/wavelib";

let module: WasmModule;

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

export function wavedec(_data: Float32Array, _level: number) {
  check();
}

export function waverec(_coeffs: Float32Array[], _level: number) {
  check();
}
