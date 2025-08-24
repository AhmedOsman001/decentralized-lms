// Mock data for the student portal
export const mockCourses = [
  {
    id: 'cs101',
    code: 'CS 101',
    title: 'Introduction to Computer Science',
    description: 'Fundamental concepts of programming and computer science',
    instructor_id: 'instructor-1',
    instructor_name: 'Dr. Michael Chen',
    credits: 3,
    semester: 'Fall',
    year: 2024,
    schedule: {
      days: ['Monday', 'Wednesday', 'Friday'],
      start_time: '09:00',
      end_time: '10:00',
      location: 'Room 101'
    },
    enrollment_count: 45,
    max_enrollment: 50,
    status: 'active',
    color: '#3B82F6'
  },
  {
    id: 'math201',
    code: 'MATH 201',
    title: 'Calculus II',
    description: 'Advanced calculus including integration techniques and series',
    instructor_id: 'instructor-2',
    instructor_name: 'Prof. Sarah Williams',
    credits: 4,
    semester: 'Fall',
    year: 2024,
    schedule: {
      days: ['Tuesday', 'Thursday'],
      start_time: '14:00',
      end_time: '15:30',
      location: 'Math Building 205'
    },
    enrollment_count: 32,
    max_enrollment: 40,
    status: 'active',
    color: '#10B981'
  },
  {
    id: 'phys301',
    code: 'PHYS 301',
    title: 'Quantum Mechanics',
    description: 'Introduction to quantum mechanics and its applications',
    instructor_id: 'instructor-3',
    instructor_name: 'Dr. James Rodriguez',
    credits: 3,
    semester: 'Fall',
    year: 2024,
    schedule: {
      days: ['Monday', 'Wednesday'],
      start_time: '11:00',
      end_time: '12:30',
      location: 'Physics Lab 301'
    },
    enrollment_count: 28,
    max_enrollment: 35,
    status: 'active',
    color: '#8B5CF6'
  },
  {
    id: 'eng102',
    code: 'ENG 102',
    title: 'Academic Writing',
    description: 'Advanced writing techniques for academic and professional contexts',
    instructor_id: 'instructor-4',
    instructor_name: 'Prof. Emily Johnson',
    credits: 3,
    semester: 'Fall',
    year: 2024,
    schedule: {
      days: ['Tuesday', 'Thursday'],
      start_time: '10:00',
      end_time: '11:30',
      location: 'Liberal Arts 150'
    },
    enrollment_count: 25,
    max_enrollment: 30,
    status: 'active',
    color: '#F59E0B'
  }
];

export const mockAssignments = [
  {
    id: 'assign-1',
    course_id: 'cs101',
    course_code: 'CS 101',
    title: 'Programming Project 1',
    description: 'Implement a basic calculator using Python',
    due_date: '2024-12-20T23:59:00Z',
    points: 100,
    submission_type: 'file',
    status: 'pending'
  },
  {
    id: 'assign-2',
    course_id: 'math201',
    course_code: 'MATH 201',
    title: 'Integration Techniques Homework',
    description: 'Complete problems 1-15 from Chapter 7',
    due_date: '2024-12-22T23:59:00Z',
    points: 50,
    submission_type: 'text',
    status: 'pending'
  },
  {
    id: 'assign-3',
    course_id: 'phys301',
    course_code: 'PHYS 301',
    title: 'Quantum States Lab Report',
    description: 'Analysis of quantum state measurements from lab experiment',
    due_date: '2024-12-18T23:59:00Z',
    points: 75,
    submission_type: 'file',
    status: 'overdue'
  },
  {
    id: 'assign-4',
    course_id: 'eng102',
    course_code: 'ENG 102',
    title: 'Research Paper Draft',
    description: 'Submit first draft of your research paper (minimum 1500 words)',
    due_date: '2024-12-25T23:59:00Z',
    points: 150,
    submission_type: 'file',
    status: 'submitted'
  }
];

