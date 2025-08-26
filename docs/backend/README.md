# Backend Documentation

## Overview

The backend is built using Rust and deployed as canisters on the Internet Computer Protocol. It follows a modular, microservices architecture with clear separation of concerns and comprehensive security measures.

## Architecture

### Canister Structure

```
Internet Computer Network
├── Router Canister (Singleton)
│   ├── Tenant routing and discovery
│   ├── Load balancing
│   └── Health monitoring
│
└── Tenant Canisters (Multiple instances)
    ├── User Management Module
    ├── Course Management Module
    ├── Quiz Management Module
    ├── Grade Management Module
    ├── File Storage Module
    └── RBAC Module
```

## Router Canister

**Location**: `src/router_canister/`

The router canister serves as the entry point and orchestrator for the entire system.

### Key Responsibilities

1. **Tenant Discovery**: Dynamically discovers and routes to tenant canisters
2. **Load Balancing**: Distributes requests across available tenant instances
3. **Health Monitoring**: Monitors tenant canister health and availability
4. **Request Routing**: Routes requests based on tenant identification

### API Endpoints

```rust
// Tenant Management
pub fn register_tenant(tenant_id: String, canister_id: Principal) -> Result<(), String>
pub fn get_tenant_canister(tenant_id: String) -> Result<Principal, String>
pub fn list_tenants() -> Vec<Tenant>
pub fn health_check() -> String

// System Operations
pub fn get_system_stats() -> SystemStats
```

### Key Features

- **Dynamic Registration**: Tenants can be registered at runtime
- **Failover Support**: Automatic routing to healthy instances
- **Metrics Collection**: Performance and usage metrics
- **Circuit Breaker**: Protection against cascading failures

## Tenant Canister

**Location**: `src/tenant_canister/`

Each tenant canister represents a complete LMS instance for a single educational institution.

### Module Structure

```
tenant_canister/
├── src/
│   ├── lib.rs                 # Main canister entry point
│   ├── types.rs               # Shared data types
│   ├── storage.rs             # Data storage management
│   ├── rbac.rs                # Role-based access control
│   ├── api/                   # API endpoint modules
│   │   ├── users.rs
│   │   ├── courses.rs
│   │   ├── quizzes.rs
│   │   ├── grades.rs
│   │   └── system.rs
│   ├── user_management/       # User domain logic
│   ├── course_management/     # Course domain logic
│   ├── quiz/                  # Quiz domain logic
│   │   ├── core.rs
│   │   ├── attempts.rs
│   │   ├── validation.rs
│   │   └── analytics.rs
│   ├── grade/                 # Grade domain logic
│   ├── file_storage/          # File management
│   └── pre_provision/         # Pre-provisioning system
```

### Core Modules

#### 1. User Management (`user_management/`)

Handles all user-related operations with comprehensive RBAC integration.

**Key Features:**
- Multi-role user system (Student, Instructor, Tenant Admin)
- Pre-provisioning for university integration
- Profile management and authentication
- User enrollment and course assignment

**API Endpoints:**
```rust
// User CRUD Operations
pub fn create_user(user_data: User) -> LMSResult<User>
pub fn get_user(user_id: String) -> LMSResult<User>
pub fn update_user(user_id: String, updates: UserUpdate) -> LMSResult<User>
pub fn delete_user(user_id: String) -> LMSResult<()>
pub fn list_users(filters: UserFilters) -> LMSResult<Vec<User>>

// Authentication & Authorization
pub fn get_current_user() -> LMSResult<User>
pub fn update_user_role(user_id: String, role: UserRole) -> LMSResult<()>

// Pre-provisioning
pub fn create_pre_provisioned_user(user_data: PreProvisionedUser) -> LMSResult<String>
pub fn list_pre_provisioned_users() -> LMSResult<Vec<PreProvisionedUser>>
pub fn activate_pre_provisioned_user(university_id: String) -> LMSResult<User>
```

#### 2. Course Management (`course_management/`)

Comprehensive course lifecycle management with enrollment and content organization.

**Key Features:**
- Course creation and management
- Student enrollment system
- Instructor assignment
- Course content organization
- Prerequisite management

**API Endpoints:**
```rust
// Course Operations
pub fn create_course(course_data: Course) -> LMSResult<Course>
pub fn get_course(course_id: String) -> LMSResult<Course>
pub fn update_course(course_id: String, updates: CourseUpdate) -> LMSResult<Course>
pub fn delete_course(course_id: String) -> LMSResult<()>
pub fn list_courses() -> LMSResult<Vec<Course>>

// Enrollment Management
pub fn enroll_student(course_id: String, student_id: String) -> LMSResult<()>
pub fn unenroll_student(course_id: String, student_id: String) -> LMSResult<()>
pub fn get_enrolled_students(course_id: String) -> LMSResult<Vec<User>>
pub fn get_student_courses(student_id: String) -> LMSResult<Vec<Course>>

// Instructor Management
pub fn assign_instructor(course_id: String, instructor_id: String) -> LMSResult<()>
pub fn remove_instructor(course_id: String, instructor_id: String) -> LMSResult<()>
```

