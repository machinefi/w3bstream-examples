import { Log, GetDataByRID, JSON, CallContract, ExecSQL } from "@w3bstream/wasm-sdk";
import { String } from "@w3bstream/wasm-sdk/assembly/sql";
import { hex_encode, hex_decode, decode } from "./hex-decode"

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
    Log("Authenticating device on chain: " + device_id)
    if (!device_id) return false;
    
    const REGISTRY_CONTRACT = "0xb4d2c4D022C01Ac102752CA776027674F9e6CEB6";
    const ENCODED_CALL = 
        "0xa6fe66de000000000000000000000000" 
        + device_id.replace("0x","");

    Log("Calling contract: " + REGISTRY_CONTRACT + " with encoded call: " + ENCODED_CALL)    
    let ret = CallContract(4690, REGISTRY_CONTRACT, ENCODED_CALL);
    let decoded = decode(ret);
    Log("Contract call returned: " + decoded + ", length: " + ret.length.toString()+"...")
    
    return (ret.length > 0);
}

// Get the owner of a specific device id
function get_device_owner(device_id: string): string {
    if (!device_id) return "";
    const BINDING_CONTRACT = "0xDA55871852275fc08222b321A20fBead0677d0E7";
    let ret = CallContract(
        4690,
        BINDING_CONTRACT,
        "0x459b23a4000000000000000000000000" + device_id.replace("0x",""));
    return ret;
}

// Verify that the message signature is correct and the device public key is authorized
function validateDeviceIdentity(message_json: JSON.Obj): i32 {
    Log("Validating device identity")
    // Get the public key from the message
    let public_key = getStringField(message_json, "public_key");

    // Get the signature from the message
    let signature = getStringField(message_json, "signature");
    // Perform signature verification
    // ...No Crypto libraries are yet available in AssemblyScript
    // this is best performed in Rust or Go
    
    // Verify that the device public key is authorized
    return assert(auth_device(publcKeyToDeviceId(public_key)), "Device is not authorized");
}

function validateData(rid: i32): JSON.Obj { 
    // Get the device data message from the W3bstream host
    let message_string = GetDataByRID(rid);
    Log("Validating data message: " + message_string)
    // Parse the data message into a JSON object
    let message_json = JSON.parse(message_string) as JSON.Obj;
    // Validate the message fields
    assert(message_json.has("public_key"), "public_key field is missing");
    assert(message_json.has("signature"), "device_signature field is missing");
    assert(message_json.has("data"), "data field is missing");
    let data_json = message_json.get("data") as JSON.Obj;
    assert(data_json.has("sensor_reading"), "sensor_reading field is missing");
    assert(data_json.has("timestamp"), "timestamp field is missing");

    return message_json;
} 

function validateRewardsRequest(rid: i32): JSON.Obj { 
    // Get the device data message from the W3bstream host
    let message_string = GetDataByRID(rid);
    // Parse the data message into a JSON object
    let message_json = JSON.parse(message_string) as JSON.Obj;
    // Validate the message fields
    assert(message_json.has("public_key"), "public_key field is missing");
    assert(message_json.has("signature"), "device_signature field is missing");
    assert(message_json.has("data"), "data field is missing");
    let data_json = message_json.get("data") as JSON.Obj;
    assert(data_json.has("device_id"), "device_id field is missing");
    assert(data_json.has("timestamp"), "timestamp field is missing");

    return message_json;
}

function storeData(message_json: JSON.Obj): i32 { 
    Log("Storing data message")
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
    Log("Executing query: " + query);
    Log("With parameters: " + public_key + ", " + sensor_reading + ", " + timestamp);
    const value = ExecSQL(
        query, 
        [new String(public_key), new String(sensor_reading), new String(timestamp)]);
    Log("Query returned: " + value.toString()+"]");

    return value;
}

function process_rewards(message_json: JSON.Obj): i32 { 
    Log("Processing rewards request - todo");
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
  assert(request_time >= end_interval, "Too early for rewards calculation (every 24h)");
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
    let device_id = public_key.substr(2, 20);
    return device_id;
}

function log_info(message: string): void {
    Log(log_count.toString() + " - " + message + " ");
}