use candid::CandidType;
use serde::{Deserialize, Serialize};

#[cfg(feature = "stable-storage")]
use ic_stable_structures::Storable;
#[cfg(feature = "stable-storage")]
use std::borrow::Cow;

/// User representation shared across canisters
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: UserRole,
    pub tenant_id: String,
    pub created_at: u64,
    pub updated_at: u64,
    pub is_active: bool,
}

/// User roles in the LMS system
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub enum UserRole {
    Student,
    Instructor,
    Admin,
    TenantAdmin,
}

impl Default for UserRole {
    fn default() -> Self {
        UserRole::Student
    }
}

/// Role hierarchy and permissions implementation
impl UserRole {
    /// Get role hierarchy level (higher number = more permissions)
    pub fn hierarchy_level(&self) -> u8 {
        match self {
            UserRole::Student => 1,
            UserRole::Instructor => 2,
            UserRole::Admin => 3,
            UserRole::TenantAdmin => 4,
        }
    }
    
    /// Check if this role has equal or higher permissions than another role
    pub fn has_permission_level(&self, required_role: &UserRole) -> bool {
        self.hierarchy_level() >= required_role.hierarchy_level()
    }
    
    /// Course management permissions
    pub fn can_create_course(&self) -> bool {
        matches!(self, UserRole::Instructor | UserRole::Admin | UserRole::TenantAdmin)
    }
    
    pub fn can_edit_course(&self, is_course_owner: bool) -> bool {
        match self {
            UserRole::TenantAdmin | UserRole::Admin => true,
            UserRole::Instructor => is_course_owner,
            UserRole::Student => false,
        }
    }
    
    pub fn can_delete_course(&self, is_course_owner: bool) -> bool {
        match self {
            UserRole::TenantAdmin | UserRole::Admin => true,
            UserRole::Instructor => is_course_owner,
            UserRole::Student => false,
        }
    }
    
    /// User management permissions
    pub fn can_manage_users(&self) -> bool {
        matches!(self, UserRole::Admin | UserRole::TenantAdmin)
    }
    
    pub fn can_view_all_users(&self) -> bool {
        matches!(self, UserRole::Instructor | UserRole::Admin | UserRole::TenantAdmin)
    }
    
    pub fn can_assign_role(&self, target_role: &UserRole) -> bool {
        match self {
            UserRole::TenantAdmin => true,
            UserRole::Admin => !matches!(target_role, UserRole::TenantAdmin),
            _ => false,
        }
    }
    
    /// Grading permissions
    pub fn can_grade(&self) -> bool {
        matches!(self, UserRole::Instructor | UserRole::Admin | UserRole::TenantAdmin)
    }
    
    pub fn can_view_all_grades(&self) -> bool {
        matches!(self, UserRole::Admin | UserRole::TenantAdmin)
    }
    
    /// System administration permissions
    pub fn can_manage_tenant_settings(&self) -> bool {
        matches!(self, UserRole::TenantAdmin)
    }
    
    pub fn can_export_data(&self) -> bool {
        matches!(self, UserRole::Admin | UserRole::TenantAdmin)
    }
    
    /// Get role name as string
    pub fn as_str(&self) -> &str {
        match self {
            UserRole::Student => "Student",
            UserRole::Instructor => "Instructor", 
            UserRole::Admin => "Admin",
            UserRole::TenantAdmin => "TenantAdmin",
        }
    }
}

/// Tenant (University) representation
#[derive(Debug, Clone, PartialEq, CandidType, Serialize, Deserialize)]
pub struct Tenant {
    pub id: String,
    pub name: String,
    pub subdomain: String,
    pub canister_id: String,
    pub admin_ids: Vec<String>,
    pub created_at: u64,
    #[serde(default = "default_updated_at")]
    pub updated_at: u64,
    pub is_active: bool,
    #[serde(default)]
    pub settings: TenantSettings,
}

fn default_updated_at() -> u64 {
    crate::utils::current_time()
}

#[derive(Debug, Clone, PartialEq, CandidType, Serialize, Deserialize)]
pub struct TenantSettings {
    pub max_students: u32,
    pub max_instructors: u32,
    pub max_courses: u32,
    pub allow_public_enrollment: bool,
    pub custom_branding: bool,
}

impl Default for TenantSettings {
    fn default() -> Self {
        Self {
            max_students: 1000,
            max_instructors: 100,
            max_courses: 500,
            allow_public_enrollment: false,
            custom_branding: false,
        }
    }
}

// Stable storage implementations
#[cfg(feature = "stable-storage")]
impl Storable for User {
    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
    
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

#[cfg(feature = "stable-storage")]
impl Storable for Tenant {
    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
    
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        // Try to decode with new format first
        if let Ok(tenant) = candid::decode_one::<Tenant>(&bytes) {
            return tenant;
        }
        
        // If that fails, try to decode with old format and migrate
        #[derive(CandidType, Deserialize)]
        struct OldTenant {
            id: String,
            name: String,
            domain: String,
            canister_id: candid::Principal,
            admin_principal: candid::Principal,
            created_at: u64,
            is_active: bool,
        }
        
        if let Ok(old_tenant) = candid::decode_one::<OldTenant>(&bytes) {
            // Migrate old format to new format
            return Tenant {
                id: old_tenant.id,
                name: old_tenant.name,
                subdomain: old_tenant.domain.split('.').next().unwrap_or(&old_tenant.domain).to_string(),
                canister_id: old_tenant.canister_id.to_string(),
                admin_ids: vec![old_tenant.admin_principal.to_string()],
                created_at: old_tenant.created_at,
                updated_at: old_tenant.created_at,
                is_active: old_tenant.is_active,
                settings: TenantSettings::default(),
            };
        }
        
        // If both fail, try another potential old format (already with String canister_id)
        #[derive(CandidType, Deserialize)]
        struct OldTenant2 {
            id: String,
            name: String,
            subdomain: String,
            canister_id: String,
            admin_ids: Vec<String>,
            created_at: u64,
            is_active: bool,
        }
        
        if let Ok(old_tenant2) = candid::decode_one::<OldTenant2>(&bytes) {
            return Tenant {
                id: old_tenant2.id,
                name: old_tenant2.name,
                subdomain: old_tenant2.subdomain,
                canister_id: old_tenant2.canister_id,
                admin_ids: old_tenant2.admin_ids,
                created_at: old_tenant2.created_at,
                updated_at: old_tenant2.created_at,
                is_active: old_tenant2.is_active,
                settings: TenantSettings::default(),
            };
        }
        
        panic!("Failed to decode Tenant from stored bytes");
    }
}
