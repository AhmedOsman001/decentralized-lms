use ic_cdk::query;
use super::types::{HttpRequest, HttpResponse, HttpHeader};
use super::auth::{extract_tenant_id_from_headers, verify_tenant_ownership, is_authenticated};
use super::responses::{create_error_response, create_json_response};
use super::handlers::{handle_api_request, redirect_to_frontend};

/// HTTP request handler for tenant-specific routing
#[query]
pub fn http_request(req: HttpRequest) -> HttpResponse {
    ic_cdk::println!("Tenant canister received HTTP request: method={}, url={}", req.method, req.url);
    
    // Extract tenant ID from headers (set by router)
    let tenant_id = extract_tenant_id_from_headers(&req);
    ic_cdk::println!("Extracted tenant ID: {:?}", tenant_id);
    
    // Verify this canister is serving the correct tenant
    if let Some(tenant_id) = &tenant_id {
        if !verify_tenant_ownership(tenant_id) {
            return create_error_response(403, "Unauthorized tenant access");
        }
    }
    
    // Route based on URL path
    match req.method.as_str() {
        "GET" => handle_get_request(&req),
        "POST" => handle_post_request(&req),
        "PUT" => handle_put_request(&req),
        "DELETE" => handle_delete_request(&req),
        "OPTIONS" => handle_options_request(),
        _ => create_error_response(405, "Method not allowed"),
    }
}

/// Parse query parameters from URL
pub fn parse_query_params(url: &str) -> std::collections::HashMap<String, String> {
    let mut params = std::collections::HashMap::new();
    
    if let Some(query_start) = url.find('?') {
        let query_string = &url[query_start + 1..];
        for pair in query_string.split('&') {
            if let Some(eq_pos) = pair.find('=') {
                let key = pair[..eq_pos].to_string();
                let value = pair[eq_pos + 1..].to_string();
                params.insert(key, value);
            }
        }
    }
    
    params
}

/// Parse JSON request body
pub fn parse_json_body<T>(body: &[u8]) -> Result<T, String> 
where 
    T: for<'de> serde::Deserialize<'de>,
{
    let body_str = std::str::from_utf8(body)
        .map_err(|_| "Invalid UTF-8 in request body".to_string())?;
    
    serde_json::from_str(body_str)
        .map_err(|e| format!("Invalid JSON: {}", e))
}

/// Handle GET requests
fn handle_get_request(req: &HttpRequest) -> HttpResponse {
    let path_segments: Vec<&str> = req.url.split('/').filter(|s| !s.is_empty()).collect();
    
    match path_segments.get(0) {
        Some(&"api") => handle_api_request("GET", &path_segments[1..], req),
        Some(&"health") => create_json_response(200, r#"{"status": "healthy", "canister": "tenant"}"#),
        Some(&"") | None => redirect_to_frontend(),
        _ => redirect_to_frontend(),
    }
}

/// Handle POST requests
fn handle_post_request(req: &HttpRequest) -> HttpResponse {
    let path_segments: Vec<&str> = req.url.split('/').filter(|s| !s.is_empty()).collect();
    
    match path_segments.get(0) {
        Some(&"api") => {
            // Check authentication for write operations
            if !is_authenticated(req) {
                return create_error_response(401, "Authentication required");
            }
            handle_api_request("POST", &path_segments[1..], req)
        },
        _ => create_error_response(404, "Not found"),
    }
}

/// Handle PUT requests
fn handle_put_request(req: &HttpRequest) -> HttpResponse {
    let path_segments: Vec<&str> = req.url.split('/').filter(|s| !s.is_empty()).collect();
    
    match path_segments.get(0) {
        Some(&"api") => {
            // Check authentication for write operations
            if !is_authenticated(req) {
                return create_error_response(401, "Authentication required");
            }
            handle_api_request("PUT", &path_segments[1..], req)
        },
        _ => create_error_response(404, "Not found"),
    }
}

/// Handle DELETE requests
fn handle_delete_request(req: &HttpRequest) -> HttpResponse {
    let path_segments: Vec<&str> = req.url.split('/').filter(|s| !s.is_empty()).collect();
    
    match path_segments.get(0) {
        Some(&"api") => {
            // Check authentication for write operations
            if !is_authenticated(req) {
                return create_error_response(401, "Authentication required");
            }
            handle_api_request("DELETE", &path_segments[1..], req)
        },
        _ => create_error_response(404, "Not found"),
    }
}

/// Handle OPTIONS requests (CORS preflight)
fn handle_options_request() -> HttpResponse {
    HttpResponse {
        status_code: 200,
        headers: vec![
            HttpHeader {
                name: "Access-Control-Allow-Origin".to_string(),
                value: "*".to_string(),
            },
            HttpHeader {
                name: "Access-Control-Allow-Methods".to_string(),
                value: "GET, POST, PUT, DELETE, OPTIONS".to_string(),
            },
            HttpHeader {
                name: "Access-Control-Allow-Headers".to_string(),
                value: "Content-Type, X-Tenant-ID, Authorization".to_string(),
            },
            HttpHeader {
                name: "Access-Control-Max-Age".to_string(),
                value: "86400".to_string(),
            },
        ],
        body: vec![],
        streaming_strategy: None,
        upgrade: Some(false),
    }
}
