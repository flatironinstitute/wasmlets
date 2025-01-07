CC = emcc
CXX = em++
CPPFLAGS = -I wavelib/header/

LDFLAGS+=-sMODULARIZE -sEXPORT_NAME=createModule -sEXPORT_ES6  -sINCOMING_MODULE_JS_API=print,printErr,wasmBinary
LDFLAGS+=-sENVIRONMENT=web,node # node needed for vitest
LDFLAGS+=-sEXIT_RUNTIME=1 -sSINGLE_FILE=1 -sALLOW_MEMORY_GROWTH=1


EXPORTS=_malloc,_free,_wave_init,_wt_init,_dwt,_idwt,_wave_free,_wt_free,_setDWTExtension,_wave_filtlength,_set_wt_output,_wt_output,_wt_outlength,_wt_lenlength,_wt_length,_wt_summary
LDFLAGS+=-sEXPORTED_FUNCTIONS=$(EXPORTS) -sEXPORTED_RUNTIME_METHODS=stringToUTF8,getValue,UTF8ToString,lengthBytesUTF8



src/wasm/wavelib.js: wavelib.o wavelib/build_wasm/Bin/libwavelib.a
	$(LINK.c) -o $@ $^ --emit-tsd intf.d.ts

wavelib.o: wavelib.c
	$(COMPILE.c) -o $@ $<

.SILENT: wavelib/build_wasm/Bin/libwavelib.a
wavelib/build_wasm/Bin/libwavelib.a:
	mkdir -p wavelib/build_wasm
	cd wavelib/build_wasm && emcmake cmake .. -DCMAKE_CXX_COMPILER=$(CXX) -DCMAKE_C_COMPILER=$(CC) -DCMAKE_CXX_FLAGS="$(CXXFLAGS)"
	cd wavelib/build_wasm && cmake --build . --target=wavelib

clean:
	$(RM) -r wavelib/build_wasm
	$(RM) wavelib.o
	$(RM) src/wasm/wavelib.js src/wasm/wavelib.wasm src/wasm/intf.d.ts
