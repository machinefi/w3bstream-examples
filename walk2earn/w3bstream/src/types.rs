use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Record {
    pub device_id: String,
    pub signature: String,
    pub timestamp: u64,
    pub totalsteps: u64,
}
