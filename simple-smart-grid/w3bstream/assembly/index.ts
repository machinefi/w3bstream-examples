import { Log, GetDataByRID, JSON, CallContract, ExecSQL } from "@w3bstream/wasm-sdk";
import { String } from "@w3bstream/wasm-sdk/assembly/sql";
import { decode } from "./hex-decode"

// Note: The { alloc } export is required, until it's implemented inside the W3bstream host
export { alloc } from "@w3bstream/wasm-sdk";

let log_count = 1;

// This handler will be executed each time a new data message is sent to our W3bstream project
export function start(rid: i32): i32 {
  // validate fields
  let message_json = validateData(rid);
  // Verify device signature
  validateDeviceIdentity(message_json);
  // Store the IoT data along with the device id 
  storeData(message_json);

  return 0;
}
/*
"Payload": {
    "address":"0x6ea84c048e935ff709ba8f2fcd4730476ae3175b",
    "topics":[
        "0x9fd2c28ce9affee8592933156880418279ba95f7c71e344a71d1928a7c982979",
        "0x0000000000000000000000006d443995cbaf0c4fdbb9163136ebcead9ee9c319",
        "0x0000000000000000000000006b132450c6988246cf60501f37cdf7eed5d19176"
    ],
    "data":"0x",
    "blockNumber":"0x130cf90",
    "transactionHash":"0x6a3fbe46fca1d958e2a630ae050d07569d1a7e973eb21bddb76b8ddd3f69c901",
    "transactionIndex":"0x0",
    "blockHash":"0xa7479d8e23bfc379527c723a571895d0c8f2f75d0ec6056023b1129e35023751",
    "logIndex":"0x0",
    "removed":false
}
*/
export function handle_device_binding(rid: i32): i32 {
    let message_string = GetDataByRID(rid);
    log("New Device Binding Detected: ");
    let message_json = JSON.parse(message_string) as JSON.Obj;
    let topics = message_json.get("topics") as JSON.Arr;
    let device_id_padded = topics._arr[1] as JSON.Str;
    let owner_address_padded = topics._arr[2] as JSON.Str;
    // Addresses are the last 40 bytes
    let device_id = device_id_padded.valueOf().slice(26);
    let owner_address = owner_address_padded.valueOf().slice(26);
    log("Device ID: " + device_id);
    log("Owner Address: " + owner_address);

    // Store the device binding in the DB
    log("Storing device binding in DB...");
    let sql = `INSERT INTO "device_bindings" (device_id, owner_address) VALUES (?,?);`;
    ExecSQL(sql, [ new String(device_id), new String(owner_address)]);
    return 0;
}

// This handler will be called each time a rewards processing request is sent to our W3bstream project
export function handle_rewards_request(rid: i32): i32 {
  // validate fields
  let message_json = validateRewardsRequest(rid);
  // Verify device signature
  validateDeviceIdentity(message_json);
  // process and trigger rewards for the device
  process_rewards(message_json);

  return 0;
}

// Verify that the device public key is authorized
function auth_device(device_id: string): bool {
    log("Authenticating device on chain: " + device_id)
    if (!device_id) return false;
    
    const REGISTRY_CONTRACT = "0x3F124c7F6CC1919C3b244f60d63b32Ca28ce4C6a";
    const ENCODED_CALL = 
        "0xa6fe66de000000000000000000000000" 
        + device_id.replace("0x","");

    log("Calling contract: " + REGISTRY_CONTRACT + " with encoded call: " + ENCODED_CALL)    
    let ret = CallContract(4690, REGISTRY_CONTRACT, ENCODED_CALL);
    let decoded = decode(ret);
    log("Contract call returned: " + decoded + ", length: " + ret.length.toString()+"...")
    
    return (ret.length > 0);
}

// Get the owner of a specific device id
function get_device_owner(device_id: string): string {
    log("Getting device owner from chain...");
    if (!device_id) return "";
    const BINDING_CONTRACT = "0x6BE13c652C457097b28bf9D2C70677bECe199f62";
    const ENCODED_CALL = 
    "0x459b23a4000000000000000000000000" 
    + device_id.replace("0x","");

    log("Calling contract: " + BINDING_CONTRACT + " with encoded call: " + ENCODED_CALL)    
    let ret = CallContract(4690, BINDING_CONTRACT, ENCODED_CALL);
    let decoded = decode(ret);
    log("Contract call returned: " + decoded + ", length: " + ret.length.toString()+"...")
    
    return (decoded);
}

// Verify that the message signature is correct and the device public key is authorized
function validateDeviceIdentity(message_json: JSON.Obj): i32 {
    log("Validating device identity")
    // Get the public key from the message
    let public_key = getStringField(message_json, "public_key");

    // Get the signature from the message
    let signature = getStringField(message_json, "signature");
    // Perform signature verification
    // ...No Crypto libraries are yet available in AssemblyScript
    // this is best performed in Rust or Go
    
    // Verify that the device public key is authorized
    if (!auth_device(publcKeyToDeviceId(public_key))) kill("Device not authorized");
    // check the owner of the device
    let owner = get_device_owner(publcKeyToDeviceId(public_key));
    if (!owner) kill("Device owner not found");
    log("Device owner: " + owner);
    return 0;
}

