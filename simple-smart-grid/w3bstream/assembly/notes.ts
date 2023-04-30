/* 
W3bstream Tables (all columns are if type string):

data_table
  public_key
  sensor_reading
  timestamp
registered_devices
  device_id
  is_active
device_bindings
  device_id
  owner_address


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