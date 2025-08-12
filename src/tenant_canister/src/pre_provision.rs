// Pre-provisioning Management Module
// Handles university data import and II linking for authentication

use ic_cdk::{caller, query, update};
use std::collections::HashMap;
use shared::{
    PreProvisionedUser, PreProvisionStatus, UniversityImportRecord,
    EmailVerificationRequest, ImportStats,
    User, UserRole, LMSResult, LMSError, utils
};
use crate::storage::{PRE_PROVISIONED_USERS, USERS, COURSES, get_tenant_id};
use crate::rbac::require_admin;

/// Import university records in bulk
#[update]
pub fn import_university_records(records: Vec<UniversityImportRecord>) -> LMSResult<ImportStats> {
    // Only admins can import records
    require_admin()?;
    
    let tenant_id = get_tenant_id()?;
    
    let mut stats = ImportStats {
        total_imported: 0,
        students_imported: 0,
        staff_imported: 0,
        errors: Vec::new(),
        timestamp: utils::current_time(),
    };
    
    PRE_PROVISIONED_USERS.with(|users| {
        let mut users_map = users.borrow_mut();
        
        for (index, mut record) in records.into_iter().enumerate() {
            // Auto-generate university_id based on tenant and record type
            if record.university_id.is_empty() {
                let role_prefix = match record.role.to_lowercase().as_str() {
                    "student" => "STU",
                    "instructor" | "faculty" | "teacher" => "FAC",
                    "admin" | "administrator" => "ADM",
                    _ => "USR",
                };
                record.university_id = format!("{}_{}{:03}", tenant_id, role_prefix, index + 1);
            }
            
            match PreProvisionedUser::from_import_record(record.clone(), &tenant_id) {
                Ok(user) => {
                    // Check for duplicates
                    if users_map.contains_key(&user.university_id) {
                        stats.errors.push(format!("Duplicate university ID: {}", user.university_id));
                        continue;
                    }
                    
                    // Check for existing email
                    let email_exists = users_map.iter().any(|(_, existing_user)| {
                        existing_user.email == user.email
                    });
                    
                    if email_exists {
                        stats.errors.push(format!("Email already exists: {}", user.email));
                        continue;
                    }
                    
                    // Count by role
                    match user.role {
                        UserRole::Student => stats.students_imported += 1,
                        _ => stats.staff_imported += 1,
                    }
                    
                    stats.total_imported += 1;
                    users_map.insert(user.university_id.clone(), user);
                    
                    ic_cdk::println!("Imported pre-provisioned user: {}", record.university_id);
                }
                Err(e) => {
                    stats.errors.push(format!("Failed to import {}: {}", record.university_id, e));
                }
            }
        }
    });
    
    ic_cdk::println!("Import completed: {} users imported, {} errors", stats.total_imported, stats.errors.len());
    Ok(stats)
}

/// Import single university record
#[update]
pub fn import_single_record(mut record: UniversityImportRecord) -> LMSResult<String> {
    require_admin()?;
    
    let tenant_id = get_tenant_id()?;
    
    // Auto-generate university_id if empty
    if record.university_id.is_empty() {
        let role_prefix = match record.role.to_lowercase().as_str() {
            "student" => "STU",
            "instructor" | "faculty" | "teacher" => "FAC", 
            "admin" | "administrator" => "ADM",
            _ => "USR",
        };
        let timestamp = utils::current_time();
        record.university_id = format!("{}_{}{}", tenant_id, role_prefix, timestamp % 10000);
    }
    
    let user = PreProvisionedUser::from_import_record(record.clone(), &tenant_id)?;
    
    PRE_PROVISIONED_USERS.with(|users| {
        let mut users_map = users.borrow_mut();
        
        if users_map.contains_key(&user.university_id) {
            return Err(LMSError::ValidationError(format!("University ID already exists: {}", user.university_id)));
        }
        
        let university_id = user.university_id.clone();
        users_map.insert(university_id.clone(), user);
        Ok(format!("Successfully imported user: {} (ID: {})", record.name, university_id))
    })
}

/// Simplified import function for basic user data (auto-generates university_id)
#[update]
pub fn import_user_simple(
    email: String,
    name: String,
    role: String,
    department: Option<String>,
    year_of_study: Option<u32>,
    course_codes: String
) -> LMSResult<String> {
    let record = UniversityImportRecord {
        university_id: String::new(), // Will be auto-generated
        email,
        name,
        role,
        department,
        year_of_study,
        course_codes,
    };
    
    import_single_record(record)
}

