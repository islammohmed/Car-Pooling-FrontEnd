# 🚗 Ride Connect

A modern Angular-based frontend application for the Ride Connect system. This application provides an intuitive user interface for managing carpooling trips, deliveries, user profiles, and administrative functions.

## 🚀 Features

### Core Functionality
- **User Authentication**: Registration, login, password reset, and email confirmation
- **Trip Management**: Create, search, book, and manage carpooling trips
- **Delivery System**: Create and manage delivery requests alongside trips
- **User Profiles**: Complete profile management with document upload
- **Driver Registration**: Become a driver with document verification
- **Real-time Notifications**: User notifications and updates
- **Admin Dashboard**: User management and system oversight

### User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern UI**: Built with Angular Material components
- **Intuitive Navigation**: Clean and user-friendly interface
- **Form Validation**: Comprehensive client-side validation
- **Loading States**: Smooth loading indicators and transitions

## 🏗️ Architecture

### Technology Stack
- **Framework**: Angular 17+
- **Language**: TypeScript
- **UI Library**: Angular Material
- **State Management**: Angular Services + RxJS
- **HTTP Client**: Angular HttpClient
- **Routing**: Angular Router
- **Build Tool**: Angular CLI
- **Package Manager**: npm

### Project Structure
```
src/
├── app/
│   ├── components/           # Feature components
│   │   ├── account/         # User account management
│   │   ├── admin/           # Admin dashboard components
│   │   ├── auth/            # Authentication components
│   │   ├── delivery/        # Delivery management
│   │   ├── feedback/        # Feedback and rating system
│   │   ├── home/            # Home page components
│   │   ├── shared/          # Shared components (navbar, footer)
│   │   ├── trip/            # Trip management
│   │   └── user/            # User profile components
│   ├── core/                # Core services and guards
│   │   ├── guards/          # Route guards
│   │   ├── interceptors/    # HTTP interceptors
│   │   ├── models/          # Data models and interfaces
│   │   └── services/        # Core services
│   ├── features/            # Feature modules
│   └── shared/              # Shared utilities and components
├── assets/                  # Static assets (images, icons)
├── environments/            # Environment configurations
└── styles/                  # Global styles
```

## 📋 Prerequisites

Before running this application, ensure you have:

- **Node.js** (v18 or later)
- **npm** (v8 or later) or **yarn**
- **Angular CLI** (`npm install -g @angular/cli`)
- **Backend API** running (see backend README for setup)

## 📱 Application Features

### Authentication Module
- **Registration**: User registration with email verification
- **Login**: Secure authentication with JWT tokens
- **Password Reset**: Forgot password functionality
- **Email Confirmation**: Email verification for new accounts

### Trip Management
- **Create Trip**: Drivers can create new carpooling trips
- **Search Trips**: Advanced search with filters (date, location, price)
- **Book Trip**: Passengers can book available trips
- **My Trips**: View created and booked trips
- **Trip Details**: Detailed view with participant information

### Delivery System
- **Create Delivery**: Request package delivery alongside trips
- **My Deliveries**: Track delivery requests
- **Delivery Status**: Real-time status updates
- **Matching**: Find trips that match delivery requirements

### User Management
- **Profile Management**: Update personal information
- **Document Upload**: Upload driver license and national ID
- **Driver Registration**: Become a verified driver
- **Verification Status**: Track document verification progress

### Admin Dashboard
- **User Management**: View and manage all users
- **Document Verification**: Approve or reject driver documents
- **System Statistics**: View application metrics
- **User Blocking**: Block/unblock problematic users

### Feedback System
- **Submit Feedback**: Rate trips and provide reviews
- **View Feedback**: See feedback for users and trips
- **Rating System**: Star-based rating system

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Route Guards**: Protected routes for authenticated users
- **HTTP Interceptors**: Automatic token handling
- **Input Validation**: Client-side form validation
- **XSS Protection**: Built-in Angular security features
- **CORS Configuration**: Proper cross-origin resource sharing

## 🎨 UI/UX Features

### Angular Material Components
- **Responsive Design**: Mobile-first approach
- **Material Design**: Google's Material Design principles
- **Loading States**: Skeleton loaders and progress indicators

### User Experience
- **Intuitive Navigation**: Clear navigation structure
- **Form Validation**: Real-time validation feedback
- **Error Handling**: User-friendly error messages
- **Success Feedback**: Confirmation messages and notifications
- **Responsive Layout**: Works on all device sizes



---

**Note**: This frontend application is part of a full-stack Ride Connect system. Make sure the backend API is running before testing the frontend features.
