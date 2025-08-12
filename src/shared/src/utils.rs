use ic_cdk::api::time;

/// Get current timestamp in nanoseconds
pub fn current_time() -> u64 {
    time()
}

/// Generate a simple ID (in production, use more robust ID generation)
pub fn generate_id(prefix: &str) -> String {
    format!("{}_{}", prefix, current_time())
}

/// Generate a random string for verification codes
pub fn generate_random_string(length: usize) -> String {
    // For now, use time-based generation (in production, use ic_cdk::api::management_canister::main::raw_rand)
    let time_str = current_time().to_string();
    let mut result = String::new();
    
    for (i, ch) in time_str.chars().enumerate() {
        if i >= length { break; }
        if ch.is_ascii_digit() {
            result.push(ch);
        }
    }
    
    // Pad with zeros if needed
    while result.len() < length {
        result.push('0');
    }
    
    result.chars().take(length).collect()
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
