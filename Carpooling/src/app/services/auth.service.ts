import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userRole: number;
  ssn: string;
  drivingLicenseImage: string;
  national_ID_Image: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    userRole: number;
    token: string;
    tokenExpiration: string;
    isVerified: boolean;
    isEmailConfirmed: boolean;
  };
  errors: string[];
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  data?: boolean;
  errors?: string[];
}

export interface DocumentVerificationDto {
  id: number;
  userId: string;
  userFullName: string;
  documentType: string;
  documentImage: string;
  status: 'Pending' | 'UnderReview' | 'Approved' | 'Rejected';
  submissionDate: string;
}

export interface DocumentVerificationsResponse {
  success: boolean;
  message: string;
  data?: DocumentVerificationDto[];
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'https://localhost:7262/api';

  constructor(private http: HttpClient) {}

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<RegisterResponse>(`${this.baseUrl}/Auth/register`, userData, {
      headers
    });
  }

  login(loginData: LoginRequest): Observable<LoginResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<LoginResponse>(`${this.baseUrl}/Auth/login`, loginData, {
      headers
    });
  }

  verifyPassengerNationalId(nationalIdImage: File): Observable<VerificationResponse> {
    const formData = new FormData();
    formData.append('NationalIdImage', nationalIdImage);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.post<VerificationResponse>(`${this.baseUrl}/User/passenger/verify`, formData, {
      headers
    });
  }

  getDocumentVerifications(): Observable<DocumentVerificationsResponse> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.get<DocumentVerificationsResponse>(`${this.baseUrl}/User/documents/status`, {
      headers
    });
  }

  // Store token in localStorage
  storeToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Store user data
  storeUserData(userData: any): void {
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  // Get user data
  getUserData(): any {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    const token = this.getToken();
    return token !== null;
  }

  // Logout
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  }
}