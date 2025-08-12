// HTTP Module - Provides HTTP request handling and routing
// This module organizes HTTP-related functionality for the tenant canister

pub mod handlers;
pub mod routing;
pub mod responses;
pub mod types;
pub mod auth;

// Re-export the main HTTP functions for backward compatibility
pub use routing::http_request;
pub use types::{HttpRequest, HttpResponse};
