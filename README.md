# wasmlets - wavelet transforms for the web

The goal of wasmlets is to provide fast wavelet decomposition
and reconstruction functions for use from a JavaScript (or Typescript)
environment, by compiling existing libraries to
[WebAssembly](https://webassembly.org/) (wasm).

Currently, we are using the [wavelib](https://github.com/rafat/wavelib)
C library as the underlying implementation.

How fast is it? See [flatironinstitute/web-wavelets-benchmarking](https://github.com/flatironinstitute/web-wavelets-benchmarking)
for comparisons (more always welcome!)

## Installation

```sh
npm i wasmlets
```

## Use

Before calling anything else, you must await the `init()` function
to load the WebAssembly module.

Then there are two functions, inspired by the API from [PyWavelets](https://pywavelets.readthedocs.io/en/latest/index.html):

```typescript
function wavedec(
  data: Float64Array,
  wavelet: Wavelet,
  mode?: Mode,
  level?: number | undefined,
): Float64Array[];
function waverec(
  coeffs: Float64Array[],
  wavelet: Wavelet,
  mode?: Mode,
): Float64Array;
```

## Building

You will need both [Emscripten](https://emscripten.org/docs/getting_started/downloads.html)
and [yarn](https://yarnpkg.com/) installed.

You can then run `make` followed by `yarn build`.
