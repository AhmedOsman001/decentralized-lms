# Frontend Documentation

## Overview

The frontend is a modern React application built with TypeScript, Tailwind CSS, and Vite. It provides a responsive, multi-portal interface for students, instructors, and tenant administrators.

## Architecture

### Technology Stack

- **Framework**: React 18 with Hooks
- **Language**: JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context API
- **Build Tool**: Vite
- **Package Manager**: npm
- **Authentication**: Internet Identity integration

### Project Structure

```
frontend/
├── public/                     # Static assets
│   ├── favicon.ico
│   └── assets/
├── src/
│   ├── App.jsx                # Main application component
│   ├── main.jsx               # Application entry point
│   ├── index.css              # Global styles
│   │
│   ├── auth/                  # Authentication components
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── AccountLinking.jsx
│   │   │   └── OTPVerification.jsx
│   │   └── components/
│   │
│   ├── portals/               # Role-based portal interfaces
│   │   ├── student/           # Student portal
│   │   │   ├── StudentPortal.jsx
│   │   │   ├── components/
│   │   │   └── pages/
│   │   ├── instructor/        # Instructor portal
│   │   │   ├── InstructorPortal.jsx
│   │   │   ├── components/
│   │   │   └── pages/
│   │   └── tenant-admin/      # Admin portal
│   │       ├── TenantAdminPortal.jsx
│   │       ├── components/
│   │       └── pages/
│   │
│   ├── shared/                # Shared components and utilities
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # React contexts
│   │   ├── hooks/             # Custom React hooks
│   │   └── utils/             # Utility functions
│   │
│   ├── services/              # API service layer
│   │   ├── apiService.js      # Core API communication
│   │   ├── quizService.js     # Quiz-specific operations
│   │   ├── gradeService.js    # Grade management
│   │   └── adminService.js    # Admin operations
│   │
│   ├── components/            # General components
│   ├── pages/                 # Standalone pages
│   ├── utils/                 # Utility functions
│   └── config/                # Configuration files
│
├── package.json               # Dependencies and scripts
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── README.md                 # Frontend-specific documentation
```

## Core Components

### 1. Application Shell (`App.jsx`)

The main application component that handles routing, authentication, and portal selection.

```jsx
// Key features:
- Multi-tenant routing with subdomain detection
- Authentication state management
- Role-based portal routing
- Error boundary implementation
- Loading states management

// Main routing structure:
<Routes>
  <Route path="/" element={<RootHandler />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/student/*" element={<StudentPortal />} />
  <Route path="/instructor/*" element={<InstructorPortal />} />
  <Route path="/admin/*" element={<TenantAdminPortal />} />
</Routes>
```

### 2. Authentication System

#### AuthContext (`shared/context/AuthContext.jsx`)

Manages authentication state and user session throughout the application.

```jsx
// Authentication states:
const AUTH_STATES = {
  LOADING: 'loading',
  UNAUTHENTICATED: 'unauthenticated',
  LINKING_REQUIRED: 'linking_required',
  LINKED: 'linked'
};

// Key functions:
- handleLogin(): Manages Internet Identity authentication
- handleLogout(): Clears session and redirects
- checkAuthStatus(): Validates current authentication
- linkAccount(): Links IC identity to user account
```

**Features:**
- Internet Identity integration
- Automatic session management
- Role-based access control
- Multi-step authentication flow
- Error handling and recovery

#### Login Flow

```
1. User visits application
2. Redirected to LoginPage if not authenticated
3. Internet Identity authentication
4. Account linking (if new user)
5. Role-based portal redirect
6. Session establishment
```

### 3. Portal Architecture

#### Student Portal (`portals/student/`)

Provides students with access to their courses, quizzes, and grades.

**Key Components:**
- `StudentDashboard.jsx`: Overview of courses and recent activity
- `StudentCourses.jsx`: Course listing and enrollment
- `QuizTaking.jsx`: Interactive quiz interface
- `GradeView.jsx`: Grade tracking and history
- `ProfilePage.jsx`: Student profile management

