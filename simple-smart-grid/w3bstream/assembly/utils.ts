// Utility functions
import { Log, SendTx, JSON } from "@w3bstream/wasm-sdk";

let log_count = 1;

export function publicKeyToDeviceId(public_key: string): string {
    // The device id are the first 20 bytes of the public key
    let device_id = public_key.slice(2, 42);
    return device_id;
}

export function log(message: string): i32 {
    Log(log_count.toString() + " - " + message + " ");
    log_count++;
    return 0;
}

export function log_start(message: string): i32 {
  log_count = 1;
  log(message);
  return 0;
}


export function getStringField(message_json: JSON.Obj, field_name: string): string {
  let field_or_null: JSON.Str | null = message_json.getString(field_name);
  let value = "";
  if (field_or_null != null) value = field_or_null.valueOf();
  return value;
}

export function getFloatField(message_json: JSON.Obj, field_name: string): string {
  let field_or_null: JSON.Float | null = message_json.getFloat(field_name);
  let value = "";
  if (field_or_null != null) value = field_or_null.valueOf().toString();
  return value;
}

export function getIntField(message_json: JSON.Obj, field_name: string): string {
  let field_or_null: JSON.Integer | null = message_json.getInteger(field_name);
  let value = "";
  if (field_or_null != null) value = field_or_null.valueOf().toString();
  return value;
}

// Calls a standard, mintable ERC20 contract to mint rewards to a recipient
export function mintRewards(
  token_contract: string,
  recipient: string,
  amountHexStr: string
): string {
  const amountStr = "0".repeat(64 - amountHexStr.length) + amountHexStr;
  const recipientStr = recipient.replace("0x","");
  const data: string = `0x40c10f19000000000000000000000000${recipientStr}${amountStr}`;
  log("Sending tx data: "+ data);
  const res = SendTx(4690, token_contract,"0",data);
  log("Mint rewards hash:" + res);
  return res;
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