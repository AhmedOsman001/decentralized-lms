use super::types::{HttpRequest};
use crate::storage::TENANT_DATA;

/// Extract tenant ID from request headers
pub fn extract_tenant_id_from_headers(req: &HttpRequest) -> Option<String> {
    for header in &req.headers {
        if header.name.to_lowercase() == "x-tenant-id" {
            return Some(header.value.clone());
        }
    }
    None
}

/// Extract authorization info from request headers
/// For now, this is a placeholder - in production you'd validate JWT tokens or similar
#[allow(dead_code)]
pub fn extract_auth_info(req: &HttpRequest) -> Option<String> {
    for header in &req.headers {
        if header.name.to_lowercase() == "authorization" {
            // Remove "Bearer " prefix if present
            let token = if header.value.starts_with("Bearer ") {
                &header.value[7..]
            } else {
                &header.value
            };
            return Some(token.to_string());
        }
    }
    None
}

/// Check if the request has valid authentication
/// This is a simplified check - in production, you'd validate tokens properly
pub fn is_authenticated(_req: &HttpRequest) -> bool {
    // For now, we'll rely on the IC's built-in caller authentication
    // In a full implementation, you might check JWT tokens or similar
    true
}

/// Verify this canister is authorized to serve the given tenant
pub fn verify_tenant_ownership(tenant_id: &str) -> bool {
    TENANT_DATA.with(|data| {
        if let Some(tenant_data) = data.borrow().get() {
            tenant_data.tenant_id == tenant_id
        } else {
            false
        }
    })
}
