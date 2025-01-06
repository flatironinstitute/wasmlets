CC = emcc
CXX = em++
CPPFLAGS = -I wavelib/header/

CXXFLAGS+=-fwasm-exceptions -sALLOW_MEMORY_GROWTH=1

LDFLAGS+=-sMODULARIZE -sEXPORT_NAME=createModule -sEXPORT_ES6 -sENVIRONMENT=web -sINCOMING_MODULE_JS_API=print,printErr,wasmBinary
LDFLAGS+=-sEXIT_RUNTIME=1 -sSINGLE_FILE=1

EXPORTS=_malloc,_free,_wave_init,_wt_init,_wtree_init,_wpt_init,_dwt,_idwt,_wave_free,_wt_free,_wtree_free,_wpt_free
LDFLAGS+=-sEXPORTED_FUNCTIONS=$(EXPORTS) -sEXPORTED_RUNTIME_METHODS=stringToUTF8,getValue,UTF8ToString,lengthBytesUTF8

src/wasm/wavelib.js: wavelib/build_wasm/Bin/libwavelib.a
	$(LINK.cc) -o $@ $^ --emit-tsd intf.d.ts

.SILENT: wavelib/build_wasm/Bin/libwavelib.a
wavelib/build_wasm/Bin/libwavelib.a:
	mkdir -p wavelib/build_wasm
	cd wavelib/build_wasm && emcmake cmake .. -DCMAKE_CXX_COMPILER=$(CXX) -DCMAKE_C_COMPILER=$(CC) -DCMAKE_CXX_FLAGS="$(CXXFLAGS)"
	cd wavelib/build_wasm && cmake --build . --target=wavelib

clean:
	$(RM) -r wavelib/build_wasm
	$(RM) src/wasm/wavelib.js src/wasm/wavelib.wasm src/wasm/intf.d.ts
