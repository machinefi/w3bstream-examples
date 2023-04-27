import { Log, GetDataByRID, JSON, CallContract, ExecSQL } from "@w3bstream/wasm-sdk";
import { String } from "@w3bstream/wasm-sdk/assembly/sql";
// Note: The { alloc } export is required, until it's implemented inside the W3bstream host
export { alloc } from "@w3bstream/wasm-sdk";

// This handler will be executed each time a new data message is sent to our W3bstream project
export function handle_data(rid: i32): i32 {
  // validate fields
  let message_json = validateData(rid);
  // Verify device signature
  validateDeviceIdentity(message_json);
  // Store the IoT data along with the device id 
  storeData(message_json);

  return 0;
}

export function handle_rewards_request(rid: i32) {
  // validate fields
  let message_json = validateRewardsRequest(rid);
  // Verify device signature
  validateDeviceIdentity(message_json);
  // process and trigger rewards for the device
  process_rewards(message_json);
}

// Verify that the device public key is authorized
function auth_device(device_id: string | undefined): bool {
    if (!device_id) return false;
    
    const REGISTRY_CONTRACT = "0x1b215fB19733C49bf529b2E5C225d169fFb427fc";
    const ENCODED_CALL = 
        "0xa6fe66de000000000000000000000000" 
        + device_id.replace("0x","");
    Log("Calling contract: " + REGISTRY_CONTRACT + " with encoded call: " + ENCODED_CALL)    
    let ret = CallContract(4690, REGISTRY_CONTRACT, ENCODED_CALL);
    Log("Contract call returned: " + ret)
    return isDefined(ret);
}

// Get the owner of a specific device id
function get_device_owner(device_id: string | undefined): string {
    if (!device_id) return "";
    const BINDING_CONTRACT = "0x1b215fB19733C49bf529b2E5C225d169fFb427fc";
    let ret = CallContract(
        4690,
        BINDING_CONTRACT,
        "0x459b23a4000000000000000000000000" + device_id.replace("0x",""));
    return ret;
}


  

function validateDeviceIdentity(message_json: JSON.Obj) {
    // Get the public key from the message
    let public_key = message_json.getString("public_key")?.valueOf();
    // Get the signature from the message
    let signature = message_json.getString("signature");
    // Perform signature verification
    // ...No Crypto libraries are yet available in AssemblyScript
    // this is best performed in Rust or Go
    
    // Verify that the device public key is authorized
    assert(auth_device(public_key), "Device is not authorized");
    
    return message_json;
}

function validateData(rid: i32): JSON.Obj { 
    // Get the device data message from the W3bstream host
    let message_string = GetDataByRID(rid);
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

function storeData(message_json: JSON.Obj) { 
    // Get the device public key
    let public_key = message_json.getString("public_key")?.valueOf();
    // Get the device data
    let data_json = message_json.get("data") as JSON.Obj;
    // Get the sensor reading
    let sensor_reading = data_json.getString("sensor_reading")?.valueOf();
    // Get the timestamp
    let timestamp = data_json.getString("timestamp")?.valueOf();
    // Store the data in the W3bstream SQL Database
    const value = ExecSQL(
        `INSERT INTO "data_table" (public_key,sensor_reading,timestamp) VALUES (?,?,?);`, 
        [new String(public_key?? ""), new String(sensor_reading?? ""), new String(timestamp?? "")]);
}

function process_rewards(message_json: JSON.Obj) { 
    Log("Processing rewards request - todo");
}