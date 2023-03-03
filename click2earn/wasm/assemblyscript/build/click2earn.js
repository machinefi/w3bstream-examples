async function instantiate(module, imports = {}) {
  const adaptedImports = {
    env: Object.assign(Object.create(globalThis), imports.env || {}, {
      ws_log(logLevel, ptr, size) {
        // ~lib/@w3bstream/wasm-sdk/assembly/sdk/ws_log(u8, usize, usize) => i32
        ptr = ptr >>> 0;
        size = size >>> 0;
        return ws_log(logLevel, ptr, size);
      },
      ws_get_data(rid, data_ptr, size_ptr) {
        // ~lib/@w3bstream/wasm-sdk/assembly/sdk/ws_get_data(i32, usize, usize) => i32
        data_ptr = data_ptr >>> 0;
        size_ptr = size_ptr >>> 0;
        return ws_get_data(rid, data_ptr, size_ptr);
      },
      ws_get_db(addr, size, rAddr, rSize) {
        // ~lib/@w3bstream/wasm-sdk/assembly/sdk/ws_get_db(usize, usize, usize, usize) => i32
        addr = addr >>> 0;
        size = size >>> 0;
        rAddr = rAddr >>> 0;
        rSize = rSize >>> 0;
        return ws_get_db(addr, size, rAddr, rSize);
      },
      ws_set_db(key_ptr, ket_size, return_ptr, return_size) {
        // ~lib/@w3bstream/wasm-sdk/assembly/sdk/ws_set_db(usize, i32, usize, i32) => i32
        key_ptr = key_ptr >>> 0;
        return_ptr = return_ptr >>> 0;
        return ws_set_db(key_ptr, ket_size, return_ptr, return_size);
      },
      ws_send_tx(chainID, offset, size, vmAddrPtr, vmSizePtr) {
        // ~lib/@w3bstream/wasm-sdk/assembly/sdk/ws_send_tx(i32, usize, usize, usize, usize) => i32
        offset = offset >>> 0;
        size = size >>> 0;
        vmAddrPtr = vmAddrPtr >>> 0;
        vmSizePtr = vmSizePtr >>> 0;
        return ws_send_tx(chainID, offset, size, vmAddrPtr, vmSizePtr);
      },
    }),
  };
  const { exports } = await WebAssembly.instantiate(module, adaptedImports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    abort(message, fileName, lineNumber, columnNumber) {
      // assembly/index/abort(~lib/string/String | null, ~lib/string/String | null, u32, u32) => void
      message = __retain(__lowerString(message));
      fileName = __lowerString(fileName);
      try {
        exports.abort(message, fileName, lineNumber, columnNumber);
      } finally {
        __release(message);
      }
    },
    alloc(size) {
      // ~lib/@w3bstream/wasm-sdk/assembly/memory/alloc(usize) => usize
      return exports.alloc(size) >>> 0;
    },
  }, exports);
  function __lowerString(value) {
    if (value == null) return 0;
    const
      length = value.length,
      pointer = exports.__new(length << 1, 2) >>> 0,
      memoryU16 = new Uint16Array(memory.buffer);
    for (let i = 0; i < length; ++i) memoryU16[(pointer >>> 1) + i] = value.charCodeAt(i);
    return pointer;
  }
  const refcounts = new Map();
  function __retain(pointer) {
    if (pointer) {
      const refcount = refcounts.get(pointer);
      if (refcount) refcounts.set(pointer, refcount + 1);
      else refcounts.set(exports.__pin(pointer), 1);
    }
    return pointer;
  }
  function __release(pointer) {
    if (pointer) {
      const refcount = refcounts.get(pointer);
      if (refcount === 1) exports.__unpin(pointer), refcounts.delete(pointer);
      else if (refcount) refcounts.set(pointer, refcount - 1);
      else throw Error(`invalid refcount '${refcount}' for reference '${pointer}'`);
    }
  }
  return adaptedExports;
}
export const {
  memory,
  start,
  abort,
  alloc
} = await (async url => instantiate(
  await (async () => {
    try { return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)); }
    catch { return globalThis.WebAssembly.compile(await (await import("node:fs/promises")).readFile(url)); }
  })(), {
  }
))(new URL("click2earn.wasm", import.meta.url));
