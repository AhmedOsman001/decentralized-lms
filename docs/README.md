# Decentralized Learning Management System (LMS)

A multi-tenant, blockchain-based Learning Management System built on the Internet Computer Protocol (ICP). This system provides universities and educational institutions with a decentralized, secure, and scalable platform for managing courses, users, quizzes, and educational content.

## 🎯 Project Overview

The Decentralized LMS is designed to address the challenges of centralized educational platforms by providing:

- **Multi-tenant Architecture**: Each university operates as an independent tenant with isolated data
- **Blockchain Security**: Built on Internet Computer Protocol for tamper-proof data storage
- **Role-based Access Control**: Comprehensive RBAC system for students, instructors, and administrators
- **Scalable Design**: Modular architecture supporting multiple institutions
- **Modern Frontend**: React-based responsive web application with real-time updates

## 📋 Table of Contents

- [Architecture Overview](./architecture/README.md)
- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [API Reference](./api/README.md)
- [Deployment Guide](./deployment/README.md)
- [User Guides](./user-guides/README.md)
- [Development Setup](./development/README.md)

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │   Student   │ │ Instructor  │ │   Tenant Admin      │  │
│  │   Portal    │ │   Portal    │ │     Portal          │  │
│  └─────────────┘ └─────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Internet Computer Network                   │
│                                                             │
│  ┌─────────────┐     ┌──────────────────────────────────┐  │
│  │   Router    │────▶│        Tenant Canisters         │  │
│  │  Canister   │     │                                  │  │
│  │             │     │ ┌─────────┐ ┌─────────┐ ┌─────┐ │  │
│  │ - Routing   │     │ │Harvard  │ │   MIT   │ │ ... │ │  │
│  │ - Tenant    │     │ │Canister │ │Canister │ │     │ │  │
│  │   Discovery │     │ └─────────┘ └─────────┘ └─────┘ │  │
│  └─────────────┘     └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Key Features

### ✅ Implemented Features

#### **User Management**
- Multi-role authentication (Student, Instructor, Tenant Admin)
- Pre-provisioned user system for university integration
- Internet Identity integration for secure authentication
- Role-based access control with fine-grained permissions

#### **Course Management**
- Course creation and management by instructors
- Student enrollment system
- Course materials and content management
- Instructor assignment and management

#### **Quiz System**
- Interactive quiz creation with multiple question types:
  - Multiple Choice
  - True/False
  - Short Answer
  - Essay Questions
- Real-time quiz attempts with time limits
- Automatic scoring for objective questions
- Manual grading support for subjective questions
- Quiz analytics and performance tracking

#### **Grade Management**
- Comprehensive grading system
- Grade categories and weighting
- Automated grade calculations
- Grade history and audit trails
- Export capabilities

#### **Tenant Management**
- Multi-tenant architecture with isolated data
- Dynamic tenant discovery and validation
- Tenant-specific configurations
- Administrative controls per tenant

#### **File Storage**
- Decentralized file storage system
- Support for educational materials
- Version control for uploaded content
- Access control based on user roles

### 🔄 In Development

#### **Enhanced Analytics**
- Student performance dashboards
- Course effectiveness metrics
- Engagement tracking
- Predictive analytics

#### **Communication System**
- Real-time messaging
- Discussion forums
- Announcement system
- Email notifications

#### **Advanced Assessment**
- Peer review assignments
- Group projects support
- Plagiarism detection
- Advanced rubric system

## 🛠️ Technology Stack

### Backend
- **Language**: Rust
- **Platform**: Internet Computer Protocol (ICP)
- **Architecture**: Canister-based microservices
- **Storage**: On-chain stable storage
- **Authentication**: Internet Identity

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **Routing**: React Router
- **Build Tool**: Vite
- **Package Manager**: npm

### Infrastructure
- **Deployment**: DFX (DFINITY SDK)
- **Network**: Internet Computer
- **Development**: Local IC replica

## 📊 Current Status

### Backend Completion: ~85%
- ✅ Core user management
- ✅ Course operations
- ✅ Quiz system with all question types
- ✅ Grade management
- ✅ File storage
- ✅ Multi-tenant architecture
- ✅ RBAC implementation
- 🔄 Advanced analytics
- 🔄 Communication features

### Frontend Completion: ~80%
- ✅ Authentication flows
- ✅ Multi-portal architecture (Student/Instructor/Admin)
- ✅ Course management UI
- ✅ Quiz creation and taking interface
- ✅ Grade management dashboard
- ✅ User management admin panel
- ✅ Responsive design
- 🔄 Advanced analytics dashboard
- 🔄 Real-time notifications

### Integration: ~90%
- ✅ Frontend-backend API integration
- ✅ Authentication system
- ✅ Multi-tenant routing
- ✅ File upload/download
- ✅ Real-time quiz functionality
- 🔄 Error handling optimization
- 🔄 Performance optimization

## 🎯 Roadmap

### Phase 1 (Current) - Core Platform
- [x] Multi-tenant architecture
- [x] User authentication and management
- [x] Course and quiz systems
- [x] Basic grading functionality

### Phase 2 - Enhanced Features
- [ ] Advanced analytics and reporting
- [ ] Communication and collaboration tools
- [ ] Mobile application
- [ ] API documentation and SDK

### Phase 3 - Enterprise Features
- [ ] Integration with university systems
- [ ] Advanced security features
- [ ] Compliance and certification support
- [ ] White-label solutions

## 📈 Metrics and Performance

### Current Scale Support
- **Tenants**: Unlimited (tested with 10+)
- **Users per Tenant**: 10,000+ (tested with 1,000)
- **Concurrent Users**: 1,000+ (estimated)
- **Courses per Tenant**: Unlimited
- **File Storage**: 2GB per canister (expandable)

### Performance Benchmarks
- **Quiz Loading**: < 500ms
- **User Authentication**: < 200ms
- **Grade Calculations**: < 100ms
- **File Upload**: Up to 10MB files supported

## 🔐 Security Features

- **Blockchain Security**: Immutable audit trails
- **Identity Management**: Internet Identity integration
- **Access Control**: Role-based permissions
- **Data Isolation**: Tenant-specific data separation
- **Encrypted Storage**: On-chain encrypted data
- **Authentication**: Multi-factor authentication support

## 🌟 Unique Value Propositions

1. **Decentralization**: No single point of failure
2. **Transparency**: Blockchain-based audit trails
3. **Scalability**: Automatic scaling with ICP
4. **Cost Efficiency**: No infrastructure management
5. **Global Access**: Available worldwide
6. **Data Ownership**: Institutions own their data
7. **Interoperability**: Standard APIs for integration

## 📞 Getting Started

For detailed setup instructions, see:
- [Development Setup Guide](./development/README.md)
- [Deployment Guide](./deployment/README.md)
- [User Guides](./user-guides/README.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🤝 Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📧 Support

For support and questions:
- Create an issue in this repository
- Contact the development team
- Check the [FAQ](./FAQ.md)

---

*Built with ❤️ on the Internet Computer*
