// Pre-provisioning system for university user authentication
// Allows importing university records and linking with Internet Identity

use candid::CandidType;
use serde::{Deserialize, Serialize};

#[cfg(feature = "stable-storage")]
use ic_stable_structures::Storable;
#[cfg(feature = "stable-storage")]
use std::borrow::Cow;

use crate::{UserRole, LMSResult, LMSError};

/// Pre-provisioned user record (before II linking)
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct PreProvisionedUser {
    pub university_id: String,        // Student/Staff ID from university system
    pub email: String,                // University email address
    pub name: String,                 // Full name
    pub role: UserRole,               // Assigned role in the system
    pub department: Option<String>,   // Department/Faculty
    pub year_of_study: Option<u32>,   // For students
    pub course_codes: Vec<String>,    // Pre-enrolled course codes
    pub created_at: u64,              // When record was imported
    pub ii_principal: Option<String>, // Internet Identity principal (set after linking)
    pub is_verified: bool,            // Whether email verification completed
    pub verification_code: Option<String>, // OTP code for verification
    pub verification_expires: Option<u64>, // OTP expiration time
    pub status: PreProvisionStatus,   // Current status of the record
}

/// Status of a pre-provisioned user
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub enum PreProvisionStatus {
    Imported,      // Just imported from university system
    PendingVerification, // Verification email sent
    Verified,      // Email verified, waiting for II linking
    Linked,        // Successfully linked with II principal
    Expired,       // Verification expired, needs re-verification
}

/// University import record for bulk operations
#[derive(CandidType, Deserialize, Serialize, Debug, Clone)]
pub struct UniversityImportRecord {
    pub university_id: String,
    pub email: String,
    pub name: String,
    pub role: String,          // Role as string (will be parsed)
    pub department: Option<String>,
    pub year_of_study: Option<u32>,
    pub course_codes: String,  // Comma-separated course codes
}

/// Email verification request
#[derive(CandidType, Deserialize, Serialize, Debug, Clone)]
pub struct EmailVerificationRequest {
    pub university_id: String,
    pub email: String,
    pub verification_code: String,
}

/// II linking request after email verification
#[derive(CandidType, Deserialize, Serialize, Debug, Clone)]
pub struct IILinkingRequest {
    pub university_id: String,
    pub email: String,
    pub verification_code: String, // Final verification before linking
}

/// Import statistics
#[derive(CandidType, Deserialize, Serialize, Debug, Clone)]
pub struct ImportStats {
    pub total_imported: u32,
    pub students_imported: u32,
    pub staff_imported: u32,
    pub errors: Vec<String>,
    pub timestamp: u64,
}

impl PreProvisionedUser {
    /// Create a new pre-provisioned user from import record
    pub fn from_import_record(record: UniversityImportRecord, _tenant_id: &str) -> LMSResult<Self> {
        // Validate required fields
        if record.university_id.trim().is_empty() {
            return Err(LMSError::ValidationError("University ID cannot be empty".to_string()));
        }
        
        if record.email.trim().is_empty() || !record.email.contains('@') {
            return Err(LMSError::ValidationError("Valid email is required".to_string()));
        }
        
        if record.name.trim().is_empty() {
            return Err(LMSError::ValidationError("Name cannot be empty".to_string()));
        }
        
        // Parse role
        let role = match record.role.to_lowercase().as_str() {
            "student" => UserRole::Student,
            "instructor" | "faculty" | "teacher" => UserRole::Instructor,
            "admin" | "administrator" => UserRole::Admin,
            "tenant_admin" | "tenantadmin" => UserRole::TenantAdmin,
            _ => return Err(LMSError::ValidationError(format!("Invalid role: {}", record.role))),
        };
        
        // Parse course codes
        let course_codes: Vec<String> = record.course_codes
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
        
        let current_time = crate::utils::current_time();
        
        Ok(PreProvisionedUser {
            university_id: record.university_id.trim().to_string(),
            email: record.email.trim().to_lowercase(),
            name: record.name.trim().to_string(),
            role,
            department: record.department.map(|d| d.trim().to_string()),
            year_of_study: record.year_of_study,
            course_codes,
            created_at: current_time,
            ii_principal: None,
            is_verified: false,
            verification_code: None,
            verification_expires: None,
            status: PreProvisionStatus::Imported,
        })
    }
    
    /// Generate verification code for email verification
    pub fn generate_verification_code(&mut self) -> String {
        use crate::utils::generate_random_string;
        
        let code = generate_random_string(6); // 6-digit code
        let expires_at = crate::utils::current_time() + (60 * 60 * 1_000_000_000); // 1 hour in nanoseconds
        
        self.verification_code = Some(code.clone());
        self.verification_expires = Some(expires_at);
        self.status = PreProvisionStatus::PendingVerification;
        
        code
    }
    
