use ic_stable_structures::{
    DefaultMemoryImpl, 
    StableBTreeMap,
    StableCell,
    memory_manager::{MemoryId, MemoryManager, VirtualMemory}
};
use std::cell::RefCell;
use shared::{Course, User, Grade, Lesson, Quiz};
use crate::types::TenantData;

pub type Memory = VirtualMemory<DefaultMemoryImpl>;

// Tenant state storage
thread_local! {
    pub static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );
    
    pub static TENANT_DATA: RefCell<StableCell<Option<TenantData>, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(5))),
            None
        ).expect("Failed to initialize tenant data")
    );
    
    pub static USERS: RefCell<StableBTreeMap<String, User, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );
    
    pub static COURSES: RefCell<StableBTreeMap<String, Course, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );
    
    pub static GRADES: RefCell<StableBTreeMap<String, Grade, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)))
        )
    );
    
    pub static LESSONS: RefCell<StableBTreeMap<String, Lesson, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3)))
        )
    );
    
    pub static QUIZZES: RefCell<StableBTreeMap<String, Quiz, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(4)))
        )
    );
}

/// Get the current tenant ID
pub fn get_tenant_id() -> shared::LMSResult<String> {
    TENANT_DATA.with(|data| {
        match data.borrow().get() {
            Some(d) => Ok(d.tenant_id.clone()),
            None => Err(shared::LMSError::InitializationError("Tenant not initialized".to_string()))
        }
    })
}
