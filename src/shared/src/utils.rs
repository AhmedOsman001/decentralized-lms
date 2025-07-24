use ic_cdk::api::time;

/// Get current timestamp in nanoseconds
pub fn current_time() -> u64 {
    time()
}

/// Generate a simple ID (in production, use more robust ID generation)
pub fn generate_id(prefix: &str) -> String {
    format!("{}_{}", prefix, current_time())
}

/// Validate email format (basic validation)
pub fn is_valid_email(email: &str) -> bool {
    email.contains('@') && email.contains('.')
}

/// Validate subdomain format
pub fn is_valid_subdomain(subdomain: &str) -> bool {
    subdomain.len() > 0 
        && subdomain.chars().all(|c| c.is_alphanumeric() || c == '-')
        && !subdomain.starts_with('-')
        && !subdomain.ends_with('-')
}
