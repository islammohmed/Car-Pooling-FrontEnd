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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'https://localhost:7262/api/Auth';

  constructor(private http: HttpClient) {}

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<RegisterResponse>(`${this.baseUrl}/register`, userData, {
      headers
    });
  }

  login(loginData: LoginRequest): Observable<LoginResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, loginData, {
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