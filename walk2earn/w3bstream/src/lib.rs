use std::cmp;
use std::mem;
use std::str;

use anyhow::Result;
use ethabi::{token::Token, Address, Contract, Log, RawLog};
use hex;
use lazy_static::lazy_static;
use p256::{
    ecdsa::{Signature, VerifyingKey},
    EncodedPoint,
};
use serde_json::Value;
use sha2::{Digest, Sha256};
use signature::hazmat::PrehashVerifier;

use types::Record;
mod abi;
mod sdk;
mod types;

lazy_static! {
    static ref WALK_TO_EARN: Contract = serde_json::from_str(abi::WALK_TO_EARN).unwrap();
    static ref DEVICES_REGISTRY: Contract = serde_json::from_str(abi::DEVICES_REGISTRY).unwrap();
}

const CONTRACT_ADDR_DEVICES_REGISTRY: &str = "0xEdC27f3dbECf10e2704c6B9979DD3beeB5A1121c";
const CONTRACT_ADDR_WALK_TO_EARN: &str = "0x9F416bD162c6f96196F38617F77B52F6CFcf9aaF";

#[no_mangle]
pub extern "C" fn alloc(size: i32) -> *mut u8 {
    let mut buf: Vec<u8> = Vec::with_capacity(size as _);
    let ptr = buf.as_mut_ptr();
    mem::forget(buf);
    return ptr;
}

#[no_mangle]
pub extern "C" fn data_handler(event_id: i32) -> i32 {
    sdk::log_info(
        &format!("data_handler function called with event_id: {}", event_id));
    sdk::log_info(
        &format!("DeviceRegistry Contract: {}", CONTRACT_ADDR_DEVICES_REGISTRY));
    sdk::log_info(
        &format!("WalkToEarn Contract: {}", CONTRACT_ADDR_WALK_TO_EARN));

    let data_str = sdk::get_data_as_str(event_id).unwrap();
    sdk::log_info(&format!("event data as string: {}",data_str));

    let data_u8 = match sdk::get_data(event_id) {
        Some(data) => data,
        _ => {
            sdk::log_error("failed to get data");
            return -1;
        }
    };
    
    let input: Value = match serde_json::from_slice(data_u8.as_slice()) {
        Ok(val) => val,
        _ => {
            sdk::log_error("failed to decode the event");
            return -1;
        }
    };
    // sdk::log_info(&format!("input: {:?}", input));

    sdk::log_info(&format!("Verifying the signature"));
    if !verify_signature(&input) {
        {
            sdk::log_error("failed to verify signature");
            return -1;
        }
    }

    sdk::log_info(&format!("Signature is correct"));


    let device_id = match input["device_id"].as_str() {
        Some(id) => id,
        _ => {
            sdk::log_error("failed to get deviceId");
            return -1;
        }
    };
    sdk::log_info(&format!("authorizing device {:?}", device_id));

    if !auth_device(device_id) {
        {
            sdk::log_error(&format!("failed to auth device(id:{})", device_id));
            return -1;
        }
    };
    sdk::log_info(&format!("Device is authorized: Storing data in DB."));

    match sink_data(&input) {
        Ok(_) => 0,
        Err(_) => {
            sdk::log_error("failed to sink data");
            return -1;
        }
    }
}

#[no_mangle]
pub extern "C" fn claim_handler(resource_id: i32) -> i32 {
    sdk::log_info(&format!("Claim function called with resource_id: {}", resource_id));

    let data_u8 = match sdk::get_data(resource_id) {
        Some(data) => data,
        _ => {
            sdk::log_error("failed to get data from event");
            return -1;
        }
    };
    let input: Value = match serde_json::from_slice(data_u8.as_slice()) {
        Ok(val) => val,
        _ => {
            sdk::log_error("failed to decode the event");
            return -1;
        }
    };

    let (req_id, device_id, from, to) = match decode_event_data(&input) {
        Some(val) => val,
        _ => {
            sdk::log_error("failed to decode event data");
            return -1;
        }
    };

    sdk::log_info(&format!("calculating proof of walk for device id:{}), from timestamp: {}, to timestamp: {}", device_id, from, to));

    let steps = match calc_steps(&device_id, from, to) {
        Some(steps) => steps,
        _ => {
            sdk::log_info("failed to calculate steps");
            return -1;
        }
    };

    sdk::log_info(&format!("Steps walked in the time range: {}", steps));

    let data = match match steps {
        0 => encode_func_claim_activity_reply_data(
            req_id,
            steps,
            false,
            String::from("Not enough data in DB"),
        ),
        _ => encode_func_claim_activity_reply_data(req_id, steps, true, String::from("")),
    } {
        Ok(val) => val,
        _ => {
            sdk::log_error("failed to encode claim data");
            return -1;
        }
    };

    sdk::log_info(&format!("Sending proof of walk tx {:?}", data));
    match sdk::send_tx(&String::from(CONTRACT_ADDR_WALK_TO_EARN), &String::from("0"), &data) {
        Ok(_) => 0,
        Err(_) => {
            sdk::log_error("send tx failed");
            return -1;
        }
    }
}

fn verify_signature(data: &Value) -> bool {
    let hash = get_hash(data);
    let sig = match get_signature(&data) {
        Some(sig) => sig,
        _ => return false,
    };
    let pbk = match get_verifyingkey(&data) {
        Some(pbk) => pbk,
        _ => return false,
    };
    pbk.verify_prehash(&hash, &sig).is_ok()
}

fn get_hash(data: &Value) -> Vec<u8> {
    let msg = &data["message"].to_string();
    Sha256::digest(msg).as_slice().to_vec()
}

