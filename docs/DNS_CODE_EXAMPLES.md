# DNS Configuration Code Examples

This file contains practical code examples for implementing DNS-based subdomain routing in the Decentralized LMS.

## Frontend Implementation

### 1. Complete Tenant Detection Service

```typescript
// src/services/TenantService.ts
export interface TenantInfo {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'suspended' | 'maintenance';
  logo?: string;
  primaryColor?: string;
  contactEmail?: string;
}

export class TenantService {
  private static instance: TenantService;
  private tenantCache = new Map<string, TenantInfo>();
  
  static getInstance(): TenantService {
    if (!TenantService.instance) {
      TenantService.instance = new TenantService();
    }
    return TenantService.instance;
  }
  
  /**
   * Extract tenant ID from current hostname
   */
  extractTenantId(): string | null {
    const hostname = window.location.hostname;
    
    // Production: subdomain.lms.app
    if (hostname.includes('.lms.app')) {
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        const subdomain = parts[0];
        return this.isValidTenantId(subdomain) ? subdomain : null;
      }
    }
    
    // Development: localhost with query param
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      const urlParams = new URLSearchParams(window.location.search);
      const tenant = urlParams.get('tenant');
      return tenant && this.isValidTenantId(tenant) ? tenant : null;
    }
    
    // Custom domains (future enhancement)
    return this.handleCustomDomain(hostname);
  }
  
  /**
   * Validate tenant ID format
   */
  private isValidTenantId(tenantId: string): boolean {
    const tenantRegex = /^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$/;
    const reservedNames = ['www', 'api', 'admin', 'mail', 'ftp', 'support'];
    
    return tenantRegex.test(tenantId) && !reservedNames.includes(tenantId);
  }
  
  /**
   * Handle custom domain mapping (future feature)
   */
  private handleCustomDomain(hostname: string): string | null {
    // Future: Look up custom domain mappings
    // e.g., harvard.edu → harvard
    return null;
  }
  
  /**
   * Fetch tenant information from backend
   */
  async getTenantInfo(tenantId: string): Promise<TenantInfo | null> {
    if (this.tenantCache.has(tenantId)) {
      return this.tenantCache.get(tenantId) || null;
    }
    
    try {
      const response = await fetch(`/api/tenant/${tenantId}/info`, {
        headers: {
          'X-Tenant-ID': tenantId,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const tenantInfo: TenantInfo = await response.json();
        this.tenantCache.set(tenantId, tenantInfo);
        return tenantInfo;
      } else if (response.status === 404) {
        return null;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to fetch tenant info:', error);
      throw error;
    }
  }
  
  /**
   * Initialize tenant context
   */
  async initializeTenant(): Promise<{
    tenantId: string | null;
    tenantInfo: TenantInfo | null;
    error: string | null;
  }> {
    const tenantId = this.extractTenantId();
    
    if (!tenantId) {
      return {
        tenantId: null,
        tenantInfo: null,
        error: 'No tenant found for this domain'
      };
    }
    
    try {
      const tenantInfo = await this.getTenantInfo(tenantId);
      
      if (!tenantInfo) {
        return {
          tenantId,
          tenantInfo: null,
          error: 'Tenant not found'
        };
      }
      
      if (tenantInfo.status !== 'active') {
        return {
          tenantId,
          tenantInfo,
          error: `Tenant is ${tenantInfo.status}`
        };
      }
      
      return {
        tenantId,
        tenantInfo,
        error: null
      };
    } catch (error) {
      return {
        tenantId,
        tenantInfo: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
```

### 2. React Hook for Tenant Context

