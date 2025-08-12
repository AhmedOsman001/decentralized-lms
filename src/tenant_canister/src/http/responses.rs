use super::types::{HttpResponse, HttpHeader};

/// Create JSON response with proper headers
pub fn create_json_response(status_code: u16, json: &str) -> HttpResponse {
    HttpResponse {
        status_code,
        headers: vec![
            HttpHeader {
                name: "Content-Type".to_string(),
                value: "application/json".to_string(),
            },
            HttpHeader {
                name: "Access-Control-Allow-Origin".to_string(),
                value: "*".to_string(),
            },
            HttpHeader {
                name: "Access-Control-Allow-Headers".to_string(),
                value: "Content-Type, X-Tenant-ID, Authorization".to_string(),
            },
            HttpHeader {
                name: "Cache-Control".to_string(),
                value: "no-cache".to_string(),
            },
        ],
        body: json.as_bytes().to_vec(),
        streaming_strategy: None,
        upgrade: Some(false),
    }
}

/// Create structured error response
pub fn create_error_response(status_code: u16, message: &str) -> HttpResponse {
    let body = serde_json::json!({
        "error": message,
        "status": status_code,
        "timestamp": shared::utils::current_time()
    });
    
    HttpResponse {
        status_code,
        headers: vec![
            HttpHeader {
                name: "Content-Type".to_string(),
                value: "application/json".to_string(),
            },
            HttpHeader {
                name: "Access-Control-Allow-Origin".to_string(),
                value: "*".to_string(),
            },
            HttpHeader {
                name: "Access-Control-Allow-Headers".to_string(),
                value: "Content-Type, X-Tenant-ID, Authorization".to_string(),
            },
        ],
        body: body.to_string().into_bytes(),
        streaming_strategy: None,
        upgrade: Some(false),
    }
}
