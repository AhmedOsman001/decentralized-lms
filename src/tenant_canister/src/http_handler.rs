// HTTP Handler - Re-export module
// This module provides backward compatibility for the refactored HTTP handling system

pub use crate::http::{
    http_request,
    HttpRequest, HttpResponse,
};