**Features:**
- Course enrollment and management
- Interactive quiz taking with real-time validation
- Grade viewing and analytics
- Profile management
- Progress tracking

#### Instructor Portal (`portals/instructor/`)

Enables instructors to manage courses, create quizzes, and grade students.

**Key Components:**
- `InstructorDashboard.jsx`: Course overview and quick actions
- `CourseManagement.jsx`: Course creation and editing
- `QuizCreation.jsx`: Quiz builder with multiple question types
- `GradeManagement.jsx`: Grading interface and analytics
- `StudentManagement.jsx`: Student enrollment and progress

**Features:**
- Course creation and management
- Advanced quiz builder with multiple question types
- Comprehensive grading system
- Student progress analytics
- Bulk operations for efficiency

#### Tenant Admin Portal (`portals/tenant-admin/`)

Comprehensive administrative interface for institutional management.

**Key Components:**
- `AdminDashboard.jsx`: System overview and metrics
- `UserManagement.jsx`: User CRUD operations and role management
- `CourseManagement.jsx`: Institution-wide course oversight
- `QuizManagement.jsx`: Quiz oversight and analytics
- `SystemSettings.jsx`: Tenant configuration and settings

**Features:**
- Complete user lifecycle management
- Institution-wide analytics and reporting
- System configuration and settings
- Bulk user operations and imports
- Advanced administrative controls

### 4. Shared Components (`shared/components/`)

#### Layout Components

**AdminLayout.jsx**: Standard layout for admin pages
```jsx
<div className="admin-layout">
  <Sidebar />
  <div className="main-content">
    <Header />
    <main>{children}</main>
  </div>
</div>
```

**StudentLayout.jsx**: Optimized layout for student interface
**InstructorLayout.jsx**: Layout tailored for instructor workflows

#### UI Components

**Navigation Components:**
- `Sidebar.jsx`: Collapsible navigation sidebar
- `Header.jsx`: Top navigation with user menu
- `Breadcrumbs.jsx`: Navigation breadcrumbs

**Form Components:**
- `FormField.jsx`: Standardized form input wrapper
- `Button.jsx`: Consistent button styling and behavior
- `Modal.jsx`: Reusable modal dialog component

**Data Display:**
- `Table.jsx`: Advanced data table with sorting and filtering
- `Card.jsx`: Content card component
- `Badge.jsx`: Status and category badges

**Feedback Components:**
- `LoadingSpinner.jsx`: Loading indicators
- `ErrorBoundary.jsx`: Error handling and display
- `NotificationToast.jsx`: User feedback system

### 5. Service Layer (`services/`)

#### API Service (`apiService.js`)

Core service for backend communication with the Internet Computer canisters.

```javascript
class ApiService {
  // Authentication and initialization
  async init()
  async authenticate()
  
  // Canister communication
  async getRouterActor()
  async getTenantActor(tenantCanisterId)
  async callTenantMethod(methodName, args)
  
  // Tenant operations
  async getTenantCanisterId(tenantId)
  async listTenants()
  async healthCheck()
}
```

**Features:**
- Automatic canister discovery
- Authentication management
- Error handling and retries
- Request/response transformation
- Multi-tenant routing

#### Quiz Service (`quizService.js`)

Specialized service for quiz operations with enhanced functionality.

```javascript
class QuizService {
  // Quiz management
  async createQuiz(quizData)
  async updateQuiz(quizId, updates)
  async deleteQuiz(quizId)
  async getQuizWithProgress(quizId)
  
  // Quiz attempts
  async startQuizAttempt(quizId)
  async submitQuizAttempt(attemptId, answers)
  async getAttemptDetails(attemptId)
  
  // Analytics
  async getQuizAnalytics(quizId)
}
```

#### Grade Service (`gradeService.js`)

Handles all grade-related operations and calculations.

#### Admin Service (`adminService.js`)

Comprehensive administrative operations including user management and system configuration.