export const mockExams = [
  {
    id: 'exam-1',
    course_id: 'cs101',
    course_code: 'CS 101',
    title: 'Midterm Exam',
    date: '2024-12-21',
    time: '09:00',
    duration: 120,
    location: 'Room 101',
    status: 'upcoming',
    type: 'written'
  },
  {
    id: 'exam-2',
    course_id: 'math201',
    course_code: 'MATH 201',
    title: 'Final Exam',
    date: '2024-12-28',
    time: '14:00',
    duration: 180,
    location: 'Math Building 205',
    status: 'upcoming',
    type: 'written'
  },
  {
    id: 'exam-3',
    course_id: 'phys301',
    course_code: 'PHYS 301',
    title: 'Quantum Mechanics Final',
    date: '2024-12-30',
    time: '11:00',
    duration: 150,
    location: 'Physics Lab 301',
    status: 'upcoming',
    type: 'written'
  }
];

export const mockAnnouncements = [
  {
    id: 'ann-1',
    course_id: 'cs101',
    course_name: 'CS 101',
    title: 'Assignment 1 Deadline Extended',
    content: 'Due to technical issues with the submission system, the deadline for Programming Project 1 has been extended by 24 hours.',
    posted_at: '2024-12-16T10:30:00Z',
    priority: 'high',
    author: 'Dr. Michael Chen'
  },
  {
    id: 'ann-2',
    course_id: 'math201',
    course_name: 'MATH 201',
    title: 'Office Hours Change',
    content: 'This week\'s office hours will be moved from Wednesday to Thursday, 2:00-4:00 PM in Math Building 210.',
    posted_at: '2024-12-15T14:15:00Z',
    priority: 'medium',
    author: 'Prof. Sarah Williams'
  },
  {
    id: 'ann-3',
    course_id: 'phys301',
    course_name: 'PHYS 301',
    title: 'Lab Equipment Update',
    content: 'New quantum measurement equipment has been installed in the lab. Please review the updated safety procedures before next session.',
    posted_at: '2024-12-14T09:00:00Z',
    priority: 'medium',
    author: 'Dr. James Rodriguez'
  }
];

