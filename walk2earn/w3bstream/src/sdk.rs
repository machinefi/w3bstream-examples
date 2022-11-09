use anyhow::{bail, Result};

#[link(wasm_import_module = "env")]
extern "C" {
    fn ws_get_data(event_id: i32, return_ptr: *const *mut u8, return_size: *const i32) -> i32;
    // fn set_data(event_id: i32, ptr: *const u8, size: i32);
    fn ws_log(log_level: i32, ptr: *const u8, size: i32) -> i32;
    fn ws_get_db(
        key_ptr: *const u8,
        key_size: i32,
        return_ptr: *const *mut u8,
        return_size: *const i32,
    ) -> i32;
    fn ws_set_db(key_ptr: *const u8, key_size: i32, value_ptr: *const u8, value_size: i32) -> i32;
    fn ws_send_tx(ptr: *const u8, size: i32) -> i32;
    fn ws_call_contract(
        ptr: *const u8,
        size: i32,
        return_ptr: *const *mut u8,
        return_size: *const i32,
    ) -> i32;
}

enum LogLevel {
    Trace = 1,
    Debug,
    Info,
    Warn,
    Error,
}

pub fn get_data(resource_id: i32) -> Option<Vec<u8>> {
    let data_ptr = &mut (0 as i32) as *const _ as *const *mut u8;
    let data_size = &(0 as i32);
    match unsafe { ws_get_data(resource_id, data_ptr, data_size) } {
        0 => Some(unsafe { Vec::from_raw_parts(*data_ptr, *data_size as _, *data_size as _) }),
        _ => None,
    }
}

pub fn get_data_as_str(resource_id: i32) -> Option<String> {
    let data_ptr = &mut (0 as i32) as *const _ as *const *mut u8;
    let data_size = &(0 as i32);
    match unsafe { ws_get_data(resource_id, data_ptr, data_size) } {
        0 => Some(unsafe { String::from_raw_parts(*data_ptr, *data_size as _, *data_size as _) }),
        _ => None,
    }
}

pub fn call_contract(to: &String, data: &String) -> Option<Vec<u8>> {
    let data_ptr = &mut (0 as i32) as *const _ as *const *mut u8;
    let data_size = &(0 as i32);

    let tx = crate::types::Call {
        to: to.clone(),
        data: data.clone(),
    };
    let str = serde_json::to_string(&tx).ok()?;
    match unsafe { ws_call_contract(str.as_ptr(), str.len() as _, data_ptr, data_size) } {
        0 => Some(unsafe { Vec::from_raw_parts(*data_ptr, *data_size as _, *data_size as _) }),
        _ => None,
    }
}

pub fn log_info(str: &str) {
    unsafe { ws_log(LogLevel::Info as _, str.as_bytes().as_ptr(), str.len() as _) };
}

pub fn log_error(str: &str) {
    unsafe {
        ws_log(
            LogLevel::Error as _,
            str.as_bytes().as_ptr(),
            str.len() as _,
        )
    };
}

pub fn set_db(key: &String, value: Vec<u8>) -> Result<()> {
    match unsafe {
        ws_set_db(
            key.as_ptr(),
            key.len() as _,
            value.as_ptr(),
            value.len() as _,
        )
    } {
        0 => Ok(()),
        _ => bail!("fail to set db"),
    }
}

pub fn get_db(key: &String) -> Option<Vec<u8>> {
    let data_ptr = &mut (0 as i32) as *const _ as *const *mut u8;
    let data_size = &(0 as i32);
    match unsafe { ws_get_db(key.as_ptr(), key.len() as _, data_ptr, data_size) } {
        0 => Some(unsafe { Vec::from_raw_parts(*data_ptr, *data_size as _, *data_size as _) }),
        _ => None,
    }
}

pub fn send_tx(to: &String, value: &String, data: &String) -> Result<()> {
    let tx = crate::types::Tx {
        to: to.clone(),
        value: value.clone(),
        data: data.clone(),
    };
    let str = serde_json::to_string(&tx)?;
    match unsafe { ws_send_tx(str.as_ptr(), str.len() as _) } {
        0 => Ok(()),
        _ => bail!("fail to send tx"),
    }
}
