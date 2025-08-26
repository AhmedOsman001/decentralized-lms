# API Reference

## Overview

The Decentralized LMS API is built on the Internet Computer Protocol and consists of two main canister types:
- **Router Canister**: Handles tenant routing and system-wide operations
- **Tenant Canisters**: Manage institution-specific data and operations

All API calls use the Candid interface definition language and follow RESTful principles where applicable.

## Authentication

### Internet Identity Integration

The system uses Internet Identity for authentication, providing cryptographic proof of user identity.

```javascript
// Frontend authentication example
import { AuthClient } from '@dfinity/auth-client';

const authClient = await AuthClient.create();
await authClient.login({
  identityProvider: 'https://identity.ic0.app',
  onSuccess: () => {
    // User authenticated
  }
});
```

### Principal-based Access

All authenticated requests include the user's Principal as identification:

```rust
// Backend principal extraction
use ic_cdk::caller;

let user_principal = caller().to_string();
```

## Router Canister API

**Base URL**: `https://<router-canister-id>.ic0.app/`

### Tenant Management

#### List Tenants
```rust
list_tenants() -> Vec<Tenant>
```

**Description**: Returns all registered tenant institutions.

**Example Response**:
```json
[
  {
    "id": "harvard",
    "name": "Harvard University",
    "domain": "harvard.edu",
    "canister_id": "rdmx6-jaaaa-aaaaa-aaadq-cai",
    "status": "active",
    "created_at": 1640995200000000000
  }
]
```

#### Get Tenant Canister
```rust
get_tenant_canister(tenant_id: String) -> Result<Principal, String>
```

**Parameters**:
- `tenant_id`: Unique identifier for the tenant

**Example**:
```javascript
const canisterId = await routerActor.get_tenant_canister("harvard");
```

#### Register Tenant
```rust
register_tenant(tenant_id: String, canister_id: Principal) -> Result<(), String>
```

**Parameters**:
- `tenant_id`: Unique identifier for the tenant
- `canister_id`: Principal ID of the tenant canister

**Permissions**: System Administrator only

### System Operations

#### Health Check
```rust
health_check() -> String
```

**Description**: Returns system health status.

**Example Response**:
```json
{
  "status": "healthy",
  "timestamp": 1640995200000000000,
  "active_tenants": 5,
  "total_requests": 10432
}
```

## Tenant Canister API

**Base URL**: `https://<tenant-canister-id>.ic0.app/`

### User Management

#### Create User
```rust
create_user(user_data: User) -> LMSResult<User>
```

**Parameters**:
```json
{
  "name": "John Doe",
  "email": "john.doe@harvard.edu",
  "role": { "Student": null },
  "university_id": "HD12345",
  "profile": {
    "bio": "Computer Science student",
    "year": 2,
    "major": "Computer Science"
  }
}
```

**Permissions**: Tenant Admin, or Self (for profile updates)

#### Get Current User
```rust
get_current_user() -> LMSResult<User>
```

**Description**: Returns the authenticated user's profile.

**Example Response**:
```json
{
  "id": "user_123",
  "principal": "2vxsx-fae",
  "name": "John Doe",
  "email": "john.doe@harvard.edu",
  "role": { "Student": null },
  "university_id": "HD12345",
  "created_at": 1640995200000000000,
  "updated_at": 1640995200000000000
}
```

#### List Users
```rust
list_users(filters: UserFilters) -> LMSResult<Vec<User>>
```

**Parameters**:
```json
{
  "role": "Student",
  "course_id": "course_123",
  "limit": 50,
  "offset": 0
}
```

**Permissions**: Instructor (for their courses), Tenant Admin

#### Update User
```rust
update_user(user_id: String, updates: UserUpdate) -> LMSResult<User>
```

**Permissions**: Tenant Admin, or Self (for own profile)

#### Delete User
```rust
delete_user(user_id: String) -> LMSResult<()>
```

**Permissions**: Tenant Admin only