#### 3. Quiz Management (`quiz/`)

Advanced quiz system with multiple question types and real-time assessment.

**Module Structure:**
- `core.rs`: Quiz CRUD operations
- `attempts.rs`: Quiz attempt management
- `validation.rs`: Quiz validation logic
- `analytics.rs`: Performance analytics

**Key Features:**
- Multiple question types (Multiple Choice, True/False, Short Answer, Essay)
- Real-time quiz attempts with time limits
- Automatic scoring for objective questions
- Manual grading support for subjective questions
- Comprehensive analytics and performance tracking

**Question Types Supported:**
```rust
pub enum QuestionType {
    MultipleChoice {
        options: Vec<String>,
        correct_answer: u64,
    },
    TrueFalse {
        correct_answer: bool,
    },
    ShortAnswer {
        sample_answer: String,
    },
    Essay {
        max_words: Option<u32>,
        rubric: Option<String>,
    },
}
```

**API Endpoints:**
```rust
// Quiz Operations
pub fn create_quiz(quiz_data: QuizCreateRequest) -> LMSResult<Quiz>
pub fn update_quiz(quiz_id: String, updates: QuizUpdate) -> LMSResult<Quiz>
pub fn delete_quiz(quiz_id: String) -> LMSResult<()>
pub fn list_course_quizzes(course_id: String) -> LMSResult<Vec<Quiz>>

// Quiz Attempts
pub fn start_quiz_attempt(quiz_id: String) -> LMSResult<QuizAttempt>
pub fn submit_quiz_attempt(attempt_id: String, answers: Vec<Answer>) -> LMSResult<QuizAttempt>
pub fn get_quiz_attempt(attempt_id: String) -> LMSResult<QuizAttempt>
pub fn get_quiz_with_progress(quiz_id: String) -> LMSResult<(Quiz, Vec<QuizAttempt>)>

// Analytics
pub fn get_quiz_analytics(quiz_id: String) -> LMSResult<QuizAnalytics>
```

#### 4. Grade Management (`grade/`)

Sophisticated grading system with multiple grade types and automated calculations.

**Key Features:**
- Multiple grade types (Percentage, Letter, Points, Pass/Fail)
- Grade categories and weighting
- Automated grade calculations
- Grade history and audit trails
- Comprehensive analytics

**Grade Types:**
```rust
pub enum GradeType {
    Percentage(f64),      // 0.0 - 100.0
    Letter(String),       // A, B, C, D, F with +/-
    Points(f64),          // Raw points earned
    PassFail(bool),       // Simple pass/fail
}
```

**API Endpoints:**
```rust
// Grade Operations
pub fn create_grade(grade_data: Grade) -> LMSResult<Grade>
pub fn update_grade(grade_id: String, updates: GradeUpdate) -> LMSResult<Grade>
pub fn delete_grade(grade_id: String) -> LMSResult<()>
pub fn get_student_grades(student_id: String, course_id: String) -> LMSResult<Vec<Grade>>

// Grade Analytics
pub fn get_course_grade_analytics(course_id: String) -> LMSResult<GradeAnalytics>
pub fn calculate_final_grade(student_id: String, course_id: String) -> LMSResult<FinalGrade>
```

#### 5. File Storage (`file_storage/`)

Decentralized file storage system with version control and access management.

**Key Features:**
- Chunked file upload for large files
- Version control and history
- Access control based on user roles
- File metadata management
- Content type validation

**API Endpoints:**
```rust
// File Operations
pub fn initiate_upload(metadata: FileMetadata) -> LMSResult<UploadSession>
pub fn upload_chunk(session_id: String, chunk: FileChunk) -> LMSResult<()>
pub fn finalize_upload(session_id: String) -> LMSResult<FileMetadata>
pub fn download_file(file_id: String) -> LMSResult<Vec<u8>>
pub fn delete_file(file_id: String) -> LMSResult<()>

// File Management
pub fn list_files(folder_path: String) -> LMSResult<Vec<FileMetadata>>
pub fn get_file_metadata(file_id: String) -> LMSResult<FileMetadata>
pub fn update_file_metadata(file_id: String, updates: FileUpdate) -> LMSResult<FileMetadata>
```

#### 6. RBAC System (`rbac.rs`)

Comprehensive role-based access control system with fine-grained permissions.

**Role Hierarchy:**
```rust
pub enum UserRole {
    Student,        // Basic access to enrolled courses
    Instructor,     // Course management and grading
    TenantAdmin,    // Full administrative access
}
```

**Permission System:**
- Context-aware permissions (course-level, quiz-level, etc.)
- Dynamic permission checking
- Audit trail for access events

