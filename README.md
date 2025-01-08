# wasmlets -  wavelet transforms for the web

The goal of wasmlets is to provide fast wavelet decomposition
and reconstruction functions for use from a JavaScript (or Typescript)
environment, by compiling existing libraries to
[WebAssembly](https://webassembly.org/) (wasm).

Currently, we are using the [wavelib](https://github.com/rafat/wavelib)
C library as the underlying implementation.

## Building

You will need both [Emscripten](https://emscripten.org/docs/getting_started/downloads.html)
and [yarn](https://yarnpkg.com/) installed.

You can then run `make` followed by `yarn build`.