/// Get list of pre-provisioned users (admin only)
#[query]
pub fn list_pre_provisioned_users() -> LMSResult<Vec<PreProvisionedUser>> {
    require_admin()?;
    
    PRE_PROVISIONED_USERS.with(|users| {
        Ok(users.borrow().iter().map(|(_, user)| user).collect())
    })
}

/// Get pre-provisioned user by university ID (admin only)
#[query]
pub fn get_pre_provisioned_user(university_id: String) -> LMSResult<PreProvisionedUser> {
    require_admin()?;
    
    PRE_PROVISIONED_USERS.with(|users| {
        match users.borrow().get(&university_id) {
            Some(user) => Ok(user),
            None => Err(LMSError::NotFound(format!("Pre-provisioned user not found: {}", university_id))),
        }
    })
}

/// Request email verification (public function for new users)
#[update]
pub fn request_email_verification(university_id: String, email: String) -> LMSResult<String> {
    PRE_PROVISIONED_USERS.with(|users| {
        let mut users_map = users.borrow_mut();
        
        match users_map.get(&university_id) {
            Some(mut user) => {
                // Verify email matches
                if user.email.to_lowercase() != email.to_lowercase() {
                    return Err(LMSError::ValidationError("Email does not match university records".to_string()));
                }
                
                // Check if already verified
                if user.is_verified {
                    return Err(LMSError::ValidationError("Email already verified".to_string()));
                }
                
                // Generate verification code
                let code = user.generate_verification_code();
                users_map.insert(university_id.clone(), user);
                
                ic_cdk::println!("Verification code generated for user: {}", university_id);
                
                // In production, send email here
                Ok(format!("Verification code sent to {}. Code: {} (for demo)", email, code))
            }
            None => Err(LMSError::NotFound("University ID not found in pre-provisioned records".to_string())),
        }
    })
}

/// Verify email with code (public function)
#[update]
pub fn verify_email(request: EmailVerificationRequest) -> LMSResult<String> {
    PRE_PROVISIONED_USERS.with(|users| {
        let mut users_map = users.borrow_mut();
        
        match users_map.get(&request.university_id) {
            Some(mut user) => {
                // Verify email matches
                if user.email.to_lowercase() != request.email.to_lowercase() {
                    return Err(LMSError::ValidationError("Email does not match".to_string()));
                }
                
                // Verify the code
                user.verify_code(&request.verification_code)?;
                users_map.insert(request.university_id.clone(), user);
                
                ic_cdk::println!("Email verified for user: {}", request.university_id);
                Ok("Email verified successfully. You can now link your Internet Identity.".to_string())
            }
            None => Err(LMSError::NotFound("University ID not found".to_string())),
        }
    })
}

/// Link Internet Identity principal (called after II authentication)
#[update]
pub fn link_internet_identity(university_id: String, email: String) -> LMSResult<User> {
    let caller_principal = caller().to_string();
    let tenant_id = get_tenant_id()?;
    
    // Check if this principal is already linked to a user
    USERS.with(|users| {
        if users.borrow().contains_key(&caller_principal) {
            return Err(LMSError::ValidationError("This Internet Identity is already linked to an account".to_string()));
        }
        Ok(())
    })?;
    
    PRE_PROVISIONED_USERS.with(|pre_users| {
        let mut pre_users_map = pre_users.borrow_mut();
        
        match pre_users_map.get(&university_id) {
            Some(mut pre_user) => {
                // Verify email matches
                if pre_user.email.to_lowercase() != email.to_lowercase() {
                    return Err(LMSError::ValidationError("Email does not match".to_string()));
                }
                
                // Verify email is verified
                if !pre_user.is_verified {
                    return Err(LMSError::ValidationError("Email must be verified before linking II".to_string()));
                }
                
                // Check if already linked
                if pre_user.ii_principal.is_some() {
                    return Err(LMSError::ValidationError("University ID already linked to another Internet Identity".to_string()));
                }
                
                // Link the principal
                pre_user.link_ii_principal(caller_principal.clone())?;
                
                // Convert to full user
                let user = pre_user.to_user(&tenant_id)?;
                
                // Store in users table
                USERS.with(|users| {
                    users.borrow_mut().insert(caller_principal.clone(), user.clone());
                });
                
                // Auto-enroll in pre-assigned courses
                enroll_in_pre_assigned_courses(&user, &pre_user.course_codes)?;
                
                // Update the pre-provisioned user record
                pre_users_map.insert(university_id.clone(), pre_user);
                
                ic_cdk::println!("Internet Identity linked for user: {} -> {}", university_id, caller_principal);
                Ok(user)
            }
            None => Err(LMSError::NotFound("University ID not found".to_string())),
        }
    })
}

