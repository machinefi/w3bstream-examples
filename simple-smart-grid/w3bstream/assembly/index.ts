// W3bstream functions and types
import { GetDataByRID, JSON, ExecSQL, QuerySQL } from "@w3bstream/wasm-sdk";
import { String, Bool } from "@w3bstream/wasm-sdk/assembly/sql";
// Utility functions
import { 
    log, publicKeyToDeviceId, mintRewards, verifySig, 
    getStringField, getFloatField, getIntField, log_start } from "./utils";
// Some constants
import * as CONST from "./constants";

// W3bstream doesn't implement the alloc() function yet, and it will try
// to call the one exported in the Applet. It's curretly implemented in the
// W3bstream package, we just make it available to W3bstream here.
export { alloc } from "@w3bstream/wasm-sdk";

//#region W3bstream event handlers
export function start(rid: i32): i32 { return handle_data(rid); }


// This handler will be executed each time a new data message 
// is sent to our W3bstream project
export function handle_data(rid: i32): i32 {
  log_start("New data message received");
  // Get the device data message from the W3bstream host
  let message_string = GetDataByRID(rid);
  // Parse the data message into a JSON object
  let message_json = JSON.parse(message_string) as JSON.Obj;
  // validate fields
  assert(validateData(message_json), "Message fields are not valid");
  // Verify device signature
  assert(validateDeviceIdentity(message_json),"Device identity validation failed");
  // make sure the device has an owner assigned
  let owner = get_device_owner(message_json);
  assert(owner != CONST.ZERO_ADDRESS,"No owner assigned for device");
  // Store the IoT data along with the device id 
  storeData(message_json);

  // For simplicity, let's evaluate rewards here (however, a dedicated
  // message should be sent periodically!)
  return handle_process_rewards(rid);
}

// Simply rewards the most recent data message in the DB  
// but more complex logic could be implemented here
export function handle_process_rewards(rid: i32): i32 {
  log_start("Processing rewards");

  // Get the device data message from the W3bstream host
  let message_string = GetDataByRID(rid);
  // Parse the data message into a JSON object
  let message_json = JSON.parse(message_string) as JSON.Obj;

  // Get the public key from the message
  let public_key = getStringField(message_json, "public_key");
  // Get the latest IoT data point sent by the device
  let sql = "SELECT public_key,sensor_reading FROM data_table WHERE public_key = '"+public_key+"' ORDER BY id DESC LIMIT 1";
  let result = QuerySQL(sql);
  let result_json = JSON.parse(result) as JSON.Obj;
  if (result_json == null) {
    log("No data found for device ")
    return 1;
  }
  // Get the power consumption
  let sensor_reading = parseFloat(getStringField(result_json, "sensor_reading"));  
  if (sensor_reading < 4.0) {
    // Rewards the device owner
    let owner = get_device_owner(message_json);
    log("Rewarding " + owner + " with 3 ECO Tokens...");
    let tx_hash = mintRewards(CONST.TOKEN_CONTRACT, owner, CONST.FOUR_TOKENS_HEX);
    if (tx_hash == "") {
        log("Sending token rewards failed.")
        return 1;
    }
    log("Reward transaction hash: " + tx_hash);
  } else {
    log("Power consumption too high, no rewards sent.");
  }

  return 0;
}

/* 
"Payload": {
    "address":"0xF40274D96887a3eDe12311cd6603A214c10AC2F5",
    "topics": [
      "0x05d7f0c690676ba31675b45bcdb9ff4c34bb10744ec89d329eacd93c79ecc029",
      "0x0000000000000000000000006d443995cbaf0c4fdbb9163136ebcead9ee9c322"
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
export function handle_device_registered(rid: i32): i32 {
    log_start("New Device Registered Detected: ");
    let message_string = GetDataByRID(rid);
    let message_json = JSON.parse(message_string) as JSON.Obj;
    let topics = message_json.get("topics") as JSON.Arr;
    let device_id_padded = topics._arr[1] as JSON.Str;
    // Addresses are the last 40 bytes
    let device_id = device_id_padded.valueOf().slice(26);
    log("Device ID: " + device_id);

    // Store the device id in the DB
    log("Storing device id in DB...");
    let sql = `INSERT INTO "device_registry" (device_id, is_active) VALUES (?,?);`;
    ExecSQL(sql, [ new String(device_id), new Bool(true)]);
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
    log_start("New Device Binding Detected: ");
    let message_string = GetDataByRID(rid);
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

//#endregion

// Verify that the device public key is authorized
function auth_device(message_json: JSON.Obj): bool {
    log("Authenticating device public key from DB...")
    // Get the public key from the message
    let public_key = getStringField(message_json, "public_key");
    // Get the device id from the message
    let device_id = publicKeyToDeviceId(public_key);
    let sql = "SELECT is_active FROM device_registry WHERE device_id = '" + device_id + "'";
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
    if (result == "") {
        log("Device is not bound to any owner");
        return CONST.ZERO_ADDRESS;
    }
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

function validateData(message_json: JSON.Obj): boolean { 
    log("Validating data message:\n" + message_json.toString())
    let valid: bool = true;
    // Validate the message fields
    if (!(valid = valid && message_json.has("public_key"))) log("public_key field is missing");
    if (!(valid = valid && message_json.has("signature"))) log("device_signature field is missing");
    if (!(valid = valid && message_json.has("data"))) log("data field is missing");
    
    let data_json = message_json.get("data") as JSON.Obj;
    if (!(valid = valid && data_json.has("sensor_reading"))) log("sensor_reading field is missing");
    if (!(valid = valid && data_json.has("timestamp"))) log("timestamp field is missing");

    return valid as boolean;
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