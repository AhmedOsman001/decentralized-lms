use shared::{User, UserRole, LMSResult, LMSError, utils};
use crate::storage::{USERS, get_tenant_id};
use crate::rbac::is_admin_compat;

/// Register a new user in the tenant
pub fn register_user(id: String, name: String, email: String, role: UserRole, tenant_id: String) -> LMSResult<User> {
    // Only admins can register users
    is_admin_compat()?;
    
    // Validate input
    if !utils::is_valid_email(&email) {
        return Err(LMSError::ValidationError("Invalid email format".to_string()));
    }
    
    let current_tenant_id = get_tenant_id()?;
    if tenant_id != current_tenant_id {
        return Err(LMSError::ValidationError("Tenant ID mismatch".to_string()));
    }
    
    USERS.with(|users| {
        let mut users_map = users.borrow_mut();
        
        // Check if user already exists
        if users_map.contains_key(&id) {
            return Err(LMSError::AlreadyExists("User already exists".to_string()));
        }
        
        let user = User {
            id: id.clone(),
            name,
            email,
            role,
            tenant_id,
            created_at: utils::current_time(),
            updated_at: utils::current_time(),
            is_active: true,
        };
        
        users_map.insert(id, user.clone());
        ic_cdk::println!("User registered: {}", user.id);
        Ok(user)
    })
}

/// List all users
pub fn list_users() -> Vec<User> {
    USERS.with(|users| {
        users.borrow().iter().map(|(_, user)| user).collect()
    })
}

/// Get a specific user by ID
pub fn get_user(user_id: String) -> LMSResult<User> {
    USERS.with(|users| {
        users.borrow()
            .get(&user_id)
            .ok_or_else(|| LMSError::NotFound("User not found".to_string()))
    })
}

/// Update user information
pub fn update_user(user_id: String, name: Option<String>, email: Option<String>, is_active: Option<bool>) -> LMSResult<User> {
    is_admin_compat()?;
    
    USERS.with(|users| {
        let mut users_map = users.borrow_mut();
        
        match users_map.get(&user_id) {
            Some(mut user) => {
                if let Some(new_name) = name {
                    user.name = new_name;
                }
                if let Some(new_email) = email {
                    if !utils::is_valid_email(&new_email) {
                        return Err(LMSError::ValidationError("Invalid email format".to_string()));
                    }
                    user.email = new_email;
                }
                if let Some(active) = is_active {
                    user.is_active = active;
                }
                user.updated_at = utils::current_time();
                
                users_map.insert(user_id, user.clone());
                Ok(user)
            }
            None => Err(LMSError::NotFound("User not found".to_string()))
        }
    })
}

/// Update a user's role
pub fn update_user_role(user_id: String, new_role: UserRole) -> LMSResult<User> {
    is_admin_compat()?;
    
    USERS.with(|users| {
        let mut users_map = users.borrow_mut();
        
        match users_map.get(&user_id) {
            Some(mut user) => {
                user.role = new_role;
                user.updated_at = utils::current_time();
                
                users_map.insert(user_id, user.clone());
                Ok(user)
            }
            None => Err(LMSError::NotFound("User not found".to_string()))
        }
    })
}

/// Get public user display names for a list of user IDs (principals)
/// Returns vector of (id, name) pairs for existing users. Missing users are skipped.
pub fn get_public_user_names(user_ids: Vec<String>) -> Vec<(String, String)> {
    USERS.with(|users| {
        let user_map = users.borrow();
        user_ids
            .into_iter()
            .filter_map(|id| {
                user_map.get(&id).map(|u| (id, u.name.clone()))
            })
            .collect()
    })
}
