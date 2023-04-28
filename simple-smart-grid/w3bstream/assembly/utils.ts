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

export function kill(message: string): void {
    assert(false, message);
}

export function hexToInt(hexString: string): i32 {
    return parseInt(hexString, 16) as i32;
  }
  
  
  export function hexToUtf8(hexString: string): string {
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      bytes[i / 2] = parseInt(hexString.substr(i, 2), 16) as u8;
    }
    let utf8String = "";
    for (let i = 0; i < bytes.length; ++i) {
      let byte = bytes[i];
      if (byte < 0x80) {
        utf8String += String.fromCharCode(byte);
      } else if (byte < 0xE0) {
        utf8String += String.fromCharCode(((byte & 0x1F) << 6) | (bytes[++i] & 0x3F));
      } else if (byte < 0xF0) {
        utf8String += String.fromCharCode(((byte & 0x0F) << 12) | ((bytes[++i] & 0x3F) << 6) | (bytes[++i] & 0x3F));
      } else {
        utf8String += String.fromCharCode(((byte & 0x07) << 18) | ((bytes[++i] & 0x3F) << 12) | ((bytes[++i] & 0x3F) << 6) | (bytes[++i] & 0x3F));
      }
    }
    return utf8String;
  }
  
  export function hexToBool(hexString: string): bool {
    let isZero = true;
    for (let i = 0; i < hexString.length; i++) {
      if (hexString.charAt(i) !== '0') {
        isZero = false;
        break;
      }
    }
    return !isZero;
  }
  
  export function hexToAddress(hexString: string): string {
    return hexString.slice(24);
  }

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