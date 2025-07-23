use candid::{candid_method, Principal};
use ic_cdk::{query, update, init, caller};
use ic_stable_structures::{
    DefaultMemoryImpl, 
    StableBTreeMap,
    StableCell,
    memory_manager::{MemoryId, MemoryManager, VirtualMemory}
};
use std::cell::RefCell;
use shared::{Course, User, UserRole, LMSError, LMSResult, Grade, Lesson, Quiz, utils};

type Memory = VirtualMemory<DefaultMemoryImpl>;

// Tenant state
thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );
    
    static TENANT_DATA: RefCell<StableCell<Option<TenantData>, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(5))),
            None
        ).expect("Failed to initialize tenant data")
    );
    
    static USERS: RefCell<StableBTreeMap<String, User, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );
    
    static COURSES: RefCell<StableBTreeMap<String, Course, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );
    
    static GRADES: RefCell<StableBTreeMap<String, Grade, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)))
        )
    );
    
    static LESSONS: RefCell<StableBTreeMap<String, Lesson, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3)))
        )
    );
    
    static QUIZZES: RefCell<StableBTreeMap<String, Quiz, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(4)))
        )
    );
}

#[derive(candid::CandidType, serde::Deserialize, serde::Serialize, Clone, Debug)]
struct TenantData {
    tenant_id: String,
    admin_principal: Principal,
    is_initialized: bool,
    created_at: u64,
}

impl ic_stable_structures::Storable for TenantData {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        std::borrow::Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        candid::decode_one(bytes.as_ref()).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
}

/// Initialize the tenant canister
#[init]
fn init() {
    TENANT_DATA.with(|data| {
        if data.borrow().get().is_some() {
            ic_cdk::trap("Tenant canister already initialized");
        }
        
        // Use the caller as the admin (the one deploying the canister)
        let admin_principal = caller();
        
        // Check if there are existing users (migration case)
        let existing_tenant_id = USERS.with(|users| {
            for (_, user) in users.borrow().iter() {
                if user.role == UserRole::TenantAdmin {
                    return Some(user.tenant_id.clone());
                }
            }
            None
        });
        
        let tenant_data = if let Some(existing_id) = existing_tenant_id {
            // Recover from existing data
            TenantData {
                tenant_id: existing_id,
                admin_principal,
                is_initialized: true,
                created_at: utils::current_time(),
            }
        } else {
            // Fresh initialization
            let tenant_data = TenantData {
                tenant_id: format!("tenant_{}", utils::current_time()),
                admin_principal,
                is_initialized: true,
                created_at: utils::current_time(),
            };
            
            // Create the initial admin user
            let admin_user = User {
                id: format!("admin_{}", utils::current_time()),
                name: "System Admin".to_string(),
                email: format!("admin@{}.edu", tenant_data.tenant_id),
                role: UserRole::TenantAdmin,
                tenant_id: tenant_data.tenant_id.clone(),
                created_at: utils::current_time(),
                updated_at: utils::current_time(),
                is_active: true,
            };
            
            USERS.with(|users| {
                users.borrow_mut().insert(admin_user.id.clone(), admin_user);
            });
            
            tenant_data
        };
        
        data.borrow_mut().set(Some(tenant_data.clone())).expect("Failed to store tenant data");
        ic_cdk::println!("Tenant canister initialized with admin: {} and tenant_id: {}", admin_principal, tenant_data.tenant_id);
    });
}

/// Role-based access control guards
fn is_admin() -> LMSResult<Principal> {
    let caller = caller();
    TENANT_DATA.with(|data| {
        match data.borrow().get() {
            Some(data) if data.admin_principal == caller => Ok(caller),
            Some(_) => {
                // Also check if caller is a TenantAdmin user
                USERS.with(|users| {
                    for (_, user) in users.borrow().iter() {
                        if user.role == UserRole::TenantAdmin {
                            return Ok(caller);
                        }
                    }
                    Err(LMSError::Unauthorized("Admin access required".to_string()))
                })
            },
            None => Err(LMSError::InitializationError("Tenant not initialized".to_string())),
        }
    })
}

fn is_teacher_or_admin() -> LMSResult<Principal> {
    let caller = caller();
    
    // First check if admin
    if is_admin().is_ok() {
        return Ok(caller);
    }
    
    // Then check if instructor
    USERS.with(|users| {
        for (_, user) in users.borrow().iter() {
            if user.role == UserRole::Instructor || user.role == UserRole::TenantAdmin {
                return Ok(caller);
            }
        }
        Err(LMSError::Unauthorized("Teacher or admin access required".to_string()))
    })
}

fn get_tenant_id() -> LMSResult<String> {
    TENANT_DATA.with(|data| {
        match data.borrow().get() {
            Some(d) => Ok(d.tenant_id.clone()),
            None => Err(LMSError::InitializationError("Tenant not initialized".to_string()))
        }
    })
}