```typescript
// src/hooks/useTenant.ts
import { useState, useEffect, useContext, createContext } from 'react';
import { TenantService, TenantInfo } from '../services/TenantService';

interface TenantContextValue {
  tenantId: string | null;
  tenantInfo: TenantInfo | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    tenantId: string | null;
    tenantInfo: TenantInfo | null;
    loading: boolean;
    error: string | null;
  }>({
    tenantId: null,
    tenantInfo: null,
    loading: true,
    error: null
  });
  
  const tenantService = TenantService.getInstance();
  
  const loadTenant = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await tenantService.initializeTenant();
      setState({
        tenantId: result.tenantId,
        tenantInfo: result.tenantInfo,
        loading: false,
        error: result.error
      });
    } catch (error) {
      setState({
        tenantId: null,
        tenantInfo: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load tenant'
      });
    }
  };
  
  useEffect(() => {
    loadTenant();
  }, []);
  
  return (
    <TenantContext.Provider value={{
      ...state,
      reload: loadTenant
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
```

### 3. Error Boundary Components

```typescript
// src/components/TenantErrorBoundary.tsx
import React from 'react';
import { useTenant } from '../hooks/useTenant';

interface TenantErrorPageProps {
  error: string;
  tenantId?: string;
  tenantInfo?: any;
}

export function TenantErrorPage({ error, tenantId, tenantInfo }: TenantErrorPageProps) {
  const handleGoToMainSite = () => {
    window.location.href = 'https://lms.app';
  };
  
  const handleRetry = () => {
    window.location.reload();
  };
  
  if (error === 'Tenant not found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-6 p-6">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              Institution Not Found
            </h1>
            <p className="mt-2 text-gray-600">
              The educational institution "{tenantId}" is not configured in our system.
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleGoToMainSite}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Main Site
            </button>
            
            <div className="text-center text-sm text-gray-500">
              Need help? Contact{' '}
              <a href="mailto:support@lms.app" className="text-blue-600 hover:text-blue-500">
                support@lms.app
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error === 'Tenant is suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-6 p-6">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-yellow-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              Service Suspended
            </h1>
            <p className="mt-2 text-gray-600">
              Access to {tenantInfo?.name || tenantId} has been temporarily suspended.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="text-center text-sm text-gray-500">
              Contact your institution administrator or{' '}
              <a 
                href={`mailto:${tenantInfo?.contactEmail || 'support@lms.app'}`}
                className="text-blue-600 hover:text-blue-500"
              >
                {tenantInfo?.contactEmail || 'support@lms.app'}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error === 'Tenant is maintenance') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-6 p-6">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-blue-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              Under Maintenance
            </h1>
            <p className="mt-2 text-gray-600">
              {tenantInfo?.name || tenantId} is currently undergoing maintenance.
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
            
            <div className="text-center text-sm text-gray-500">
              We'll be back soon. Please check again in a few minutes.
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Generic error
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-6 p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-gray-600">
            {error}
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
          
          <button
            onClick={handleGoToMainSite}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Main Site
          </button>
        </div>
      </div>
    </div>
  );
}

export function TenantWrapper({ children }: { children: React.ReactNode }) {
  const { tenantId, tenantInfo, loading, error } = useTenant();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (error) {
    return <TenantErrorPage error={error} tenantId={tenantId || undefined} tenantInfo={tenantInfo} />;
  }
  
  return <>{children}</>;
}
```

## Backend Implementation

### 4. Router Canister HTTP Request Handler