### Pre-Provisioning

#### Create Pre-Provisioned User
```rust
create_pre_provisioned_user(user_data: PreProvisionedUser) -> LMSResult<String>
```

**Parameters**:
```json
{
  "university_id": "HD12345",
  "email": "john.doe@harvard.edu",
  "name": "John Doe",
  "role": { "Student": null },
  "expires_at": 1672531200000000000
}
```

**Permissions**: Tenant Admin only

#### List Pre-Provisioned Users
```rust
list_pre_provisioned_users() -> LMSResult<Vec<PreProvisionedUser>>
```

**Permissions**: Tenant Admin only

#### Activate Pre-Provisioned User
```rust
activate_pre_provisioned_user(university_id: String) -> LMSResult<User>
```

**Description**: Converts a pre-provisioned user to an active user account.

### Course Management

#### Create Course
```rust
create_course(course_data: Course) -> LMSResult<Course>
```

**Parameters**:
```json
{
  "title": "Introduction to Computer Science",
  "description": "Fundamentals of programming and computer science",
  "credits": 3,
  "max_students": 100,
  "start_date": 1640995200000000000,
  "end_date": 1672531200000000000,
  "prerequisites": []
}
```

**Permissions**: Instructor, Tenant Admin

#### Get Course
```rust
get_course(course_id: String) -> LMSResult<Course>
```

**Permissions**: Enrolled student, Instructor, Tenant Admin

#### List Courses
```rust
list_courses() -> LMSResult<Vec<Course>>
```

**Description**: Returns courses based on user role and permissions.

#### Update Course
```rust
update_course(course_id: String, updates: CourseUpdate) -> LMSResult<Course>
```

**Permissions**: Course instructor, Tenant Admin

#### Delete Course
```rust
delete_course(course_id: String) -> LMSResult<()>
```

**Permissions**: Course instructor, Tenant Admin

### Enrollment Management

#### Enroll Student
```rust
enroll_student(course_id: String, student_id: String) -> LMSResult<()>
```

**Permissions**: Course instructor, Tenant Admin

#### Unenroll Student
```rust
unenroll_student(course_id: String, student_id: String) -> LMSResult<()>
```

**Permissions**: Course instructor, Tenant Admin, Self

#### Get Enrolled Students
```rust
get_enrolled_students(course_id: String) -> LMSResult<Vec<User>>
```

**Permissions**: Course instructor, Tenant Admin

#### Get Student Courses
```rust
get_student_courses(student_id: String) -> LMSResult<Vec<Course>>
```

**Permissions**: Self, Course instructor (for their courses), Tenant Admin

### Quiz Management

#### Create Quiz
```rust
create_quiz(
    course_id: String,
    title: String,
    description: String,
    questions: Vec<Question>,
    time_limit_minutes: Option<u32>,
    max_attempts: u32,
    start_date: u64,
    end_date: u64,
    duration_minutes: u32,
) -> LMSResult<Quiz>
```

**Question Types**:
```json
{
  "id": "q1",
  "text": "What is 2 + 2?",
  "points": 10,
  "question_type": {
    "MultipleChoice": {
      "options": ["2", "3", "4", "5"],
      "correct_answer": 2
    }
  }
}
```

**Permissions**: Course instructor, Tenant Admin

#### Update Quiz
```rust
update_quiz(
    quiz_id: String,
    title: Option<String>,
    description: Option<String>,
    questions: Option<Vec<Question>>,
    time_limit_minutes: Option<Option<u32>>,
    max_attempts: Option<u32>,
    start_date: Option<u64>,
    end_date: Option<u64>,
    duration_minutes: Option<u32>,
) -> LMSResult<Quiz>
```

**Permissions**: Quiz creator, Course instructor, Tenant Admin

#### Delete Quiz
```rust
delete_quiz(quiz_id: String) -> LMSResult<()>
```

**Permissions**: Quiz creator, Course instructor, Tenant Admin