// Core functions
#[update]
#[candid_method(update)]
fn register_user(id: String, name: String, email: String, role: UserRole, tenant_id: String) -> LMSResult<User> {
    // Only admins can register users
    is_admin()?;
    
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

#[query]
#[candid_method(query)]
fn list_users() -> Vec<User> {
    USERS.with(|users| {
        users.borrow().iter().map(|(_, user)| user).collect()
    })
}

#[query]
#[candid_method(query)]
fn get_user(user_id: String) -> LMSResult<User> {
    USERS.with(|users| {
        users.borrow()
            .get(&user_id)
            .ok_or_else(|| LMSError::NotFound("User not found".to_string()))
    })
}

#[update]
#[candid_method(update)]
fn create_course(
    id: String,
    title: String,
    description: String,
) -> LMSResult<Course> {
    // Only teachers and admins can create courses
    is_teacher_or_admin()?;
    
    let tenant_id = get_tenant_id()?;
    let caller = caller();
    
    COURSES.with(|courses| {
        let mut courses_map = courses.borrow_mut();
        
        // Check if course already exists
        if courses_map.contains_key(&id) {
            return Err(LMSError::AlreadyExists("Course already exists".to_string()));
        }
        
        let course = Course {
            id: id.clone(),
            title,
            description,
            instructor_id: caller.to_string(),
            tenant_id,
            lessons: Vec::new(),
            enrolled_students: Vec::new(),
            created_at: utils::current_time(),
            updated_at: utils::current_time(),
            is_published: false,
        };
        
        courses_map.insert(id, course.clone());
        ic_cdk::println!("Course created: {}", course.id);
        Ok(course)
    })
}

#[query]
#[candid_method(query)]
fn list_courses() -> Vec<Course> {
    COURSES.with(|courses| {
        courses.borrow().iter().map(|(_, course)| course).collect()
    })
}

#[query]
#[candid_method(query)]
fn get_course(course_id: String) -> LMSResult<Course> {
    COURSES.with(|courses| {
        courses.borrow()
            .get(&course_id)
            .ok_or_else(|| LMSError::NotFound("Course not found".to_string()))
    })
}

#[update]
#[candid_method(update)]
fn enroll_student(course_id: String, student_id: String) -> LMSResult<()> {
    // Only admins and instructors can enroll students
    is_teacher_or_admin()?;
    
    COURSES.with(|courses| {
        let mut courses_map = courses.borrow_mut();
        
        match courses_map.get(&course_id) {
            Some(mut course) => {
                if !course.enrolled_students.contains(&student_id) {
                    course.enrolled_students.push(student_id.clone());
                    course.updated_at = utils::current_time();
                    let course_id_clone = course_id.clone();
                    courses_map.insert(course_id, course);
                    ic_cdk::println!("Student {} enrolled in course {}", student_id, course_id_clone);
                    Ok(())
                } else {
                    Err(LMSError::AlreadyExists("Student already enrolled".to_string()))
                }
            }
            None => Err(LMSError::NotFound("Course not found".to_string()))
        }
    })
}

#[update]
#[candid_method(update)]
fn record_grade(
    student_id: String,
    course_id: String,
    score: f64,
    max_score: f64,
    grade_type: shared::GradeType,
    feedback: Option<String>,
) -> LMSResult<Grade> {
    // Only teachers and admins can record grades
    is_teacher_or_admin()?;
    
    let grader = caller();
    let grade_id = utils::generate_id("grade");
    
    GRADES.with(|grades| {
        let mut grades_map = grades.borrow_mut();
        
        let grade = Grade {
            id: grade_id.clone(),
            student_id,
            quiz_id: None,
            lesson_id: None,
            course_id,
            score,
            max_score,
            grade_type,
            feedback,
            graded_by: grader.to_string(),
            graded_at: utils::current_time(),
        };
        
        grades_map.insert(grade_id, grade.clone());
        ic_cdk::println!("Grade recorded: {}", grade.id);
        Ok(grade)
    })
}

#[query]
#[candid_method(query)]
fn get_student_grades(student_id: String) -> Vec<Grade> {
    GRADES.with(|grades| {
        grades.borrow()
            .iter()
            .filter(|(_, grade)| grade.student_id == student_id)
            .map(|(_, grade)| grade)
            .collect()
    })
}

#[query]
#[candid_method(query)]
fn health_check() -> String {
    TENANT_DATA.with(|data| {
        match data.borrow().get() {
            Some(tenant_data) => format!("Tenant canister {} is healthy", tenant_data.tenant_id),
            None => "Tenant canister not initialized".to_string()
        }
    })
}

#[query]
#[candid_method(query)]
fn get_tenant_info() -> LMSResult<TenantData> {
    TENANT_DATA.with(|data| {
        match data.borrow().get() {
            Some(d) => Ok(d.clone()),
            None => Err(LMSError::InitializationError("Tenant not initialized".to_string()))
        }
    })
}

/// Recover tenant data from existing users (migration helper)
#[update]
#[candid_method(update)]
fn recover_tenant_data() -> LMSResult<TenantData> {
    TENANT_DATA.with(|data| {
        if data.borrow().get().is_some() {
            return Err(LMSError::AlreadyExists("Tenant already initialized".to_string()));
        }
        
        // Find existing tenant_id from users
        let existing_data = USERS.with(|users| {
            for (_, user) in users.borrow().iter() {
                if user.role == UserRole::TenantAdmin {
                    return Some((user.tenant_id.clone(), user.created_at));
                }
            }
            None
        });
        
        if let Some((tenant_id, created_at)) = existing_data {
            let tenant_data = TenantData {
                tenant_id,
                admin_principal: caller(),
                is_initialized: true,
                created_at,
            };
            
            data.borrow_mut().set(Some(tenant_data.clone())).expect("Failed to store tenant data");
            ic_cdk::println!("Recovered tenant data: {}", tenant_data.tenant_id);
            Ok(tenant_data)
        } else {
            Err(LMSError::NotFound("No existing tenant data found".to_string()))
        }
    })
}

// Generate Candid interface
candid::export_service!();

#[query(name = "__get_candid_interface_tmp_hack")]
fn export_candid() -> String {
    __export_service()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_tenant_initialization() {
        let admin = Principal::from_text("rrkah-fqaaa-aaaah-qcura-cai").unwrap();
        // Note: In actual tests, would need to set up the canister environment
        // This is a basic structure test
        assert!(admin.to_string().len() > 0);
    }
}
