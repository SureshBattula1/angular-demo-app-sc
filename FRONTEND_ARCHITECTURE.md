# Frontend Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Architecture Patterns](#architecture-patterns)
5. [Application Structure](#application-structure)
6. [Core Module](#core-module)
7. [Features Module](#features-module)
8. [Shared Module](#shared-module)
9. [Routing System](#routing-system)
10. [State Management](#state-management)
11. [Authentication & Authorization](#authentication--authorization)
12. [API Integration](#api-integration)
13. [UI Components](#ui-components)
14. [Styling Architecture](#styling-architecture)
15. [Build & Deployment](#build--deployment)
16. [Performance Optimizations](#performance-optimizations)

---

## Overview

The frontend is an **Angular 21** Single Page Application (SPA) that provides a modern, responsive user interface for the School Management System. It follows **Feature-Based Architecture** with lazy loading, ensuring optimal performance and maintainability.

### Key Characteristics
- **Framework**: Angular 21
- **Language**: TypeScript
- **UI Library**: Angular Material 21
- **Architecture**: Feature-Based Modular Architecture
- **State Management**: RxJS Observables & Signals
- **Build Tool**: Angular CLI

---

## Technology Stack

### Core Framework
- **Angular**: ^21.0.0
- **TypeScript**: ~5.9.0
- **RxJS**: ~7.8.1
- **Zone.js**: ~0.16.0

### UI Libraries
- **Angular Material**: ^21.0.0
  - Material Design components
  - Theming system
  - Accessibility support
- **Angular CDK**: ^21.0.0
  - Component Dev Kit
  - Overlay, Portal, Drag & Drop

### Additional Libraries
- **Chart.js**: ^4.5.1 (Data visualization)
- **Angular Router**: ^21.0.0 (Navigation)

### Development Tools
- **Angular CLI**: ^21.0.0
- **ESLint**: ^9.37.0 (Code linting)
- **Karma**: ~6.4.0 (Test runner)
- **Jasmine**: ~5.6.0 (Testing framework)

---

## Project Structure

```
ui-app/
├── src/
│   ├── app/
│   │   ├── app.component.ts          # Root Component
│   │   ├── app.config.ts             # App Configuration
│   │   ├── app.routes.ts              # Root Routes
│   │   ├── core/                      # Core Module (Singleton Services)
│   │   │   ├── guards/                # Route Guards
│   │   │   ├── interceptors/          # HTTP Interceptors
│   │   │   ├── models/                # TypeScript Interfaces/Models
│   │   │   ├── services/              # Core Services
│   │   │   └── directives/            # Core Directives
│   │   ├── features/                  # Feature Modules (Lazy Loaded)
│   │   │   ├── auth/                  # Authentication Feature
│   │   │   ├── dashboard/             # Dashboard Feature
│   │   │   ├── students/              # Students Feature
│   │   │   ├── teachers/              # Teachers Feature
│   │   │   ├── branches/              # Branches Feature
│   │   │   ├── fees/                  # Fees Feature
│   │   │   ├── exams/                 # Exams Feature
│   │   │   ├── attendance/             # Attendance Feature
│   │   │   └── ...                    # Other Features
│   │   ├── layouts/                   # Layout Components
│   │   │   ├── main-shell/            # Main Application Shell
│   │   │   ├── auth-layout/           # Authentication Layout
│   │   │   └── print-layout/          # Print Layout
│   │   └── shared/                    # Shared Module
│   │       ├── components/            # Reusable Components
│   │       ├── directives/            # Shared Directives
│   │       ├── pipes/                 # Custom Pipes
│   │       ├── services/             # Shared Services
│   │       └── modules/               # Shared Modules
│   ├── environments/               # Environment Configurations
│   ├── styles/                       # Global Styles
│   │   ├── material-theme.scss        # Material Theme
│   │   └── *.scss                     # Global Style Files
│   ├── index.html                     # Entry HTML
│   └── main.ts                        # Application Bootstrap
├── angular.json                       # Angular Configuration
├── tsconfig.json                      # TypeScript Configuration
├── package.json                       # Dependencies
└── public/                            # Static Assets
```

---

## Architecture Patterns

### 1. **Feature-Based Architecture**

Each feature is self-contained with its own:
- Components
- Services
- Routes
- Models (if feature-specific)
- Styles

```
feature/
├── pages/                    # Feature Pages
│   ├── feature-list/
│   ├── feature-form/
│   └── feature-view/
├── services/                  # Feature Services
├── *.routes.ts               # Feature Routes
└── *.module.ts (if needed)   # Feature Module
```

### 2. **Layered Architecture**

```
┌─────────────────────────────────────┐
│      Components (Presentation)       │
│   - User Interface                   │
│   - User Interactions                │
│   - Data Binding                     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Services (Business Logic)      │
│   - API Calls                       │
│   - Data Processing                 │
│   - State Management                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Core Services (Infrastructure) │
│   - HTTP Client                     │
│   - Authentication                  │
│   - Error Handling                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Backend API (Laravel)          │
└─────────────────────────────────────┘
```

### 3. **Dependency Injection**

Angular's DI system provides:
- Singleton services (providedIn: 'root')
- Feature-scoped services
- Component-level services

### 4. **Reactive Programming**

RxJS Observables for:
- HTTP requests
- State management
- Event handling
- Data streams

### 5. **Component-Based Architecture**

- Reusable components
- Component composition
- Input/Output communication
- View encapsulation

---

## Application Structure

### Root Application

**`app.component.ts`**
- Root component
- Application shell
- Router outlet

**`app.config.ts`**
- Application configuration
- Provider registration
- Global settings

**`app.routes.ts`**
- Root routing configuration
- Lazy-loaded feature routes
- Route guards

### Entry Point

**`main.ts`**
- Bootstrap Angular application
- Platform initialization
- Application configuration

---

## Core Module

The Core module contains singleton services and infrastructure code that is used throughout the application.

### Core Services

#### **1. ApiService** (`core/services/api.service.ts`)
- Centralized HTTP client
- API endpoint management
- Request/response handling
- Base URL configuration

**Methods:**
- `get<T>(endpoint, params?)` - GET request
- `post<T>(endpoint, body)` - POST request
- `put<T>(endpoint, body)` - PUT request
- `delete<T>(endpoint)` - DELETE request
- `patch<T>(endpoint, body)` - PATCH request
- `upload<T>(endpoint, formData)` - File upload

#### **2. AuthService** (`core/services/auth.service.ts`)
- Authentication management
- Token storage
- User session management
- Login/logout operations

**Key Features:**
- Token-based authentication
- User state management (Signals)
- Permission checking
- Auto-logout on token expiry

#### **3. PermissionService** (`core/services/permission.service.ts`)
- Permission checking
- Role-based access
- Permission caching

#### **4. BranchService** (`core/services/branch.service.ts`)
- Branch management
- Current branch selection
- Branch hierarchy

#### **5. ErrorHandlerService** (`core/services/error-handler.service.ts`)
- Global error handling
- Error logging
- User-friendly error messages

#### **6. FileUploadService** (`core/services/file-upload.service.ts`)
- File upload handling
- Progress tracking
- File validation

#### **7. ThemeService** (`core/services/theme.service.ts`)
- Theme management
- Dark/light mode
- Theme persistence

#### **8. UserPreferenceService** (`core/services/user-preference.service.ts`)
- User preferences storage
- Settings management

### Core Guards

#### **1. AuthGuard** (`core/guards/auth.guard.ts`)
- Protects authenticated routes
- Redirects to login if not authenticated
- Token validation

#### **2. GuestGuard** (`core/guards/guest.guard.ts`)
- Protects public routes (login, register)
- Redirects to dashboard if authenticated

#### **3. PermissionGuard** (`core/guards/permission.guard.ts`)
- Permission-based route protection
- Checks user permissions
- Supports multiple permission modes (any/all)

#### **4. RoleGuard** (`core/guards/role.guard.ts`)
- Role-based route protection
- Checks user roles

### Core Interceptors

#### **1. AuthInterceptor** (`core/interceptors/auth.interceptor.ts`)
- Adds Authorization header to requests
- Token injection
- Handles token refresh (if implemented)

#### **2. ErrorInterceptor** (`core/interceptors/error.interceptor.ts`)
- Global error handling
- HTTP error responses
- Error transformation
- User notification

### Core Models

TypeScript interfaces/models in `core/models/`:
- `user.model.ts` - User interface
- `student.model.ts` - Student interface
- `teacher.model.ts` - Teacher interface
- `branch.model.ts` - Branch interface
- `fee.model.ts` - Fee interface
- `attendance.model.ts` - Attendance interface
- And more...

### Core Directives

#### **HasPermissionDirective** (`core/directives/has-permission.directive.ts`)
- Conditional rendering based on permissions
- Usage: `*hasPermission="'students.view'"`

---

## Features Module

Features are lazy-loaded modules, each representing a major application domain.

### Feature Structure

Each feature follows this structure:

```
feature-name/
├── pages/                          # Feature Pages
│   ├── feature-list/               # List View
│   │   ├── feature-list.component.ts
│   │   ├── feature-list.component.html
│   │   └── feature-list.component.scss
│   ├── feature-form/               # Form View
│   │   ├── feature-form.component.ts
│   │   ├── feature-form.component.html
│   │   └── feature-form.component.scss
│   └── feature-view/               # Detail View
│       ├── feature-view.component.ts
│       ├── feature-view.component.html
│       └── feature-view.component.scss
├── services/                        # Feature Services
│   └── feature.service.ts
└── feature.routes.ts               # Feature Routes
```

### Key Features

#### **1. Authentication Feature** (`features/auth/`)
- Login page
- Register page
- Forgot password
- Reset password
- Auth routes configuration

#### **2. Dashboard Feature** (`features/dashboard/`)
- Main dashboard
- Statistics cards
- Charts and graphs
- Quick actions

#### **3. Students Feature** (`features/students/`)
- Student list
- Student form (create/edit)
- Student detail view
- Student promotion
- Student search and filters

#### **4. Teachers Feature** (`features/teachers/`)
- Teacher list
- Teacher form
- Teacher detail view
- Teacher management

#### **5. Branches Feature** (`features/branches/`)
- Branch list
- Branch form
- Branch hierarchy view
- Branch statistics

#### **6. Fees Feature** (`features/fees/`)
- Fee structure management
- Fee payment recording
- Fee dues tracking
- Fee reports

#### **7. Exams Feature** (`features/exams/`)
- Exam management
- Exam schedule
- Mark entry
- Result generation

#### **8. Attendance Feature** (`features/attendance/`)
- Attendance marking
- Attendance reports
- Student attendance view
- Class attendance view

#### **9. Accounts Feature** (`features/accounts/`)
- Account categories
- Transactions
- Income/Expense tracking
- Financial reports

#### **10. Settings Feature** (`features/settings/`)
- User management
- Role management
- Permission management
- System settings

#### **11. Other Features**
- Grades
- Sections
- Subjects
- Departments
- Holidays
- Leaves
- Library
- Transport
- Timetable
- Events
- Admissions
- Communications
- Imports
- Invoices
- Branch Transfers

---

## Shared Module

The Shared module contains reusable components, directives, pipes, and services used across multiple features.

### Shared Components

#### **1. DataTableComponent** (`shared/components/data-table/`)
- Reusable data table
- Sorting, filtering, pagination
- Column configuration
- Export functionality

#### **2. AdvancedSearchSidebar** (`shared/components/advanced-search-sidebar/`)
- Advanced search interface
- Multiple filter criteria
- Search persistence

#### **3. FileUploadComponent** (`shared/components/file-upload/`)
- File upload interface
- Drag & drop support
- File preview
- Progress indicator

#### **4. UniversalAttachmentsComponent** (`shared/components/universal-attachments/`)
- Attachment management
- File upload/download
- Attachment list

#### **5. Charts Components** (`shared/components/charts/`)
- Chart.js integration
- Various chart types
- Data visualization

#### **6. ExportButtonComponent** (`shared/components/export-button/`)
- Export functionality
- Multiple format support

### Shared Services

#### **ExportService** (`shared/services/export.service.ts`)
- Data export functionality
- Excel/PDF/CSV export
- Export configuration

### Shared Pipes

#### **IndianCurrencyPipe** (`shared/pipes/indian-currency.pipe.ts`)
- Currency formatting
- Indian Rupee format

### Shared Modules

#### **MaterialModule** (`shared/modules/material/`)
- Angular Material imports
- Reusable Material components

---

## Routing System

### Route Configuration

Routes are defined in `app.routes.ts` with lazy loading:

```typescript
{
  path: 'students',
  loadChildren: () => import('./features/students/students.routes')
    .then(m => m.STUDENTS_ROUTES),
  canActivate: [permissionGuard],
  data: { permissions: 'students.view' }
}
```

### Route Guards

- **AuthGuard**: Ensures user is authenticated
- **GuestGuard**: Ensures user is not authenticated
- **PermissionGuard**: Checks user permissions
- **RoleGuard**: Checks user roles

### Route Data

Routes can include metadata:
- `permissions`: Required permissions
- `permissionMode`: 'any' or 'all' (default: 'all')
- `roles`: Required roles

### Lazy Loading

All feature modules are lazy-loaded:
- Reduces initial bundle size
- Faster initial load time
- On-demand module loading

---

## State Management

### State Management Approach

The application uses **RxJS Observables** and **Angular Signals** for state management:

1. **Services as State Containers**
   - Services hold application state
   - BehaviorSubject/Observable for reactive state
   - Signals for Angular 21+ reactive state

2. **Component State**
   - Local component state
   - Input/Output properties
   - ViewChild/ContentChild

3. **Shared State**
   - Core services (AuthService, BranchService)
   - Feature services
   - Shared services

### State Examples

#### **AuthService State**
```typescript
private currentUser = signal<User | null>(null);
private isAuthenticated = signal<boolean>(false);
```

#### **BranchService State**
```typescript
private currentBranch = signal<Branch | null>(null);
private accessibleBranches = signal<Branch[]>([]);
```

---

## Authentication & Authorization

### Authentication Flow

1. **Login**
   - User enters credentials
   - AuthService calls `/api/login`
   - Token stored in localStorage
   - User data stored in service
   - Redirect to dashboard

2. **Token Management**
   - Token stored: `localStorage.getItem('auth_token')`
   - Token added to requests via AuthInterceptor
   - Token validation on app initialization
   - Auto-logout on token expiry

3. **Logout**
   - Clear token from localStorage
   - Clear user data
   - Redirect to login

### Authorization Implementation

#### **Route-Level Authorization**
- PermissionGuard checks permissions
- RoleGuard checks roles
- Unauthorized access redirects

#### **Component-Level Authorization**
- HasPermissionDirective for conditional rendering
- Service methods for permission checks

#### **API-Level Authorization**
- Backend validates permissions
- Frontend handles 403 responses

---

## API Integration

### API Service

**Base URL Configuration:**
```typescript
// environments/environment.development.ts
apiUrl: 'http://localhost:8000/api'
```

### API Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  meta?: PaginationMeta;
}
```

### Error Handling

1. **HTTP Interceptors**
   - ErrorInterceptor catches HTTP errors
   - Transforms error responses
   - Shows user-friendly messages

2. **Service-Level Error Handling**
   - Try-catch in services
   - Error logging
   - User notifications

3. **Component-Level Error Handling**
   - Error display in UI
   - Retry mechanisms
   - Fallback UI

### Request/Response Flow

```
Component
  ↓
Service (Feature Service)
  ↓
ApiService (Core Service)
  ↓
AuthInterceptor
  ↓
ErrorInterceptor
  ↓
Backend API
```

---

## UI Components

### Angular Material Components

The application extensively uses Angular Material:

- **Navigation**: MatSidenav, MatToolbar, MatMenu
- **Forms**: MatFormField, MatInput, MatSelect, MatCheckbox, MatRadio
- **Data Display**: MatTable, MatCard, MatList, MatChip
- **Feedback**: MatSnackbar, MatDialog, MatProgressBar
- **Layout**: MatGridList, MatExpansionPanel
- **Buttons**: MatButton, MatIconButton, MatFab

### Custom Components

- Data tables with advanced features
- Search sidebars
- File upload components
- Chart components
- Export buttons

### Component Communication

1. **Parent-Child**: @Input/@Output
2. **Child-Parent**: EventEmitter
3. **Sibling Components**: Shared Service
4. **Global State**: Core Services

---

## Styling Architecture

### Style Organization

```
styles/
├── material-theme.scss        # Material Design Theme
├── variables.scss             # SCSS Variables
├── mixins.scss                # SCSS Mixins
├── global.scss                # Global Styles
└── *.scss                     # Feature-specific Styles
```

### Styling Approach

1. **Component Styles**
   - Scoped styles (ViewEncapsulation)
   - Component-specific SCSS files

2. **Global Styles**
   - Material theme customization
   - Global utilities
   - Typography

3. **Material Theming**
   - Custom color palette
   - Typography configuration
   - Component theme overrides

### Responsive Design

- Angular Material responsive utilities
- CSS Grid and Flexbox
- Media queries
- Mobile-first approach

---

## Build & Deployment

### Build Configurations

**Development:**
```bash
ng serve --configuration=development
```
- Source maps enabled
- No optimization
- Hot module replacement

**Production:**
```bash
ng build --configuration=production
```
- Code minification
- Tree shaking
- AOT compilation
- Bundle optimization

**Testing:**
```bash
ng build --configuration=testing
```
- Optimized build
- Source maps disabled
- Production-like environment

### Build Output

```
dist/ui-app/
├── index.html
├── main.[hash].js
├── polyfills.[hash].js
├── styles.[hash].css
└── assets/
```

### Environment Files

- `environment.ts` - Default
- `environment.development.ts` - Development
- `environment.production.ts` - Production
- `environment.testing.ts` - Testing

### Deployment Steps

1. **Build Application**
   ```bash
   ng build --configuration=production
   ```

2. **Deploy to Server**
   - Copy `dist/ui-app/` contents to web server
   - Configure web server (Apache/Nginx)
   - Set up routing for SPA

3. **Configure API URL**
   - Update `environment.production.ts`
   - Set correct API base URL

4. **Server Configuration**
   - Enable URL rewriting for SPA routing
   - Configure CORS if needed
   - Set up HTTPS

---

## Performance Optimizations

### Lazy Loading

- All feature modules lazy-loaded
- Reduces initial bundle size
- Faster initial load

### OnPush Change Detection

- Use OnPush change detection strategy
- Reduces change detection cycles
- Better performance

### TrackBy Functions

- Use trackBy in *ngFor loops
- Prevents unnecessary DOM updates
- Improves list rendering performance

### Image Optimization

- Lazy loading images
- Optimized image formats
- Responsive images

### Bundle Optimization

- Tree shaking
- Code splitting
- Minification
- Compression

### Caching Strategy

- HTTP caching headers
- Service worker (if implemented)
- LocalStorage for user preferences

---

## Testing Strategy

### Test Structure

```
src/app/
├── *.component.spec.ts        # Component tests
└── *.service.spec.ts          # Service tests
```

### Testing Tools

- **Jasmine**: Testing framework
- **Karma**: Test runner
- **Angular Testing Utilities**: Component testing

### Test Types

1. **Unit Tests**
   - Service testing
   - Component logic testing
   - Pipe testing

2. **Integration Tests**
   - Component integration
   - Service integration
   - Route testing

### Running Tests

```bash
ng test                    # Run tests
ng test --watch            # Watch mode
ng test --code-coverage    # With coverage
```

---

## Best Practices

### Code Organization
- Feature-based structure
- Separation of concerns
- Reusable components
- DRY principle

### TypeScript
- Strong typing
- Interface definitions
- Type safety
- Strict mode enabled

### Angular Patterns
- Use services for business logic
- Keep components thin
- Use reactive forms
- Implement proper error handling

### Performance
- Lazy load modules
- Use OnPush change detection
- Optimize bundle size
- Minimize HTTP requests

### Accessibility
- Semantic HTML
- ARIA attributes
- Keyboard navigation
- Screen reader support

### Security
- Input validation
- XSS prevention
- Secure token storage
- HTTPS in production

---

## Development Workflow

### Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Copy `environment.development.ts`
   - Set API URL

3. **Start Development Server**
   ```bash
   npm start
   # or
   ng serve
   ```

### Development Commands

```bash
ng serve              # Start dev server
ng build              # Build application
ng test               # Run tests
ng lint               # Lint code
ng generate component # Generate component
ng generate service   # Generate service
```

### Code Generation

Angular CLI generators:
- Components
- Services
- Guards
- Interceptors
- Modules
- Pipes
- Directives

---

## Conclusion

This frontend architecture provides a modern, scalable, and maintainable Angular application. The feature-based structure ensures code organization, lazy loading optimizes performance, and the core module provides a solid foundation for the entire application.

The integration with Angular Material provides a consistent, accessible UI, while the service layer ensures clean separation of concerns and testability.





