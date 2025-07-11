import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  DocumentVerificationDto, 
  PassengerVerificationDto, 
  DriverVerificationDto,
  UpdateDocumentDto,
  DriverRegistrationDto,
  ApiResponse,
  UserDto
} from '../model/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = `${environment.apiUrl}/User`;
  private adminUrl = `${environment.apiUrl}/Admin`;

  constructor(private http: HttpClient) { }

  // Get all users (admin only)
  getAllUsers(): Observable<ApiResponse<UserDto[]>> {
    return this.http.get<ApiResponse<UserDto[]>>(`${this.baseUrl}`);
  }

  // Get user by ID
  getUserById(userId: string): Observable<ApiResponse<UserDto>> {
    return this.http.get<ApiResponse<UserDto>>(`${this.baseUrl}/${userId}`);
  }

  // Block user (admin only)
  blockUser(userId: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.adminUrl}/users/${userId}/block`, {});
  }

  // Unblock user (admin only)
  unblockUser(userId: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.adminUrl}/users/${userId}/unblock`, {});
  }

  // Delete user (admin only)
  deleteUser(userId: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.adminUrl}/users/${userId}`);
  }

  // Verify passenger national ID
  verifyPassengerNationalId(verificationDto: FormData): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/passenger/verify`, verificationDto);
  }

  // Update document
  updateDocument(updateDto: FormData): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/document/update`, updateDto);
  }

  // Get user document verifications
  getDocumentVerifications(): Observable<ApiResponse<DocumentVerificationDto[]>> {
    return this.http.get<ApiResponse<DocumentVerificationDto[]>>(`${this.baseUrl}/documents/status`);
  }

  // Get driver verification status
  getDriverVerificationStatus(): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.baseUrl}/driver/verification-status`);
  }

  // Register as driver
  registerAsDriver(driverDto: FormData): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/driver/register`, driverDto);
  }

  // Helper method to prepare FormData for passenger verification
  preparePassengerVerificationFormData(dto: PassengerVerificationDto): FormData {
    const formData = new FormData();
    formData.append('nationalIdImage', dto.nationalIdImage);
    return formData;
  }

  // Helper method to prepare FormData for driver verification
  prepareDriverVerificationFormData(dto: DriverVerificationDto): FormData {
    const formData = new FormData();
    if (dto.nationalIdImage) {
      formData.append('nationalIdImage', dto.nationalIdImage);
    }
    if (dto.drivingLicenseImage) {
      formData.append('drivingLicenseImage', dto.drivingLicenseImage);
    }
    if (dto.carLicenseImage) {
      formData.append('carLicenseImage', dto.carLicenseImage);
    }
    return formData;
  }

  // Helper method to prepare FormData for document update
  prepareUpdateDocumentFormData(dto: UpdateDocumentDto): FormData {
    const formData = new FormData();
    formData.append('documentType', dto.documentType);
    formData.append('documentFile', dto.documentFile);
    return formData;
  }

  // Helper method to prepare FormData for driver registration
  prepareDriverRegistrationFormData(dto: DriverRegistrationDto): FormData {
    const formData = new FormData();
    formData.append('nationalIdImage', dto.nationalIdImage);
    formData.append('drivingLicenseImage', dto.drivingLicenseImage);
    formData.append('carLicenseImage', dto.carLicenseImage);
    formData.append('model', dto.model);
    formData.append('color', dto.color);
    formData.append('plateNumber', dto.plateNumber);
    return formData;
  }

  getUserProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/profile`);
  }
  
  // Get available drivers
  getAvailableDrivers(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/available-drivers`);
  }

  updateUserProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/profile`, profileData);
  }

  uploadDrivingLicense(fileData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/driving-license`, fileData);
  }

  uploadNationalId(fileData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/national-id`, fileData);
  }

  getDocumentVerificationStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/verification-status`);
  }

  // Admin methods
  getPendingDocumentVerifications(): Observable<any> {
    return this.http.get(`${this.adminUrl}/pending-verifications`);
  }

  approveDocument(documentId: string): Observable<any> {
    return this.http.post(`${this.adminUrl}/approve-document/${documentId}`, {});
  }

  rejectDocument(documentId: string, reason: string): Observable<any> {
    return this.http.post(`${this.adminUrl}/reject-document/${documentId}`, { reason });
  }
}