#### List Course Quizzes
```rust
list_course_quizzes(course_id: String) -> LMSResult<Vec<Quiz>>
```

**Permissions**: Enrolled student, Course instructor, Tenant Admin

### Quiz Attempts

#### Start Quiz Attempt
```rust
start_quiz_attempt(quiz_id: String) -> LMSResult<QuizAttempt>
```

**Description**: Initiates a new quiz attempt for the authenticated student.

**Example Response**:
```json
{
  "id": "attempt_123",
  "quiz_id": "quiz_456",
  "student_id": "student_789",
  "started_at": 1640995200000000000,
  "time_remaining": 3600,
  "answers": [],
  "score": null,
  "submitted_at": null
}
```

**Permissions**: Enrolled student only

#### Submit Quiz Attempt
```rust
submit_quiz_attempt(attempt_id: String, answers: Vec<Answer>) -> LMSResult<QuizAttempt>
```

**Parameters**:
```json
{
  "answers": [
    {
      "question_id": "q1",
      "answer_text": "4",
      "selected_option": 2
    }
  ]
}
```

**Permissions**: Attempt owner only

#### Get Quiz Attempt
```rust
get_quiz_attempt(attempt_id: String) -> LMSResult<QuizAttempt>
```

**Permissions**: Attempt owner, Course instructor, Tenant Admin

#### Get Quiz with Progress
```rust
get_quiz_with_progress(quiz_id: String) -> LMSResult<(Quiz, Vec<QuizAttempt>)>
```

**Description**: Returns quiz details along with the student's attempt history.

**Permissions**: Enrolled student (own attempts), Course instructor, Tenant Admin

### Quiz Analytics

#### Get Quiz Analytics
```rust
get_quiz_analytics(quiz_id: String) -> LMSResult<String>
```

**Description**: Returns comprehensive analytics for a quiz including score distribution, question difficulty, and performance metrics.

**Permissions**: Course instructor, Tenant Admin

### Grade Management

#### Create Grade
```rust
create_grade(grade_data: Grade) -> LMSResult<Grade>
```

**Parameters**:
```json
{
  "student_id": "student_123",
  "course_id": "course_456",
  "assignment_id": "quiz_789",
  "grade_type": { "Percentage": 85.5 },
  "category": "Quiz",
  "weight": 0.2,
  "comments": "Good work!"
}
```

**Permissions**: Course instructor, Tenant Admin

#### Update Grade
```rust
update_grade(grade_id: String, updates: GradeUpdate) -> LMSResult<Grade>
```

**Permissions**: Grade creator, Course instructor, Tenant Admin

#### Delete Grade
```rust
delete_grade(grade_id: String) -> LMSResult<()>
```

**Permissions**: Grade creator, Course instructor, Tenant Admin

#### Get Student Grades
```rust
get_student_grades(student_id: String, course_id: String) -> LMSResult<Vec<Grade>>
```

**Permissions**: Self, Course instructor, Tenant Admin

#### Calculate Final Grade
```rust
calculate_final_grade(student_id: String, course_id: String) -> LMSResult<FinalGrade>
```

**Description**: Calculates weighted final grade based on all assignments and categories.

**Example Response**:
```json
{
  "student_id": "student_123",
  "course_id": "course_456",
  "final_grade": { "Percentage": 87.3 },
  "letter_grade": "B+",
  "breakdown": {
    "Quizzes": { "weight": 0.3, "score": 85.0 },
    "Assignments": { "weight": 0.4, "score": 90.0 },
    "Exams": { "weight": 0.3, "score": 86.0 }
  }
}
```

### File Storage

#### Initiate Upload
```rust
initiate_upload(metadata: FileMetadata) -> LMSResult<UploadSession>
```

**Parameters**:
```json
{
  "name": "lecture_notes.pdf",
  "content_type": "application/pdf",
  "size": 2048576,
  "privacy_level": "CourseOnly",
  "owner_type": "Course",
  "owner_id": "course_123"
}
```