fn get_signature(data: &Value) -> Option<Signature> {
    let sig_bytes = hex::decode(data["signature"].as_str()?).ok()?;
    signature::Signature::from_bytes(&sig_bytes).ok()
}

fn get_verifyingkey(data: &Value) -> Option<VerifyingKey> {
    let pubkey_bytes = hex::decode(data["public_key"].as_str()?).ok()?;
    let pubkey = EncodedPoint::from_bytes(&pubkey_bytes).ok()?;
    VerifyingKey::from_encoded_point(&pubkey).ok()
}

fn auth_device(device_id: &str) -> bool {
    let to = String::from(CONTRACT_ADDR_DEVICES_REGISTRY);
    let data = match encode_func_is_authorized_device_data(device_id) {
        Ok(data) => data,
        _ => return false,
    };
    let ret = match sdk::call_contract(&to, &data) {
        Some(val) => val,
        _ => return false,
    };
    match decode_func_is_authorized_device_data(ret) {
        Ok(val) => val,
        _ => false,
    }
}

fn encode_func_is_authorized_device_data(device_id: &str) -> Result<String, ethabi::Error> {
    let addr_bytes = match hex::decode(device_id) {
        Ok(b) => b,
        Err(e) => return Err(ethabi::Error::Hex(e)),
    };
    let addr = Address::from_slice(&addr_bytes);
    let encoded = DEVICES_REGISTRY
        .function("isAuthorizedDevice")?
        .encode_input(&[ethabi::Token::Address(addr)])?;
    Ok(hex::encode(encoded))
}

fn decode_func_is_authorized_device_data(data: Vec<u8>) -> Result<bool, ethabi::Error> {
    let tokens = DEVICES_REGISTRY
        .function("isAuthorizedDevice")?
        .decode_output(&data)?;
    tokens[0]
        .clone()
        .into_bool()
        .ok_or(ethabi::Error::InvalidData)
}

fn sink_data(data: &Value) -> Result<()> {
    let id = data["device_id"].as_str().unwrap().to_string();

    let mut value: Vec<Record> = match sdk::get_db(&id) {
        Some(ret) => serde_json::from_slice(ret.as_slice())?,
        None => vec![],
    };

    value.push(Record {
        device_id: data["device_id"].as_str().unwrap().to_string(),
        signature: data["signature"].as_str().unwrap().to_string(),
        timestamp: data["message"]["timestamp"].as_u64().unwrap(),
        totalsteps: data["message"]["steps"].as_u64().unwrap(),
    });

    sdk::set_db(&id, serde_json::to_string(&value)?.into_bytes())
}

fn decode_event_data(data: &Value) -> Option<(u64, String, u64, u64)> {
    let mut topics: Vec<ethabi::Hash> = vec![];

    for v in data["topics"].as_array()? {
        let hex_str = v.as_str()?.strip_prefix("0x")?;
        topics.push(ethabi::Hash::from_slice(&hex::decode(hex_str).ok()?));
    }
    let rawlog = RawLog {
        topics: topics,
        data: hex::decode(data["data"].as_str()?.strip_prefix("0x")?).ok()?,
    };

    let log_result = WALK_TO_EARN
        .event("ActivityRequested")
        .ok()?
        .parse_log(rawlog)
        .ok()?;

    let device_id = get_value_in_log_by_name(&log_result, "_deviceId")?.into_address()?;
    let from_time = get_value_in_log_by_name(&log_result, "_fromTime")?
        .into_uint()?
        .as_u64();
    let to_time = get_value_in_log_by_name(&log_result, "_toTime")?
        .into_uint()?
        .as_u64();
    let req_id = get_value_in_log_by_name(&log_result, "_requestId")?
        .into_uint()?
        .as_u64();

    Some((
        req_id,
        hex::encode(device_id.as_bytes()),
        from_time,
        to_time,
    ))
}

fn get_value_in_log_by_name(log: &Log, name: &str) -> Option<Token> {
    for v in &log.params {
        if v.name.eq_ignore_ascii_case(name) {
            return Some(v.value.clone());
        }
    }
    None
}

fn calc_steps(device_id: &String, from: u64, to: u64) -> Option<u64> {
    let ret = sdk::get_db(&device_id)?;
    let records: Vec<Record> = serde_json::from_slice(ret.as_slice()).ok()?;
    if records.len() < 2 {
        return Some(0);
    }
    let (mut min, mut max) = (std::u64::MAX, std::u64::MIN);
    let mut flag: bool = false;
    for record in records {
        if record.timestamp >= from && record.timestamp <= to {
            flag = true;
            min = cmp::min(min, record.totalsteps);
            max = cmp::max(max, record.totalsteps);
        }
    }
    if !flag {
        return Some(0);
    }
    Some(max - min)
}

fn encode_func_claim_activity_reply_data(
    req_id: u64,
    steps: u64,
    is_success: bool,
    error: String,
) -> Result<String, ethabi::Error> {
    sdk::log_info(&format!("Encoding claim activity reply with req_id: {req_id}, steps: {steps}, is_success: {is_success}, error: {error}", req_id=req_id, steps=steps, is_success=is_success, error=error));

    let encoded = WALK_TO_EARN
        .function("claimActivityReply")?
        .encode_input(&[
            ethabi::Token::Uint(ethabi::Uint::from(req_id)),
            ethabi::Token::Uint(ethabi::Uint::from(steps)),
            ethabi::Token::Bool(is_success),
            ethabi::Token::String(error),
        ])?;
    let ret = hex::encode(encoded);
    // sdk::log_info(&format!("Encoded data: {}", ret));
    Ok(ret)
}