### 6. State Management

#### Context Providers

**AuthContext**: Global authentication state
**NotificationContext**: Application-wide notifications
**ThemeContext**: UI theme and preferences

#### Custom Hooks

**useAuth()**: Authentication state and operations
**useNotification()**: Notification management
**useAsyncOperation()**: Async operation state management
**useLocalStorage()**: Persistent local storage

### 7. Responsive Design

#### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...},
        accent: {...}
      },
      screens: {
        'xs': '475px',
        // ... custom breakpoints
      }
    }
  }
}
```

#### Responsive Patterns

- Mobile-first design approach
- Flexible grid layouts
- Adaptive navigation patterns
- Touch-friendly interfaces
- Progressive enhancement

## Key Features Implementation

### 1. Multi-Tenant Support

```javascript
// Tenant detection from subdomain
function extractTenantFromHostname(hostname) {
  if (hostname.includes('localhost')) {
    const parts = hostname.split('.');
    return parts.length >= 2 ? parts[0] : null;
  }
  return hostname.split('.')[0];
}

// Dynamic tenant routing
const currentTenant = getCurrentTenant();
if (!currentTenant.isValid) {
  return <InvalidTenantPage />;
}
```

### 2. Real-time Quiz Interface

```jsx
// Quiz taking component with live validation
const QuizTaking = () => {
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  // Real-time timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Auto-save functionality
  useEffect(() => {
    const autoSave = setTimeout(() => {
      saveProgress(answers);
    }, 30000); // Save every 30 seconds
    return () => clearTimeout(autoSave);
  }, [answers]);
};
```

### 3. Advanced Form Handling

```jsx
// Reusable form hook with validation
const useForm = (initialValues, validationSchema) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (onSubmit) => {
    setIsSubmitting(true);
    try {
      const isValid = await validate(values, validationSchema);
      if (isValid) {
        await onSubmit(values);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return { values, errors, isSubmitting, handleSubmit, setValues };
};
```

### 4. Error Handling

```jsx
// Global error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Application error:', error, errorInfo);
    // Send to error reporting service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

## Performance Optimization

### 1. Code Splitting

```jsx
// Lazy loading of portal components
const StudentPortal = lazy(() => import('./portals/student/StudentPortal'));
const InstructorPortal = lazy(() => import('./portals/instructor/InstructorPortal'));
const AdminPortal = lazy(() => import('./portals/tenant-admin/TenantAdminPortal'));

// Suspense wrapper for loading states
<Suspense fallback={<PageLoading />}>
  <Routes>
    <Route path="/student/*" element={<StudentPortal />} />
    {/* ... */}
  </Routes>
</Suspense>
```

### 2. Memoization

```jsx
// Memoized expensive calculations
const expensiveCalculation = useMemo(() => {
  return complexGradeCalculation(grades);
}, [grades]);

// Memoized components to prevent unnecessary re-renders
const MemoizedQuizQuestion = memo(QuizQuestion);
```

### 3. Virtual Scrolling

```jsx
// Virtual scrolling for large datasets
const VirtualizedTable = ({ items }) => {
  const [visibleItems, setVisibleItems] = useState([]);
  
  useEffect(() => {
    // Calculate visible items based on scroll position
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = startIndex + visibleCount;
    setVisibleItems(items.slice(startIndex, endIndex));
  }, [scrollTop, items]);
  
  return (
    <div className="virtual-container">
      {visibleItems.map(item => (
        <div key={item.id} className="virtual-item">
          {/* Item content */}
        </div>
      ))}
    </div>
  );
};
```

## Security Implementation

### 1. Input Validation

```jsx
// Client-side validation with sanitization
const validateInput = (value, type) => {
  switch (type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'text':
      return DOMPurify.sanitize(value);
    case 'number':
      return !isNaN(parseFloat(value));
    default:
      return true;
  }
};
```

### 2. Authentication Guards

```jsx
// Protected route component
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { authState, user, hasAnyRole } = useAuth();
  
  if (authState === AUTH_STATES.LOADING) {
    return <PageLoading />;
  }
  
  if (authState === AUTH_STATES.UNAUTHENTICATED) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};
```

### 3. XSS Prevention

```jsx
// Safe HTML rendering
const SafeHtmlContent = ({ content }) => {
  const sanitizedContent = DOMPurify.sanitize(content);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
};
```

## Testing Strategy

### 1. Component Testing

```jsx
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizQuestion } from './QuizQuestion';

test('multiple choice question renders correctly', () => {
  const question = {
    type: 'multiple_choice',
    text: 'What is 2+2?',
    options: ['3', '4', '5', '6']
  };
  
  render(<QuizQuestion question={question} />);
  
  expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
  expect(screen.getAllByRole('radio')).toHaveLength(4);
});
```

### 2. Integration Testing

```jsx
// API integration tests
test('quiz submission flow', async () => {
  const { user } = renderWithAuth(<QuizTaking quizId="test-quiz" />);
  
  // Select answers
  fireEvent.click(screen.getByLabelText('Option A'));
  
  // Submit quiz
  fireEvent.click(screen.getByText('Submit Quiz'));
  
  // Verify submission
  await waitFor(() => {
    expect(screen.getByText('Quiz submitted successfully')).toBeInTheDocument();
  });
});
```

### 3. End-to-End Testing

```jsx
// Cypress E2E tests
describe('Quiz Management', () => {
  it('allows instructor to create and publish quiz', () => {
    cy.login('instructor');
    cy.visit('/instructor/courses/test-course/quizzes');
    
    cy.get('[data-testid="create-quiz-btn"]').click();
    cy.get('[data-testid="quiz-title"]').type('Test Quiz');
    cy.get('[data-testid="add-question-btn"]').click();
    
    // Add questions and publish
    cy.get('[data-testid="publish-quiz-btn"]').click();
    
    cy.contains('Quiz published successfully').should('be.visible');
  });
});
```

## Build and Deployment

### 1. Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### 2. Build Configuration

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', 'lucide-react']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@dfinity/agent', '@dfinity/auth-client']
  }
});
```

### 3. Environment Configuration

```javascript
// Environment variables
VITE_IC_HOST=http://localhost:4943
VITE_ROUTER_CANISTER_ID=rrkah-fqaaa-aaaaa-aaaaq-cai
VITE_TENANT_CANISTER_ID=rdmx6-jaaaa-aaaaa-aaadq-cai
VITE_ENVIRONMENT=development
```

## Accessibility

### 1. Semantic HTML

```jsx
// Proper semantic structure
<main role="main">
  <section aria-labelledby="quiz-title">
    <h1 id="quiz-title">Quiz: {quiz.title}</h1>
    <form onSubmit={handleSubmit} aria-label="Quiz form">
      {questions.map(question => (
        <fieldset key={question.id} aria-labelledby={`q-${question.id}`}>
          <legend id={`q-${question.id}`}>{question.text}</legend>
          {/* Question options */}
        </fieldset>
      ))}
    </form>
  </section>
</main>
```

### 2. Keyboard Navigation

```jsx
// Keyboard event handling
const handleKeyDown = (event) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      handleSelect();
      break;
    case 'ArrowDown':
      focusNext();
      break;
    case 'ArrowUp':
      focusPrevious();
      break;
  }
};
```

### 3. Screen Reader Support

```jsx
// ARIA labels and descriptions
<button
  aria-label={`Delete quiz ${quiz.title}`}
  aria-describedby="delete-help"
  onClick={handleDelete}
>
  <TrashIcon />
</button>
<div id="delete-help" className="sr-only">
  This action cannot be undone
</div>
```

## Browser Support

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Mobile**: iOS Safari 14+, Chrome Mobile 88+
- **Progressive Enhancement**: Graceful degradation for older browsers

## Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

This frontend architecture provides a robust, scalable, and user-friendly interface for the decentralized learning management system.
