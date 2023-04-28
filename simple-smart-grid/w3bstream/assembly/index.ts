import { GetDataByRID, JSON, CallContract, ExecSQL, QuerySQL } from "@w3bstream/wasm-sdk";
import { String } from "@w3bstream/wasm-sdk/assembly/sql";
import { log, publicKeyToDeviceId, hexToBool, hexToAddress, hexToUtf8 } from "./utils";
import * as CONST from "./constants";

// Note: The { alloc } export is required, until it's implemented inside the W3bstream host
export { alloc } from "@w3bstream/wasm-sdk";
export { handle_device_binding, handle_device_registered } from "./indexing";

// This handler will be executed each time a new data message is sent to our W3bstream project
export function start(rid: i32): i32 {
  log("New data message received")
    // validate fields
  let message_json = validateData(rid);
  // Verify device signature
  validateDeviceIdentity(message_json);
  // make sure the device has an owner assigned
  let owner = get_device_owner(message_json);
  assert(owner != CONST.ZERO_ADDRESS,"Device has no owner assigned, I'm dropping the data message");
  // Store the IoT data along with the device id 
  storeData(message_json);

  // Evaluate rewards
  process_rewards(message_json);
  return 0;
}

// Verify that the device public key is authorized
function auth_device(message_json: JSON.Obj): bool {
    log("Authenticating device public key from DB...")
    // Get the public key from the message
    let public_key = getStringField(message_json, "public_key");
    // Get the device id from the message
    let device_id = publicKeyToDeviceId(public_key);
    let sql = "SELECT is_active FROM registered_devices WHERE device_id = '" + device_id + "'";
    let result = QuerySQL(sql);
    assert(result != "", "Device is not registered");

    let result_json = JSON.parse(result) as JSON.Obj;
    let is_active = getStringField(result_json, "is_active");
    if (is_active == "true") log("Device is authorized"); 
    else if (is_active == "false") log("Device is banned");

    return (is_active == "true");
}

// Get the owner of a specific device id from te w3bstream DB
function get_device_owner(message_json: JSON.Obj): string {
    log("Getting device owner from DB...");
    // Get the device id from the message
    let public_key = getStringField(message_json, "public_key");
    let device_id = publicKeyToDeviceId(public_key);
    let sql = "SELECT owner_address FROM device_bindings WHERE device_id = '" + device_id + "'";
    let result = QuerySQL(sql);
    let result_json = JSON.parse(result) as JSON.Obj;
    let owner = getStringField(result_json, "owner_address");
    log("Device owner is: " + owner)
    return (owner);
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
    assert(auth_device(message_json), "Device authentication failed");
    
    return 0;
}

function validateData(rid: i32): JSON.Obj { 
    // Get the device data message from the W3bstream host
    let message_string = GetDataByRID(rid);
    log("Validating data message:\n" + message_string)
    // Parse the data message into a JSON object
    let message_json = JSON.parse(message_string) as JSON.Obj;
    // Validate the message fields
    assert(message_json.has("public_key"),"public_key field is missing");
    assert(message_json.has("signature"), "device_signature field is missing");
    assert(message_json.has("data"), "data field is missing");
    let data_json = message_json.get("data") as JSON.Obj;
    assert(data_json.has("sensor_reading"), "sensor_reading field is missing");
    assert(data_json.has("timestamp"), "timestamp field is missing");

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