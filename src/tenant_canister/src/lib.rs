use candid::candid_method;
use ic_cdk::{query, update, init, pre_upgrade, post_upgrade, caller};
use ic_cdk_macros::*;
use std::collections::HashMap;
use shared::{Course, User, UserRole, LMSError, LMSResult};

// Tenant-specific state
thread_local! {
    static TENANT_ID: std::cell::RefCell<String> = std::cell::RefCell::new(String::new());
    static USERS: std::cell::RefCell<HashMap<String, User>> = std::cell::RefCell::new(HashMap::new());
    static COURSES: std::cell::RefCell<HashMap<String, Course>> = std::cell::RefCell::new(HashMap::new());
    static ADMINS: std::cell::RefCell<Vec<String>> = std::cell::RefCell::new(Vec::new());
}

#[init]
fn init(tenant_id: String) {
    TENANT_ID.with(|id| {
        *id.borrow_mut() = tenant_id;
    });
    ic_cdk::println!("Tenant canister initialized");
}

#[pre_upgrade]
fn pre_upgrade() {
    // In production, implement proper stable memory serialization
    ic_cdk::println!("Tenant canister pre-upgrade");
}

#[post_upgrade]
fn post_upgrade() {
    // In production, implement proper stable memory deserialization
    ic_cdk::println!("Tenant canister post-upgrade");
}

fn get_tenant_id() -> String {
    TENANT_ID.with(|id| id.borrow().clone())
}

fn is_admin(user_id: &str) -> bool {
    ADMINS.with(|admins| admins.borrow().contains(&user_id.to_string()))
}

/// Register a new user in this tenant
#[update]
#[candid_method(update)]
fn register_user(
    id: String,
    name: String,
    email: String,
    role: UserRole,
) -> LMSResult<User> {
    // Simple validation
    if id.is_empty() || name.is_empty() || email.is_empty() {
        return Err(LMSError::ValidationError("All fields are required".to_string()));
    }

    let user = User {
        id: id.clone(),
        name,
        email,
        role,
        tenant_id: get_tenant_id(),
    };

    USERS.with(|users| {
        let mut users = users.borrow_mut();
        if users.contains_key(&id) {
            return Err(LMSError::ValidationError("User already exists".to_string()));
        }
        users.insert(id.clone(), user.clone());
        Ok(())
    })?;

    Ok(user)
}

/// Get user by ID
#[query]
#[candid_method(query)]
fn get_user(id: String) -> LMSResult<User> {
    USERS.with(|users| {
        users
            .borrow()
            .get(&id)
            .cloned()
            .ok_or_else(|| LMSError::NotFound(format!("User {} not found", id)))
    })
}

/// Create a new course
#[update]
#[candid_method(update)]
fn create_course(
    id: String,
    title: String,
    description: String,
    instructor_id: String,
) -> LMSResult<Course> {
    // Validate instructor exists and has appropriate role
    let instructor = get_user(instructor_id.clone())?;
    match instructor.role {
        UserRole::Instructor | UserRole::Admin | UserRole::TenantAdmin => {},
        _ => return Err(LMSError::Unauthorized("Only instructors and admins can create courses".to_string())),
    }

    let course = Course {
        id: id.clone(),
        title,
        description,
        instructor_id,
        tenant_id: get_tenant_id(),
        created_at: shared::utils::current_time(),
        updated_at: shared::utils::current_time(),
    };

    COURSES.with(|courses| {
        let mut courses = courses.borrow_mut();
        if courses.contains_key(&id) {
            return Err(LMSError::ValidationError("Course already exists".to_string()));
        }
        courses.insert(id.clone(), course.clone());
        Ok(())
    })?;

    Ok(course)
}

/// Get course by ID
#[query]
#[candid_method(query)]
fn get_course(id: String) -> LMSResult<Course> {
    COURSES.with(|courses| {
        courses
            .borrow()
            .get(&id)
            .cloned()
            .ok_or_else(|| LMSError::NotFound(format!("Course {} not found", id)))
    })
}

/// List all courses in this tenant
#[query]
#[candid_method(query)]
fn list_courses() -> Vec<Course> {
    COURSES.with(|courses| {
        courses.borrow().values().cloned().collect()
    })
}

/// List all users in this tenant
#[query]
#[candid_method(query)]
fn list_users() -> Vec<User> {
    USERS.with(|users| {
        users.borrow().values().cloned().collect()
    })
}

/// Add admin user (can only be called by existing admin or during initialization)
#[update]
#[candid_method(update)]
fn add_admin(user_id: String) -> LMSResult<()> {
    let caller_principal = caller().to_string();
    
    // Check if caller is already an admin (or if this is the first admin)
    let has_admins = ADMINS.with(|admins| !admins.borrow().is_empty());
    
    if has_admins && !is_admin(&caller_principal) {
        return Err(LMSError::Unauthorized("Only admins can add new admins".to_string()));
    }

    // Verify user exists
    get_user(user_id.clone())?;

    ADMINS.with(|admins| {
        let mut admins = admins.borrow_mut();
        if !admins.contains(&user_id) {
            admins.push(user_id);
        }
    });

    Ok(())
}

/// Health check endpoint
#[query]
#[candid_method(query)]
fn health_check() -> String {
    format!("Tenant canister for {} is healthy", get_tenant_id())
}

/// Get tenant ID
#[query]
#[candid_method(query)]
fn get_tenant_info() -> String {
    get_tenant_id()
}

candid::export_service!();

#[query(name = "__get_candid_interface_tmp_hack")]
fn export_candid() -> String {
    __export_service()
}
