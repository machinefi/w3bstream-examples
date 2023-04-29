// Utility functions
import { Log } from "@w3bstream/wasm-sdk";

let log_count = 1;

export function publicKeyToDeviceId(public_key: string): string {
    // The device id are the first 20 bytes of the public key
    let device_id = public_key.slice(2, 42);
    return device_id;
}

export function log(message: string): i32 {
    if (message == "New data message received") log_count = 1;
    Log(log_count.toString() + " - " + message + " ");
    log_count++;
    return 0;
}

// W3bstream doesn't yet implement an abort() function and wil try to run one
// exported by the applet. Make sure you have --use-abort assembly/utils/abort 
// in your compile command
export function abort(
    message: string | null,
    fileName: string | null,
    lineNumber: u32,
    columnNumber: u32
  ): void { 
    if (message == null) message = "unknown error";
    if (fileName == null) fileName = "unknown file";
    log("ABORT: " + message
      + " (at " + fileName
      + ":" + lineNumber.toString() 
      + ":" + columnNumber.toString()
      + ") ");
  }

  export function verifySig(public_key: string, signature: string, message: string): bool{
    return true;
  }