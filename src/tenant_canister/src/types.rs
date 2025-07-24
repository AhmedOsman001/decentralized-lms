use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use ic_stable_structures::Storable;
use std::borrow::Cow;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct TenantData {
    pub tenant_id: String,
    pub admin_principal: Principal,
    pub is_initialized: bool,
    pub created_at: u64,
}

impl Storable for TenantData {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(bytes.as_ref()).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
}