#### Upload Chunk
```rust
upload_chunk(session_id: String, chunk: FileChunk) -> LMSResult<()>
```

**Description**: Uploads a file chunk as part of a chunked upload session.

#### Finalize Upload
```rust
finalize_upload(session_id: String) -> LMSResult<FileMetadata>
```

**Description**: Completes the upload process and returns file metadata.

#### Download File
```rust
download_file(file_id: String) -> LMSResult<Vec<u8>>
```

**Permissions**: Based on file privacy level and user role

#### List Files
```rust
list_files(folder_path: String) -> LMSResult<Vec<FileMetadata>>
```

**Permissions**: Based on folder access permissions

## Error Handling

### Standard Error Types

```rust
pub enum LMSError {
    NotFound(String),
    Unauthorized(String),
    ValidationError(String),
    InternalError(String),
    NetworkError(String),
}
```

### Error Response Format

```json
{
  "error": {
    "type": "ValidationError",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "provided": "invalid-email"
    }
  }
}
```

### HTTP Status Code Mapping

- **200 OK**: Successful operation
- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: System errors

## Rate Limiting

### Request Limits

- **Read Operations**: 1000 requests/minute per user
- **Write Operations**: 100 requests/minute per user
- **File Uploads**: 10 uploads/minute per user
- **Bulk Operations**: 10 requests/minute per user

### Response Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

### List Operations

All list operations support pagination:

```rust
pub struct PaginationParams {
    pub limit: Option<u32>,    // Default: 50, Max: 1000
    pub offset: Option<u32>,   // Default: 0
    pub sort_by: Option<String>,
    pub sort_order: Option<SortOrder>, // Asc, Desc
}
```

### Response Format

```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

## WebSocket Support

### Real-time Updates

The system supports real-time updates for certain operations:

```javascript
// Quiz attempt real-time updates
const ws = new WebSocket('wss://tenant-canister.ic0.app/ws');
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'quiz_attempts',
  quiz_id: 'quiz_123'
}));
```

### Supported Channels

- `quiz_attempts`: Live quiz attempt updates
- `grades`: Grade posting notifications
- `course_updates`: Course announcement updates
- `user_activities`: User activity notifications

## SDK and Libraries

### JavaScript/TypeScript SDK

```javascript
import { LMSClient } from '@decentralized-lms/sdk';

const client = new LMSClient({
  routerCanisterId: 'router-canister-id',
  tenantId: 'harvard'
});

// Authenticate
await client.authenticate();

// Use API
const courses = await client.courses.list();
const quiz = await client.quizzes.create(quizData);
```

### Integration Examples

#### Course Enrollment

```javascript
// Enroll a student in a course
try {
  await client.courses.enrollStudent(courseId, studentId);
  console.log('Student enrolled successfully');
} catch (error) {
  if (error.type === 'ValidationError') {
    console.error('Enrollment failed:', error.message);
  }
}
```

#### Quiz Creation and Management

```javascript
// Create a quiz with multiple question types
const quiz = await client.quizzes.create({
  courseId: 'cs101',
  title: 'Midterm Exam',
  questions: [
    {
      text: 'What is the time complexity of binary search?',
      type: 'MultipleChoice',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correctAnswer: 1,
      points: 10
    },
    {
      text: 'Explain the concept of recursion.',
      type: 'Essay',
      maxWords: 200,
      points: 20
    }
  ],
  timeLimit: 60,
  maxAttempts: 2
});
```

#### Grade Management

```javascript
// Calculate and post grades
const finalGrade = await client.grades.calculateFinal(studentId, courseId);
await client.grades.create({
  studentId,
  courseId,
  assignmentId: 'final_exam',
  gradeType: { Percentage: finalGrade.percentage },
  comments: 'Excellent work on the final exam!'
});
```

This API reference provides comprehensive documentation for integrating with the Decentralized LMS system.
