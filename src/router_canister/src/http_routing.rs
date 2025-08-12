use crate::storage::with_tenant_registry;
use candid::{CandidType, Deserialize, Principal};
use ic_cdk::{query, update};
use std::collections::HashMap;
use serde::Serialize;

// Use proper IC HTTP types
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct HttpRequest {
    pub method: String,
    pub url: String,
    pub headers: Vec<HttpHeader>,
    pub body: Vec<u8>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct HttpHeader {
    pub name: String,
    pub value: String,
}

#[derive(CandidType, Serialize, Clone, Debug)]
pub struct HttpResponse {
    pub status_code: u16,
    pub headers: Vec<HttpHeader>,
    pub body: Vec<u8>,
    pub streaming_strategy: Option<StreamingStrategy>,
    pub upgrade: Option<bool>,
}

#[derive(CandidType, Serialize, Clone, Debug)]
pub enum StreamingStrategy {
    Callback {
        token: String,
        callback: String,
    },
}

/// HTTP request handler for subdomain routing
/// This function processes incoming HTTP requests and routes them to appropriate tenant canisters
#[query]
pub fn http_request(req: HttpRequest) -> HttpResponse {
    ic_cdk::println!("Received HTTP request: method={}, url={}", req.method, req.url);
    
    // Extract tenant ID from request
    let tenant_id = match extract_tenant_from_request(&req) {
        Some(id) => {
            ic_cdk::println!("Extracted tenant ID: {}", id);
            id
        },
        None => {
            ic_cdk::println!("No tenant ID found, serving default response");
            return serve_default_response();
        }
    };

    // Validate tenant ID format
    if !is_valid_tenant_id(&tenant_id) {
        ic_cdk::println!("Invalid tenant ID format: {}", tenant_id);
        return create_error_response(400, "Invalid tenant identifier");
    }

    // Route to tenant canister
    match route_to_tenant(&tenant_id, req) {
        Ok(response) => {
            ic_cdk::println!("Successfully routed to tenant: {}", tenant_id);
            response
        },
        Err(error) => {
            ic_cdk::println!("Failed to route to tenant {}: {}", tenant_id, error);
            create_error_response(404, &format!("Tenant '{}' not found", tenant_id))
        }
    }
}

/// Extract tenant ID from HTTP request
/// Checks Host header first, then X-Tenant-ID header, then URL path
fn extract_tenant_from_request(req: &HttpRequest) -> Option<String> {
    // Check Host header for subdomain
    if let Some(tenant_id) = extract_from_host_header(req) {
        return Some(tenant_id);
    }

    // Check X-Tenant-ID header
    if let Some(tenant_id) = extract_from_tenant_header(req) {
        return Some(tenant_id);
    }

    // Check URL path for tenant parameter
    if let Some(tenant_id) = extract_from_url_path(&req.url) {
        return Some(tenant_id);
    }

    None
}

/// Extract tenant ID from Host header
fn extract_from_host_header(req: &HttpRequest) -> Option<String> {
    for header in &req.headers {
        if header.name.to_lowercase() == "host" {
            return parse_tenant_from_hostname(&header.value);
        }
    }
    None
}

/// Parse tenant ID from hostname
fn parse_tenant_from_hostname(hostname: &str) -> Option<String> {
    let hostname = hostname.to_lowercase();
    
    // Handle local development: tenant.lms.localhost:4943
    if hostname.contains("lms.localhost") {
        let parts: Vec<&str> = hostname.split('.').collect();
        if parts.len() >= 3 && parts[1] == "lms" && parts[2].starts_with("localhost") {
            let tenant_id = parts[0].to_string();
            if !tenant_id.is_empty() && tenant_id != "lms" {
                return Some(tenant_id);
            }
        }
    }
    
    // Handle production: tenant.lms.app
    if hostname.contains("lms.app") {
        let parts: Vec<&str> = hostname.split('.').collect();
        if parts.len() >= 3 && parts[1] == "lms" && parts[2] == "app" {
            let tenant_id = parts[0].to_string();
            if !tenant_id.is_empty() && tenant_id != "lms" {
                return Some(tenant_id);
            }
        }
    }
    
    // Handle IC canister URLs with query parameters
    if hostname.contains("ic0.app") || hostname.contains("icp0.io") {
        // Will be handled by URL path extraction
        return None;
    }
    
    None
}

/// Extract tenant ID from X-Tenant-ID header
fn extract_from_tenant_header(req: &HttpRequest) -> Option<String> {
    for header in &req.headers {
        if header.name.to_lowercase() == "x-tenant-id" {
            let tenant_id = header.value.trim().to_string();
            if !tenant_id.is_empty() {
                return Some(tenant_id);
            }
        }
    }
    None
}

/// Extract tenant ID from URL path or query parameters
fn extract_from_url_path(url: &str) -> Option<String> {
    // Check query parameters first
    if let Ok(parsed_url) = url::Url::parse(&format!("http://dummy.com{}", url)) {
        for (key, value) in parsed_url.query_pairs() {
            if key == "tenant" {
                return Some(value.to_string());
            }
        }
    }
    
    // Check path segments: /tenant/{tenant_id}/...
    let path_segments: Vec<&str> = url.split('/').filter(|s| !s.is_empty()).collect();
    if path_segments.len() >= 2 && path_segments[0] == "tenant" {
        return Some(path_segments[1].to_string());
    }
    
    None
}

/// Route request to appropriate tenant canister
fn route_to_tenant(tenant_id: &str, mut req: HttpRequest) -> Result<HttpResponse, String> {
    // Get tenant canister ID from routing table
    let tenant_canister_id = get_tenant_canister_id(tenant_id)?;
    
    // Add tenant context to request headers
    req.headers.push(HttpHeader {
        name: "X-Tenant-ID".to_string(),
        value: tenant_id.to_string(),
    });
    
    req.headers.push(HttpHeader {
        name: "X-Router-Canister".to_string(),
        value: ic_cdk::api::id().to_string(),
    });

    // Forward request to tenant canister
    forward_to_tenant_canister(&tenant_canister_id, req)
}

/// Get tenant canister ID from tenant registry
fn get_tenant_canister_id(tenant_id: &str) -> Result<Principal, String> {
    with_tenant_registry(|registry| {
        let registry = registry.borrow();
        registry.get(&tenant_id.to_string())
            .map(|tenant| tenant.canister_id.parse::<Principal>()
                 .map_err(|_| "Invalid canister ID format".to_string()))
            .unwrap_or_else(|| Err(format!("Tenant '{}' not found in registry", tenant_id)))
    })
}

/// Forward request to tenant canister
fn forward_to_tenant_canister(canister_id: &Principal, _req: HttpRequest) -> Result<HttpResponse, String> {
    // Note: In a real implementation, this would use ic_cdk::call to forward
    // the request to the tenant canister. For now, we'll return a placeholder.
    
    // TODO: Implement actual inter-canister HTTP forwarding
    // This requires using the management canister's http_request method
    
    ic_cdk::println!("Forwarding request to tenant canister: {}", canister_id);
    
    // For now, return a success response indicating routing worked
    Ok(HttpResponse {
        status_code: 200,
        headers: vec![
            HttpHeader {
                name: "Content-Type".to_string(),
                value: "application/json".to_string(),
            },
            HttpHeader {
                name: "X-Routed-To".to_string(),
                value: canister_id.to_string(),
            },
        ],
        body: format!(
            r#"{{"message": "Request routed to tenant canister", "tenant_canister": "{}", "status": "success"}}"#,
            canister_id
        ).into_bytes(),
        streaming_strategy: None,
        upgrade: Some(false),
    })
}

/// Serve default response for requests without tenant context
fn serve_default_response() -> HttpResponse {
    let body = r#"
<!DOCTYPE html>
<html>
<head>
    <title>Decentralized LMS</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .tenant-list { margin: 20px 0; }
        .tenant-link { display: block; margin: 10px 0; padding: 10px; background: #f5f5f5; text-decoration: none; color: #333; }
        .tenant-link:hover { background: #e5e5e5; }
    </style>
</head>
<body>
    <h1>Decentralized Learning Management System</h1>
    <p>Welcome to the multi-tenant LMS platform. Please select a university:</p>
    
    <div class="tenant-list">
        <a href="http://harvard.lms.localhost:4943" class="tenant-link">Harvard University</a>
        <a href="http://mit.lms.localhost:4943" class="tenant-link">MIT</a>
        <a href="http://stanford.lms.localhost:4943" class="tenant-link">Stanford University</a>
        <a href="http://berkeley.lms.localhost:4943" class="tenant-link">UC Berkeley</a>
    </div>
    
    <p>Or access via tenant ID: <code>http://&lt;university&gt;.lms.localhost:4943</code></p>
</body>
</html>"#;

    HttpResponse {
        status_code: 200,
        headers: vec![
            HttpHeader {
                name: "Content-Type".to_string(),
                value: "text/html".to_string(),
            },
        ],
        body: body.as_bytes().to_vec(),
        streaming_strategy: None,
        upgrade: Some(false),
    }
}

/// Create error response
fn create_error_response(status_code: u16, message: &str) -> HttpResponse {
    let body = format!(
        r#"{{"error": "{}", "status": {}}}"#,
        message, status_code
    );

    HttpResponse {
        status_code,
        headers: vec![
            HttpHeader {
                name: "Content-Type".to_string(),
                value: "application/json".to_string(),
            },
        ],
        body: body.into_bytes(),
        streaming_strategy: None,
        upgrade: Some(false),
    }
}

/// Validate tenant ID format
fn is_valid_tenant_id(tenant_id: &str) -> bool {
    if tenant_id.is_empty() || tenant_id.len() > 63 || tenant_id.len() < 3 {
        return false;
    }
    
    // Must start and end with alphanumeric
    let chars: Vec<char> = tenant_id.chars().collect();
    if !chars[0].is_alphanumeric() || !chars[chars.len() - 1].is_alphanumeric() {
        return false;
    }
    
    // Can contain alphanumeric, hyphens, and underscores
    tenant_id.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_')
}

/// Get routing statistics
#[query]
pub fn get_routing_stats() -> HashMap<String, u64> {
    let mut stats = HashMap::new();
    
    with_tenant_registry(|registry| {
        let registry = registry.borrow();
        stats.insert("total_tenants".to_string(), registry.len());
        
        // Add per-tenant request counts (would need to track these)
        for (tenant_id, _) in registry.iter() {
            stats.insert(format!("tenant_{}_requests", tenant_id), 0); // Placeholder
        }
    });
    
    stats
}

/// Update routing table entry
#[update]
pub fn update_routing_entry(tenant_id: String, canister_id: String) -> Result<(), String> {
    if !is_valid_tenant_id(&tenant_id) {
        return Err("Invalid tenant ID format".to_string());
    }
    
    // Validate canister ID format
    let _canister_principal = canister_id.parse::<Principal>()
        .map_err(|_| "Invalid canister ID format")?;
    
    with_tenant_registry(|registry| {
        let mut registry = registry.borrow_mut();
        if let Some(mut tenant) = registry.get(&tenant_id) {
            tenant.canister_id = canister_id;
            tenant.updated_at = ic_cdk::api::time();
            registry.insert(tenant_id.clone(), tenant);
            Ok(())
        } else {
            Err(format!("Tenant '{}' not found", tenant_id))
        }
    })
}
