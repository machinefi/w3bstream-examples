/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/index/start
 * @param rid `i32`
 * @returns `i32`
 */
export declare function start(rid: number): number;
/**
 * assembly/index/abort
 * @param message `~lib/string/String | null`
 * @param fileName `~lib/string/String | null`
 * @param lineNumber `u32`
 * @param columnNumber `u32`
 */
export declare function abort(message: string | null, fileName: string | null, lineNumber: number, columnNumber: number): void;
/**
 * ~lib/@w3bstream/wasm-sdk/assembly/memory/alloc
 * @param size `usize`
 * @returns `usize`
 */
export declare function alloc(size: number): number;