/// Auto-enroll user in pre-assigned courses
fn enroll_in_pre_assigned_courses(user: &User, course_codes: &[String]) -> LMSResult<()> {
    if course_codes.is_empty() {
        return Ok(());
    }
    
    COURSES.with(|courses| {
        let mut courses_map = courses.borrow_mut();
        
        for course_code in course_codes {
            if let Some(mut course) = courses_map.get(course_code) {
                if !course.enrolled_students.contains(&user.id) {
                    course.enrolled_students.push(user.id.clone());
                    courses_map.insert(course_code.clone(), course);
                    ic_cdk::println!("Auto-enrolled {} in course {}", user.id, course_code);
                }
            } else {
                ic_cdk::println!("Warning: Course {} not found for auto-enrollment", course_code);
            }
        }
        
        Ok(())
    })
}

/// Check if university ID exists and is available for linking
#[query]
pub fn check_university_id(university_id: String) -> LMSResult<String> {
    PRE_PROVISIONED_USERS.with(|users| {
        match users.borrow().get(&university_id) {
            Some(user) => {
                match user.status {
                    PreProvisionStatus::Imported => Ok("Available for verification".to_string()),
                    PreProvisionStatus::PendingVerification => Ok("Verification code sent, please check email".to_string()),
                    PreProvisionStatus::Verified => Ok("Email verified, ready for Internet Identity linking".to_string()),
                    PreProvisionStatus::Linked => Err(LMSError::ValidationError("University ID already linked".to_string())),
                    PreProvisionStatus::Expired => Ok("Verification expired, please request new code".to_string()),
                }
            }
            None => Err(LMSError::NotFound("University ID not found in records".to_string())),
        }
    })
}

/// Get linking status for university ID
#[query]
pub fn get_linking_status(university_id: String) -> LMSResult<(PreProvisionStatus, bool)> {
    PRE_PROVISIONED_USERS.with(|users| {
        match users.borrow().get(&university_id) {
            Some(user) => Ok((user.status.clone(), user.is_verified)),
            None => Err(LMSError::NotFound("University ID not found".to_string())),
        }
    })
}

/// Delete pre-provisioned user (admin only)
#[update]
pub fn delete_pre_provisioned_user(university_id: String) -> LMSResult<String> {
    require_admin()?;
    
    PRE_PROVISIONED_USERS.with(|users| {
        match users.borrow_mut().remove(&university_id) {
            Some(_) => {
                ic_cdk::println!("Deleted pre-provisioned user: {}", university_id);
                Ok(format!("Pre-provisioned user {} deleted", university_id))
            }
            None => Err(LMSError::NotFound("Pre-provisioned user not found".to_string())),
        }
    })
}

/// Get import statistics (admin only)
#[query]
pub fn get_import_statistics() -> LMSResult<HashMap<String, u32>> {
    require_admin()?;
    
    PRE_PROVISIONED_USERS.with(|users| {
        let mut stats = HashMap::new();
        let users_map = users.borrow();
        
        stats.insert("total".to_string(), users_map.len() as u32);
        
        let mut students = 0;
        let mut staff = 0;
        let mut verified = 0;
        let mut linked = 0;
        
        for (_, user) in users_map.iter() {
            match user.role {
                UserRole::Student => students += 1,
                _ => staff += 1,
            }
            
            if user.is_verified {
                verified += 1;
            }
            
            if matches!(user.status, PreProvisionStatus::Linked) {
                linked += 1;
            }
        }
        
        stats.insert("students".to_string(), students);
        stats.insert("staff".to_string(), staff);
        stats.insert("verified".to_string(), verified);
        stats.insert("linked".to_string(), linked);
        
        Ok(stats)
    })
}