```rust
// src/router_canister/src/http.rs
use ic_cdk::api::management_canister::http_request::{
    HttpHeader, HttpRequest, HttpResponse, HttpMethod
};
use crate::routing::{get_tenant_route, TenantStatus};
use crate::types::{LMSError, LMSResult};

#[derive(Debug)]
struct RequestContext {
    tenant_id: Option<String>,
    method: HttpMethod,
    path: String,
    headers: Vec<HttpHeader>,
    body: Vec<u8>,
    client_ip: Option<String>,
    user_agent: Option<String>,
}

impl RequestContext {
    fn from_request(request: HttpRequest) -> Self {
        let tenant_id = extract_tenant_from_request(&request);
        let client_ip = extract_client_ip(&request);
        let user_agent = find_header(&request.headers, "user-agent");
        
        Self {
            tenant_id,
            method: request.method,
            path: request.url,
            headers: request.headers,
            body: request.body,
            client_ip,
            user_agent,
        }
    }
}

#[query]
pub fn http_request(request: HttpRequest) -> HttpResponse {
    let start_time = ic_cdk::api::time();
    let context = RequestContext::from_request(request);
    
    ic_cdk::println!(
        "HTTP Request: {} {} from {} (tenant: {:?})",
        format!("{:?}", context.method),
        context.path,
        context.client_ip.as_deref().unwrap_or("unknown"),
        context.tenant_id
    );
    
    let response = match context.tenant_id {
        Some(tenant_id) => {
            if context.path.starts_with("/api/") {
                handle_api_request(tenant_id, context)
            } else {
                handle_app_request(tenant_id, context)
            }
        }
        None => handle_no_tenant_request(context)
    };
    
    let end_time = ic_cdk::api::time();
    let duration_ms = (end_time - start_time) / 1_000_000;
    
    ic_cdk::println!(
        "HTTP Response: {} ({}ms)",
        response.status_code,
        duration_ms
    );
    
    response
}

fn extract_tenant_from_request(request: &HttpRequest) -> Option<String> {
    // Method 1: Host header analysis
    if let Some(host) = find_header(&request.headers, "host") {
        if let Some(tenant) = extract_tenant_from_host(&host) {
            return Some(tenant);
        }
    }
    
    // Method 2: X-Tenant-ID header
    if let Some(tenant_header) = find_header(&request.headers, "x-tenant-id") {
        if !tenant_header.is_empty() && is_valid_tenant_name(&tenant_header) {
            return Some(tenant_header);
        }
    }
    
    // Method 3: URL path prefix
    extract_tenant_from_path(&request.url)
}

fn extract_tenant_from_host(host: &str) -> Option<String> {
    // Remove port if present
    let host = host.split(':').next()?;
    let parts: Vec<&str> = host.split('.').collect();
    
    // Check for subdomain.lms.app pattern
    if parts.len() >= 3 && parts[1] == "lms" && parts[2] == "app" {
        let subdomain = parts[0];
        return if is_valid_tenant_name(subdomain) {
            Some(subdomain.to_string())
        } else {
            None
        };
    }
    
    // Check for custom domains (future feature)
    lookup_custom_domain(host)
}

fn extract_tenant_from_path(url: &str) -> Option<String> {
    // Handle URLs like /tenant/harvard/api/users
    if url.starts_with("/tenant/") {
        let parts: Vec<&str> = url.split('/').collect();
        if parts.len() >= 3 {
            let tenant = parts[2];
            return if is_valid_tenant_name(tenant) {
                Some(tenant.to_string())
            } else {
                None
            };
        }
    }
    None
}

fn is_valid_tenant_name(name: &str) -> bool {
    // Validate tenant name format
    if name.len() < 2 || name.len() > 50 {
        return false;
    }
    
    // Only alphanumeric and hyphens, but not starting/ending with hyphen
    if !name.chars().all(|c| c.is_alphanumeric() || c == '-') {
        return false;
    }
    
    if name.starts_with('-') || name.ends_with('-') {
        return false;
    }
    
    // Reserved subdomains
    const RESERVED: &[&str] = &[
        "www", "api", "admin", "mail", "ftp", "support", 
        "help", "docs", "blog", "status", "app"
    ];
    
    !RESERVED.contains(&name)
}

fn lookup_custom_domain(domain: &str) -> Option<String> {
    // Future: Implement custom domain to tenant mapping
    // For now, return None
    None
}

fn handle_api_request(tenant_id: String, context: RequestContext) -> HttpResponse {
    // Route API requests to tenant canister
    ic_cdk::spawn(async move {
        route_to_tenant_async(tenant_id, context).await
    });
    
    // Return a placeholder response for now
    create_response(200, "Processing...", vec![])
}

async fn route_to_tenant_async(tenant_id: String, context: RequestContext) -> HttpResponse {
    match get_tenant_route(&tenant_id).await {
        Ok(route) => {
            match route.status {
                TenantStatus::Active => {
                    forward_to_tenant(route.canister_id, context).await
                }
                TenantStatus::Suspended => {
                    create_error_response(503, "Tenant suspended", Some(&tenant_id))
                }
                TenantStatus::Maintenance => {
                    create_error_response(503, "Tenant under maintenance", Some(&tenant_id))
                }
            }
        }
        Err(LMSError::NotFound(_)) => {
            create_error_response(404, "Tenant not found", Some(&tenant_id))
        }
        Err(_) => {
            create_error_response(500, "Internal server error", Some(&tenant_id))
        }
    }
}

async fn forward_to_tenant(
    canister_id: Principal, 
    context: RequestContext
) -> HttpResponse {
    let request = HttpRequest {
        method: context.method,
        url: context.path,
        headers: context.headers,
        body: context.body,
    };
    
    match ic_cdk::call(canister_id, "http_request", (request,)).await {
        Ok((response,)): Result<(HttpResponse,), _> => response,
        Err(_) => create_error_response(502, "Tenant service unavailable", None)
    }
}

fn handle_app_request(tenant_id: String, context: RequestContext) -> HttpResponse {
    // Serve the main application with tenant context
    let html = generate_tenant_html(&tenant_id);
    create_html_response(html)
}

fn handle_no_tenant_request(context: RequestContext) -> HttpResponse {
    if context.path == "/" || context.path.is_empty() {
        // Serve main landing page
        let html = include_str!("../assets/landing.html");
        create_html_response(html.to_string())
    } else {
        // No tenant found for subdomain
        create_error_response(404, "Tenant not found for this domain", None)
    }
}

fn generate_tenant_html(tenant_id: &str) -> String {
    format!(r#"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LMS - {}</title>
    <script>
        window.TENANT_ID = "{}";
        window.LMS_CONFIG = {{
            tenantId: "{}",
            apiBaseUrl: "/api",
            environment: "production"
        }};
    </script>
    <link rel="stylesheet" href="/assets/app.css">
</head>
<body>
    <div id="root"></div>
    <script src="/assets/app.js"></script>
</body>
</html>
    "#, tenant_id, tenant_id, tenant_id)
}

fn create_html_response(html: String) -> HttpResponse {
    HttpResponse {
        status_code: 200,
        headers: vec![
            HttpHeader {
                name: "Content-Type".to_string(),
                value: "text/html; charset=utf-8".to_string(),
            },
            HttpHeader {
                name: "Cache-Control".to_string(),
                value: "public, max-age=3600".to_string(),
            }
        ],
        body: html.into_bytes(),
    }
}

fn create_error_response(
    status_code: u16, 
    message: &str, 
    tenant_id: Option<&str>
) -> HttpResponse {
    let error_body = serde_json::json!({
        "error": message,
        "status": status_code,
        "tenant_id": tenant_id,
        "timestamp": ic_cdk::api::time() / 1_000_000_000,
        "support_email": "support@lms.app"
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
            }
        ],
        body: error_body.to_string().into_bytes(),
    }
}

fn create_response(status_code: u16, body: &str, headers: Vec<HttpHeader>) -> HttpResponse {
    let mut response_headers = vec![
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "text/plain".to_string(),
        }
    ];
    response_headers.extend(headers);
    
    HttpResponse {
        status_code,
        headers: response_headers,
        body: body.as_bytes().to_vec(),
    }
}

fn find_header(headers: &[HttpHeader], name: &str) -> Option<String> {
    headers.iter()
        .find(|h| h.name.to_lowercase() == name.to_lowercase())
        .map(|h| h.value.clone())
}

fn extract_client_ip(request: &HttpRequest) -> Option<String> {
    // Try X-Forwarded-For first
    if let Some(xff) = find_header(&request.headers, "x-forwarded-for") {
        if let Some(ip) = xff.split(',').next() {
            return Some(ip.trim().to_string());
        }
    }
    
    // Try X-Real-IP
    if let Some(real_ip) = find_header(&request.headers, "x-real-ip") {
        return Some(real_ip);
    }
    
    None
}
```

This comprehensive code example demonstrates the complete implementation of DNS-based subdomain routing for the Decentralized LMS, covering both frontend tenant detection and backend request routing.