    /// Verify the provided code
    pub fn verify_code(&mut self, provided_code: &str) -> LMSResult<()> {
        match (&self.verification_code, self.verification_expires) {
            (Some(stored_code), Some(expires_at)) => {
                let current_time = crate::utils::current_time();
                ic_cdk::println!("Current Time: {} and {}", current_time,expires_at );
                if current_time > expires_at {
                    self.status = PreProvisionStatus::Expired;
                    return Err(LMSError::ValidationError("Verification code has expired".to_string()));
                }
                
                if stored_code == provided_code {
                    self.is_verified = true;
                    self.status = PreProvisionStatus::Verified;
                    self.verification_code = None; // Clear the code after successful verification
                    self.verification_expires = None;
                    Ok(())
                } else {
                    Err(LMSError::ValidationError("Invalid verification code".to_string()))
                }
            }
            _ => Err(LMSError::ValidationError("No verification code found".to_string())),
        }
    }
    
    /// Link with Internet Identity principal
    pub fn link_ii_principal(&mut self, principal: String) -> LMSResult<()> {
        if !self.is_verified {
            return Err(LMSError::ValidationError("Email must be verified before linking II principal".to_string()));
        }
        
        if self.ii_principal.is_some() {
            return Err(LMSError::ValidationError("II principal already linked".to_string()));
        }
        
        self.ii_principal = Some(principal);
        self.status = PreProvisionStatus::Linked;
        
        Ok(())
    }
    
    /// Check if ready for conversion to full User
    pub fn is_ready_for_activation(&self) -> bool {
        self.is_verified && 
        self.ii_principal.is_some() && 
        matches!(self.status, PreProvisionStatus::Linked)
    }
    
    /// Convert to full User record
    pub fn to_user(&self, tenant_id: &str) -> LMSResult<crate::User> {
        if !self.is_ready_for_activation() {
            return Err(LMSError::ValidationError("User not ready for activation".to_string()));
        }
        
        let principal = self.ii_principal.as_ref()
            .ok_or_else(|| LMSError::ValidationError("II principal not set".to_string()))?;
        
        let current_time = crate::utils::current_time();
        
        Ok(crate::User {
            id: principal.clone(),
            name: self.name.clone(),
            email: self.email.clone(),
            role: self.role.clone(),
            tenant_id: tenant_id.to_string(),
            created_at: current_time,
            updated_at: current_time,
            is_active: true,
        })
    }
}

#[cfg(feature = "stable-storage")]
impl Storable for PreProvisionedUser {
    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;

    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_pre_provisioned_user_creation() {
        let record = UniversityImportRecord {
            university_id: "STU001".to_string(),
            email: "student@university.edu".to_string(),
            name: "John Doe".to_string(),
            role: "student".to_string(),
            department: Some("Computer Science".to_string()),
            year_of_study: Some(2),
            course_codes: "CS101,CS102,MATH201".to_string(),
        };
        
        let user = PreProvisionedUser::from_import_record(record, "tenant1").unwrap();
        
        assert_eq!(user.university_id, "STU001");
        assert_eq!(user.email, "student@university.edu");
        assert_eq!(user.role, UserRole::Student);
        assert_eq!(user.course_codes, vec!["CS101", "CS102", "MATH201"]);
        assert_eq!(user.status, PreProvisionStatus::Imported);
        assert!(!user.is_verified);
    }
    
    #[test]
    fn test_verification_flow() {
        let record = UniversityImportRecord {
            university_id: "STU001".to_string(),
            email: "student@university.edu".to_string(),
            name: "John Doe".to_string(),
            role: "student".to_string(),
            department: None,
            year_of_study: None,
            course_codes: "".to_string(),
        };
        
        let mut user = PreProvisionedUser::from_import_record(record, "tenant1").unwrap();
        
        // Generate verification code
        let code = user.generate_verification_code();
        assert_eq!(code.len(), 6);
        assert_eq!(user.status, PreProvisionStatus::PendingVerification);
        
        // Verify with correct code
        assert!(user.verify_code(&code).is_ok());
        assert!(user.is_verified);
        assert_eq!(user.status, PreProvisionStatus::Verified);
        
        // Link II principal
        assert!(user.link_ii_principal("test_principal".to_string()).is_ok());
        assert_eq!(user.status, PreProvisionStatus::Linked);
        assert!(user.is_ready_for_activation());
    }
}
