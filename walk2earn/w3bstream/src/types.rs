use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct Tx {
    pub to: String,
    pub data: String,
    pub value: String,
}

#[derive(Serialize)]
pub struct Call {
    pub to: String,
    pub data: String,
}

#[derive(Serialize, Deserialize)]
pub struct Record {
    pub device_id: String,
    pub signature: String,
    pub timestamp: u64,
    pub totalsteps: u64,
}
