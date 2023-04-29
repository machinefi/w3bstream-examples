// W3bstream functions and types
import { GetDataByRID, JSON, ExecSQL, QuerySQL } from "@w3bstream/wasm-sdk";
import { String } from "@w3bstream/wasm-sdk/assembly/sql";
// Utility functions
import { log, publicKeyToDeviceId, verifySig } from "./utils";
import { mintRewards } from "./mintrewards";
// Some constants
import * as CONST from "./constants";

// W3bstream doesn't implement the alloc() function yet, and it will try
// to call the one exported in the Applet. It's curretly implemented in the
// W3bstream package, we just make it available to W3bstream here.
export { alloc } from "@w3bstream/wasm-sdk";

// These handlers manage contarcts indexing events. They are implemented
// inside indexting.ts, we need to export them here to make them visible
// for w3bstream to call them.
export { handle_device_binding, handle_device_registered } from "./indexing";

// This handler will be executed each time a new data message 
// is sent to our W3bstream project
export function start(rid: i32): i32 {
  log("New data message received")
    // validate fields
  let message_json = validateData(rid);
  // Verify device signature
  assert(validateDeviceIdentity(message_json),"Device identity validation failed");
  // make sure the device has an owner assigned
  let owner = get_device_owner(message_json);
  assert(owner != CONST.ZERO_ADDRESS,"No owner assigned for device");
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
    // Get the device id from the message
    let public_key = getStringField(message_json, "public_key");
    let device_id = publicKeyToDeviceId(public_key);
    log("Getting owner of device "+ device_id);
    let sql = "SELECT owner_address FROM device_bindings WHERE device_id = '" + device_id + "'";
    let result = QuerySQL(sql);
    let result_json = JSON.parse(result) as JSON.Obj;
    let owner = getStringField(result_json, "owner_address");
    log("Device owner is: " + owner)
    return (owner);
}

// Verify that the message signature is correct and the device public key is authorized
function validateDeviceIdentity(message_json: JSON.Obj): bool {
    log("Validating device identity")
    // Get the public key from the message
    let public_key = getStringField(message_json, "public_key");
    // Verify that the device public key is authorized in the contract
    let authorized = auth_device(message_json)
    if (!authorized) {
        log("Device authentication failed");
        return false;
    }
    log("Device " + public_key + " is authorized")
    // Get the signature from the message
    let signature = getStringField(message_json, "signature");
    // Get the data object
    let data: JSON.Obj | null = message_json.getObj("data");
    if (data == null) return 0;
    // Perform signature verification
    let signature_ok = verifySig(public_key, signature, data.toString());
    if (!signature_ok) {
        log("Data signature is not valid");
        return false;
    }
    log("Data signature is valid")
    return true;
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
    log("Storing data message in DB")
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
    const value = ExecSQL(
        query, 
        [new String(public_key), new String(sensor_reading), new String(timestamp)]);
    log("Query returned: " + value.toString());

    return value;
}

function process_rewards(message_json: JSON.Obj): i32 { 
    log("Processing rewards");
    // Just reward the most recent data message in the DB  
    // but more complex logic could be implemented here
    let sql = "SELECT public_key,sensor_reading FROM data_table ORDER BY id DESC LIMIT 1";
    let result = QuerySQL(sql);
    let result_json = JSON.parse(result) as JSON.Obj;
    let public_key = getStringField(result_json, "public_key");
    let sensor_reading = parseFloat(getStringField(result_json, "sensor_reading"));  
    if (sensor_reading < 4.0) {
        // Reward the device owner
        let owner = get_device_owner(message_json);
        let rewards = "3";

        log("Rewarding " + owner + " with 3 ECO Tokens...");
        let tx_hash = mintRewards(CONST.TOKEN_CONTRACT, owner, CONST.FOUR_TOKENS_HEX);
        log("Reward transaction hash: " + tx_hash);
    }
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