export const mockCourseMaterials = [
  // CS 101 Materials
  {
    id: 'material-1',
    course_id: 'cs101',
    title: 'Introduction to Programming Concepts',
    description: 'Basic programming fundamentals and syntax overview',
    type: 'document',
    week: 1,
    size: '2.4 MB',
    uploaded_at: '2024-12-01T10:00:00Z',
    url: '/materials/cs101/intro-programming.pdf'
  },
  {
    id: 'material-2',
    course_id: 'cs101',
    title: 'Variables and Data Types - Video Lecture',
    description: 'Understanding different data types and variable declarations',
    type: 'video',
    week: 2,
    size: '156 MB',
    uploaded_at: '2024-12-03T14:30:00Z',
    url: '/materials/cs101/variables-lecture.mp4'
  },
  {
    id: 'material-3',
    course_id: 'cs101',
    title: 'Control Structures Presentation',
    description: 'Loops, conditionals, and control flow mechanisms',
    type: 'presentation',
    week: 3,
    size: '8.7 MB',
    uploaded_at: '2024-12-05T09:15:00Z',
    url: '/materials/cs101/control-structures.pptx'
  },
  {
    id: 'material-4',
    course_id: 'cs101',
    title: 'Functions and Scope',
    description: 'Function definitions, parameters, and variable scope',
    type: 'document',
    week: 4,
    size: '1.8 MB',
    uploaded_at: '2024-12-08T11:00:00Z',
    url: '/materials/cs101/functions-scope.pdf'
  },
  {
    id: 'material-5',
    course_id: 'cs101',
    title: 'Object-Oriented Programming Basics',
    description: 'Introduction to classes, objects, and inheritance',
    type: 'video',
    week: 5,
    size: '203 MB',
    uploaded_at: '2024-12-10T16:20:00Z',
    url: '/materials/cs101/oop-basics.mp4'
  },

  // MATH 201 Materials
  {
    id: 'material-6',
    course_id: 'math201',
    title: 'Integration Techniques Reference',
    description: 'Comprehensive guide to various integration methods',
    type: 'document',
    week: 1,
    size: '3.2 MB',
    uploaded_at: '2024-12-02T13:45:00Z',
    url: '/materials/math201/integration-techniques.pdf'
  },
  {
    id: 'material-7',
    course_id: 'math201',
    title: 'Series and Sequences Video Series',
    description: 'Deep dive into convergence tests and series analysis',
    type: 'video',
    week: 2,
    size: '287 MB',
    uploaded_at: '2024-12-04T10:30:00Z',
    url: '/materials/math201/series-sequences.mp4'
  },
  {
    id: 'material-8',
    course_id: 'math201',
    title: 'Parametric Equations Workshop',
    description: 'Interactive exercises on parametric and polar equations',
    type: 'presentation',
    week: 3,
    size: '12.1 MB',
    uploaded_at: '2024-12-06T15:00:00Z',
    url: '/materials/math201/parametric-workshop.pptx'
  },

  // PHYS 301 Materials
  {
    id: 'material-9',
    course_id: 'phys301',
    title: 'Quantum Mechanics Foundations',
    description: 'Mathematical foundations and key principles',
    type: 'document',
    week: 1,
    size: '4.1 MB',
    uploaded_at: '2024-12-01T08:00:00Z',
    url: '/materials/phys301/qm-foundations.pdf'
  },
  {
    id: 'material-10',
    course_id: 'phys301',
    title: 'Wave-Particle Duality Experiments',
    description: 'Historical experiments demonstrating quantum behavior',
    type: 'video',
    week: 2,
    size: '198 MB',
    uploaded_at: '2024-12-03T12:15:00Z',
    url: '/materials/phys301/wave-particle-experiments.mp4'
  },
  {
    id: 'material-11',
    course_id: 'phys301',
    title: 'Schrödinger Equation Solutions',
    description: 'Step-by-step solutions for common quantum systems',
    type: 'document',
    week: 3,
    size: '2.9 MB',
    uploaded_at: '2024-12-07T14:45:00Z',
    url: '/materials/phys301/schrodinger-solutions.pdf'
  },

  // ENG 150 Materials
  {
    id: 'material-12',
    course_id: 'eng150',
    title: 'Academic Writing Guidelines',
    description: 'Style guide and formatting requirements for academic papers',
    type: 'document',
    week: 1,
    size: '1.6 MB',
    uploaded_at: '2024-12-02T09:30:00Z',
    url: '/materials/eng150/writing-guidelines.pdf'
  },
  {
    id: 'material-13',
    course_id: 'eng150',
    title: 'Research Methods Workshop',
    description: 'Effective research strategies and source evaluation',
    type: 'presentation',
    week: 2,
    size: '9.3 MB',
    uploaded_at: '2024-12-05T13:20:00Z',
    url: '/materials/eng150/research-methods.pptx'
  },

  // HIST 202 Materials
  {
    id: 'material-14',
    course_id: 'hist202',
    title: 'Primary Sources Collection',
    description: 'Historical documents and artifacts from the medieval period',
    type: 'document',
    week: 1,
    size: '5.7 MB',
    uploaded_at: '2024-12-01T16:00:00Z',
    url: '/materials/hist202/primary-sources.pdf'
  },
  {
    id: 'material-15',
    course_id: 'hist202',
    title: 'Medieval Europe Documentary',
    description: 'BBC documentary on medieval society and culture',
    type: 'video',
    week: 2,
    size: '892 MB',
    uploaded_at: '2024-12-04T11:10:00Z',
    url: '/materials/hist202/medieval-documentary.mp4'
  }
];

export const mockGrades = [
  {
    id: 'grade-1',
    course_id: 'cs101',
    course_code: 'CS 101',
    assignment_id: 'assign-1',
    assignment_name: 'Programming Project 1',
    points_earned: 85,
    points_total: 100,
    percentage: 85,
    letter_grade: 'B+',
    feedback: 'Good implementation, but could improve code comments and error handling.',
    graded_at: '2024-12-10T15:30:00Z'
  },
  {
    id: 'grade-2',
    course_id: 'math201',
    course_code: 'MATH 201',
    assignment_id: 'assign-2',
    assignment_name: 'Integration Techniques',
    points_earned: 47,
    points_total: 50,
    percentage: 94,
    letter_grade: 'A',
    feedback: 'Excellent work on integration by parts. Minor calculation error in problem 12.',
    graded_at: '2024-12-08T11:20:00Z'
  }
];