**Core Functions:**
```rust
pub fn require_authenticated() -> LMSResult<()>
pub fn require_role(required_role: UserRole) -> LMSResult<()>
pub fn require_course_access(course_id: &str) -> LMSResult<()>
pub fn get_caller_role() -> LMSResult<UserRole>
pub fn has_permission(resource: &str, action: &str) -> bool
```

### Data Storage

#### Storage Architecture

The system uses Internet Computer's stable storage for persistence:

```rust
// Storage declarations in storage.rs
thread_local! {
    static USERS: RefCell<HashMap<String, User>> = RefCell::new(HashMap::new());
    static COURSES: RefCell<HashMap<String, Course>> = RefCell::new(HashMap::new());
    static QUIZZES: RefCell<HashMap<String, Quiz>> = RefCell::new(HashMap::new());
    static QUIZ_ATTEMPTS: RefCell<HashMap<String, QuizAttempt>> = RefCell::new(HashMap::new());
    static GRADES: RefCell<HashMap<String, Grade>> = RefCell::new(HashMap::new());
    static FILES: RefCell<HashMap<String, FileMetadata>> = RefCell::new(HashMap::new());
    static TENANT_DATA: RefCell<StableCell<Option<TenantData>, Memory>> = // ...
}
```

#### Data Models

**User Model:**
```rust
pub struct User {
    pub id: String,
    pub principal: String,
    pub email: String,
    pub name: String,
    pub role: UserRole,
    pub university_id: Option<String>,
    pub profile: UserProfile,
    pub created_at: u64,
    pub updated_at: u64,
}
```

**Course Model:**
```rust
pub struct Course {
    pub id: String,
    pub title: String,
    pub description: String,
    pub instructor_ids: Vec<String>,
    pub student_ids: Vec<String>,
    pub start_date: u64,
    pub end_date: u64,
    pub credits: u32,
    pub max_students: Option<u32>,
    pub prerequisites: Vec<String>,
}
```

**Quiz Model:**
```rust
pub struct Quiz {
    pub id: String,
    pub course_id: String,
    pub title: String,
    pub description: String,
    pub questions: Vec<Question>,
    pub time_limit_minutes: Option<u32>,
    pub max_attempts: u32,
    pub start_date: u64,
    pub end_date: u64,
    pub duration_minutes: u32,
    pub created_by: String,
}
```

## Security Implementation

### 1. Authentication
- Integration with Internet Identity
- Principal-based user identification
- Secure session management

### 2. Authorization
- Role-based access control (RBAC)
- Context-aware permissions
- Resource-level access control

### 3. Data Protection
- Input validation and sanitization
- SQL injection prevention (not applicable but principle applied)
- XSS protection through proper data handling

### 4. Audit & Logging
- Comprehensive audit trails
- Security event logging
- Access pattern monitoring

## Performance Considerations

### 1. Caching Strategies
- In-memory caching for frequently accessed data
- Lazy loading for large datasets
- Cache invalidation strategies

### 2. Database Optimization
- Efficient data structures (HashMap for O(1) lookups)
- Batch operations for bulk updates
- Index-like structures for complex queries

### 3. Resource Management
- Memory-efficient data structures
- Garbage collection optimization
- Resource pooling where applicable

## Testing Strategy

### 1. Unit Tests
- Individual function testing
- Mock dependencies
- Edge case coverage

### 2. Integration Tests
- API endpoint testing
- Cross-module interaction testing
- Database operation testing

### 3. Security Tests
- Authentication bypass attempts
- Authorization escalation tests
- Input validation testing

## Deployment Process

### 1. Build Process
```bash
# Build all canisters
dfx build

# Deploy to local network
dfx deploy --network local

# Deploy to IC mainnet
dfx deploy --network ic
```

### 2. Canister Management
```bash
# Check canister status
dfx canister status <canister_name>

# Upgrade canister
dfx deploy <canister_name> --mode upgrade

# Get canister ID
dfx canister id <canister_name>
```

### 3. Environment Configuration
- Local development environment
- Testing environment
- Production deployment

## Monitoring and Maintenance

### 1. Health Checks
- Canister health monitoring
- Response time tracking
- Error rate monitoring

### 2. Performance Metrics
- Request/response times
- Memory usage tracking
- Storage utilization

### 3. Error Handling
- Comprehensive error types
- Graceful error recovery
- User-friendly error messages

## API Documentation

For detailed API documentation, see:
- [API Reference](../api/README.md)
- [User Management API](../api/users.md)
- [Course Management API](../api/courses.md)
- [Quiz Management API](../api/quizzes.md)
- [Grade Management API](../api/grades.md)

## Development Guidelines

### 1. Code Organization
- Follow domain-driven design principles
- Maintain clear module boundaries
- Use consistent naming conventions

### 2. Error Handling
- Use Result types for error handling
- Provide meaningful error messages
- Log errors appropriately

### 3. Documentation
- Document all public APIs
- Include examples in documentation
- Keep documentation up to date

This backend provides a robust, scalable, and secure foundation for the decentralized learning management system.
