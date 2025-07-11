import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface DocumentVerificationDto {
  id: number;
  userId: string;
  userFullName: string;
  documentType: string;
  documentImage: string;
  status: string;
  submissionDate: Date;
}

export interface DocumentVerificationActionDto {
  documentId: number;
  newStatus: string;
  rejectionReason?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  
  private baseUrl = environment.apiUrl + '/Admin';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Get headers with auth token
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Get pending document verifications
  getPendingDocuments(): Observable<ApiResponse<DocumentVerificationDto[]>> {
    return this.http.get<ApiResponse<DocumentVerificationDto[]>>(
      `${this.baseUrl}/documents/pending`,
      { headers: this.getHeaders() }
    );
  }

  // Get user documents
  getUserDocuments(userId: string): Observable<ApiResponse<DocumentVerificationDto[]>> {
    return this.http.get<ApiResponse<DocumentVerificationDto[]>>(
      `${this.baseUrl}/documents/user/${userId}`,
      { headers: this.getHeaders() }
    );
  }

  // Verify document
  verifyDocument(actionDto: DocumentVerificationActionDto): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(
      `${this.baseUrl}/documents/verify`,
      actionDto,
      { headers: this.getHeaders() }
    );
  }
} 