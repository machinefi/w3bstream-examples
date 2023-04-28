// Handlers useful to index the DevicesRegistry and DeviceBinding contracts in W3bstream
import { GetDataByRID, JSON, ExecSQL } from "@w3bstream/wasm-sdk";
import { Bool, String } from "@w3bstream/wasm-sdk/assembly/sql";
import { log } from "./utils"

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
    let message_string = GetDataByRID(rid);
    log("New Device Registered Detected: ");
    let message_json = JSON.parse(message_string) as JSON.Obj;
    let topics = message_json.get("topics") as JSON.Arr;
    let device_id_padded = topics._arr[1] as JSON.Str;
    // Addresses are the last 40 bytes
    let device_id = device_id_padded.valueOf().slice(26);
    log("Device ID: " + device_id);

    // Store the device id in the DB
    log("Storing device id in DB...");
    let sql = `INSERT INTO "registered_devices" (device_id, is_active) VALUES (?,?);`;
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

/* 
As an alternative to indexing the events into the W3bstream project's db
we could also query the blockchain contracts from the applet directly

// Verify that the device public key is authorized
function auth_device_from_chain(device_id: string): bool {
    log("Authenticating device on chain: " + device_id)
    if (!device_id) return false;
    
    const ENCODED_CALL = 
        "0xa6fe66de000000000000000000000000" 
        + device_id.replace("0x","");

    log("Calling contract: " + CONST.REGISTRY_CONTRACT + " with encoded call: " + ENCODED_CALL)    
    let ret = CallContract(4690, CONST.REGISTRY_CONTRACT, ENCODED_CALL);
    let ret_bool = hexToBool(ret);
    log("Contract call returned: " + ret_bool.toString())
    
    return (ret_bool);
}

// Get the owner of a specific device id directly from the chain
function get_device_owner_from_chain(device_id: string): string {
    log("Getting device owner from chain...");
    if (!device_id) return "";
    const ENCODED_CALL = 
    "0x459b23a4000000000000000000000000" 
    + device_id.replace("0x","");

    // log("Calling contract: " + CONST.BINDING_CONTRACT + " with encoded call: " + ENCODED_CALL)    
    let address_hex = CallContract(4690, CONST.BINDING_CONTRACT, ENCODED_CALL);
    let address_string = hexToAddress(address_hex)
    log("Device owner is: " + address_string)
    
    return (address_string);
}
*/