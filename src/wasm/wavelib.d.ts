// Hand-written types for the wavelib module

import { RuntimeExports } from "./intf";



// Newtype trick to create distinct types for different kinds of pointers
const brand = Symbol("brand");
type Brand<T, U> = T & {
  [brand]: U;
};

type ptr = Brand<number, "raw pointer">;
type cstr = Brand<number, "null-terminated char pointer">;
type wave_object = Brand<number, "wave_set pointer">;
type wt_object = Brand<number, "wt_set pointer">;
type wtree_object = Brand<number, "wtree_set pointer">;
type wpt_object = Brand<number, "wpt_set pointer">;

export type Pointers = {
  ptr: ptr;
  cstr: cstr;
  wave_object: wave_object;
  wt_object: wt_object;
  wtree_object: wtree_object;
  wpt_object: wpt_object;
}

// based on the output in `intf.d.ts`, but manually made more helpful
interface WasmModule {
  _wt_lenlength(wt: wt_object): number;
  _wt_length(wt: wt_object): ptr;
  _wt_outlength(wt: wt_object): number;
  _wt_output(wt: wt_object): ptr;
  _set_wt_output(wt: wt_object, output: ptr, outlength: number): void;
  _wave_filtlength(wave: wave_object): number;
  _wave_init(wname: cstr): wave_object;
  _wt_init(wave: wave_object, method: cstr, siglength: number, j: number): wt_object;
  _wtree_init(wave: wave_object, siglength: number, j: number): wtree_object;
  _wpt_init(wave: wave_object, siglength: number, j: number): wpt_object;
  _dwt(wt: wt_object, input: ptr): void;
  _idwt(wt: wt_object, dwtop: ptr): void;
  _setDWTExtension(wt: wt_object, extension: cstr): void;
  _wave_free(obj: wave_object): void;
  _wt_summary(obj: wt_object): void;
  _wt_free(obj: wt_object): void;
  _wtree_free(obj: wtree_object): void;
  _wpt_free(obj: wpt_object): void;
  _malloc(n_bytes: number): ptr;
  _free(ptr: ptr | cstr): void;
}

export type MainModule = WasmModule & typeof RuntimeExports;

export type WasmOptions = {
  print?: (msg: string) => void;
  printErr?: (msg: string) => void;
  wasmBinary?: ArrayBuffer;
}

export default function createModule(options?: WasmOptions): Promise<MainModule>;
