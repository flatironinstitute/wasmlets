CC = emcc
CXX = em++

CPPFLAGS+= -I c/wavelib/header/

# CFLAGS+=-Og --profiling -sASSERTIONS=1 -sSAFE_HEAP=1 -sSTACK_OVERFLOW_CHECK=2
CFLAGS+=-O3 --closure 1

LDFLAGS+=-sDEFAULT_TO_CXX=0 -sWASM=1
LDFLAGS+=-sMODULARIZE=1 -sEXPORT_NAME=createModule -sEXPORT_ES6=1 -sSINGLE_FILE=1
LDFLAGS+=-sEXIT_RUNTIME=1 -sALLOW_MEMORY_GROWTH=1

LDFLAGS+=-sINCOMING_MODULE_JS_API=print,printErr,wasmBinary
EXPORTS=_malloc,_free,_wave_init,_wt_init,_dwt,_idwt,_wave_free,_wt_free,_setDWTExtension,_setWTConv,_wave_filtlength,_set_wt_output,_wt_output,_wt_outlength,_wt_lenlength,_wt_length,_wt_summary
LDFLAGS+=-sEXPORTED_FUNCTIONS=$(EXPORTS)
LDFLAGS+=-sEXPORTED_RUNTIME_METHODS=stringToUTF8,getValue,UTF8ToString,lengthBytesUTF8


SOURCES = c/wavelib_helpers.c $(wildcard c/wavelib/src/*.c)

src/wasm/wavelib.js: $(SOURCES)
	$(LINK.c) -o $@ $? --emit-tsd intf.d.ts

clean:
	$(RM) src/wasm/wavelib.js src/wasm/wavelib.wasm src/wasm/intf.d.ts