function validateData(rid: i32): JSON.Obj { 
    // Get the device data message from the W3bstream host
    let message_string = GetDataByRID(rid);
    log("Validating data message: " + message_string)
    // Parse the data message into a JSON object
    let message_json = JSON.parse(message_string) as JSON.Obj;
    // Validate the message fields
    if (!message_json.has("public_key")) kill("public_key field is missing");
    if (!message_json.has("signature")) kill("device_signature field is missing");
    if (!message_json.has("data")) kill("data field is missing");
    let data_json = message_json.get("data") as JSON.Obj;
    if (!data_json.has("sensor_reading")) kill("sensor_reading field is missing");
    if (!data_json.has("timestamp")) kill("timestamp field is missing");

    return message_json;
} 

function validateRewardsRequest(rid: i32): JSON.Obj { 
    // Get the device data message from the W3bstream host
    let message_string = GetDataByRID(rid);
    // Parse the data message into a JSON object
    let message_json = JSON.parse(message_string) as JSON.Obj;
    // Validate the message fields
    if (!message_json.has("public_key")) kill("public_key field is missing");
    if (!message_json.has("signature")) kill("device_signature field is missing");
    if (!message_json.has("data")) kill("data field is missing");
    let data_json = message_json.get("data") as JSON.Obj;
    if (!data_json.has("device_id")) kill("device_id field is missing");
    if (!data_json.has("timestamp")) kill("timestamp field is missing");

    return message_json;
}

function storeData(message_json: JSON.Obj): i32 { 
    log("Storing data message")
    // Get the device public key
    let public_key = getStringField(message_json, "public_key");
    // Get the device data
    let data_json = message_json.get("data") as JSON.Obj;
    // Get the sensor reading
    let sensor_reading = getFloatField(data_json, "sensor_reading");
    // Get the timestamp
    let timestamp = getIntField(data_json, "timestamp");
    // Store the data in the W3bstream SQL Database
    const query = `INSERT INTO "data_table" (public_key,sensor_reading,timestamp) VALUES (?,?,?);`;
    log("Executing query: " + query);
    log("With parameters: " + public_key + ", " + sensor_reading + ", " + timestamp);
    const value = ExecSQL(
        query, 
        [new String(public_key), new String(sensor_reading), new String(timestamp)]);
    log("Query returned: " + value.toString()+"]");

    return value;
}

function process_rewards(message_json: JSON.Obj): i32 { 
    log("Processing rewards request - todo");
    // We will process rewards based on data sent in 24h intervals
  const SECONDS_24H = 60 * 60 * 24;
  let data_json = message_json.get("data") as JSON.Obj;
  // Get the device id that is requesting the rewards calculation
  let device_id = getStringField(data_json, "device_id");
  // Get the timestamp of the request
  let request_time = getIntField(data_json, "timestamp");
  // Fetch the latest request for this device
  //let start_interval = getLastExecutionTime(message_json);
  // Build the 24h interval
  //let end_interval = start_interval + SECONDS_24H;
  // Make sure 24h has passed 
  /*
  kill(request_time >= end_interval, "Too early for rewards calculation (every 24h)");
  while (request_time >= end_interval) {
    // Evaluate energy consumption in the interval
    let tokens = process_rewards(device_id, start_interval, end_interval);
    start_interval = end_interval + 1;
    end_interval = start_interval + SECONDS_24H;
  }*/
  // If (sendRewards) Store the latest request time for this device
  return 0;
}

function getStringField(message_json: JSON.Obj, field_name: string): string {
    let field_or_null: JSON.Str | null = message_json.getString(field_name);
    let value = "";
    if (field_or_null != null) value = field_or_null.valueOf();
    return value;
}

function getFloatField(message_json: JSON.Obj, field_name: string): string {
    let field_or_null: JSON.Float | null = message_json.getFloat(field_name);
    let value = "";
    if (field_or_null != null) value = field_or_null.valueOf().toString();
    return value;
}

function getIntField(message_json: JSON.Obj, field_name: string): string {
    let field_or_null: JSON.Integer | null = message_json.getInteger(field_name);
    let value = "";
    if (field_or_null != null) value = field_or_null.valueOf().toString();
    return value;
}

function publcKeyToDeviceId(public_key: string): string {
    // The device id are the first 20 bytes of the public key
    let device_id = public_key.slice(2, 42);
    return device_id;
}

function log(message: string): i32 {
    Log(log_count.toString() + " - " + message + " ");
    log_count++;
    return 0;
}

function kill(message: string): void {
    assert(false, message);
}

export function abort(
  message: string | null,
  fileName: string | null,
  lineNumber: u32,
  columnNumber: u32
): void { 
  if (message == null) message = "unknown error";
  if (fileName == null) fileName = "unknown file";
  Log("ABORT: " + message
    + " (at " + fileName
    + ":" + lineNumber.toString() 
    + ":" + columnNumber.toString()
    + ") ");
}