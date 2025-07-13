import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';
import {
  ApiResponse,
  CreateDeliveryRequestDto,
  DeliveryRequestResponseDto,
  UpdateDeliveryStatusDto,
  TripListDto,
  SelectTripDto,
  DeliveryStatus,
} from '../../model/delivery.model';
import { catchError, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DeliveryService {
  private baseUrl = `${environment.apiUrl}/Delivery`;

  constructor(private http: HttpClient, private authService: AuthService) {
    console.log('DeliveryService initialized with baseUrl:', this.baseUrl);
  }

  // Get headers with auth token
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  // Create a new delivery request
  createDeliveryRequest(
    requestData: CreateDeliveryRequestDto
  ): Observable<ApiResponse<DeliveryRequestResponseDto>> {
    return this.http.post<ApiResponse<DeliveryRequestResponseDto>>(
      `${this.baseUrl}`,
      requestData,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError('Create delivery request'))
    );
  }

  // Get matching trips for a delivery request
  getMatchingTrips(requestId: number): Observable<ApiResponse<TripListDto[]>> {
    return this.http.get<ApiResponse<TripListDto[]>>(
      `${this.baseUrl}/matching-trips/${requestId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError('Get matching trips'))
    );
  }

  // Get all pending delivery requests (for drivers)
  getPendingRequests(
    tripId?: number
  ): Observable<ApiResponse<DeliveryRequestResponseDto[]>> {
    let params = new HttpParams();
    if (tripId) {
      params = params.set('tripId', tripId.toString());
    }
    return this.http.get<ApiResponse<DeliveryRequestResponseDto[]>>(
      `${this.baseUrl}/pending`,
      {
        headers: this.getHeaders(),
        params: params,
      }
    ).pipe(
      catchError(this.handleError('Get pending requests'))
    );
  }

  // Get delivery requests selected for driver's trips
  getSelectedForMe(): Observable<ApiResponse<DeliveryRequestResponseDto[]>> {
    console.log('Fetching selected deliveries for current user');
    return this.http.get<ApiResponse<DeliveryRequestResponseDto[]>>(
      `${this.baseUrl}/selected-for-me`,
      { headers: this.getHeaders() }
    ).pipe(
      retry(1), // Retry once before failing
      catchError(this.handleError('Get selected deliveries'))
    );
  }

  // Get user's delivery requests
  getMyRequests(): Observable<ApiResponse<DeliveryRequestResponseDto[]>> {
    return this.http.get<ApiResponse<DeliveryRequestResponseDto[]>>(
      `${this.baseUrl}/my-requests`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError('Get my requests'))
    );
  }

  // Get driver's deliveries
  getMyDeliveries(): Observable<ApiResponse<DeliveryRequestResponseDto[]>> {
    return this.http.get<ApiResponse<DeliveryRequestResponseDto[]>>(
      `${this.baseUrl}/my-deliveries`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError('Get my deliveries'))
    );
  }

  // Accept a delivery request (for drivers)
  acceptDelivery(
    requestId: number,
    tripId: number
  ): Observable<ApiResponse<DeliveryRequestResponseDto>> {
    return this.http.post<ApiResponse<DeliveryRequestResponseDto>>(
      `${this.baseUrl}/${requestId}/accept?tripId=${tripId}`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError('Accept delivery'))
    );
  }

  // Reject a delivery request (for drivers)
  rejectDelivery(
    requestId: number
  ): Observable<ApiResponse<DeliveryRequestResponseDto>> {
    return this.http.post<ApiResponse<DeliveryRequestResponseDto>>(
      `${this.baseUrl}/${requestId}/reject`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError('Reject delivery'))
    );
  }

  // Update delivery status (for drivers)
  updateDeliveryStatus(
    requestId: number,
    statusData: UpdateDeliveryStatusDto
  ): Observable<ApiResponse<DeliveryRequestResponseDto>> {
    return this.http.put<ApiResponse<DeliveryRequestResponseDto>>(
      `${this.baseUrl}/${requestId}/status`,
      statusData,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError('Update delivery status'))
    );
  }

  // Cancel a delivery request
  cancelRequest(
    requestId: number
  ): Observable<ApiResponse<DeliveryRequestResponseDto>> {
    return this.http.post<ApiResponse<DeliveryRequestResponseDto>>(
      `${this.baseUrl}/${requestId}/cancel`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError('Cancel delivery request'))
    );
  }

  // Get delivery request by ID
  getDeliveryRequest(
    id: number
  ): Observable<ApiResponse<DeliveryRequestResponseDto>> {
    return this.http.get<ApiResponse<DeliveryRequestResponseDto>>(
      `${this.baseUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError('Get delivery request'))
    );
  }

  // Select a specific trip for a delivery request (TripSelected status)
  selectTripForDelivery(
    requestId: number,
    selectTripData: SelectTripDto
  ): Observable<ApiResponse<DeliveryRequestResponseDto>> {
    return this.http.post<ApiResponse<DeliveryRequestResponseDto>>(
      `${this.baseUrl}/${requestId}/select-trip`,
      selectTripData,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError('Select trip for delivery'))
    );
  }

  // Check for expired delivery requests (admin only)
  checkExpiredRequests(): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(
      `${this.baseUrl}/check-expired`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError('Check expired requests'))
    );
  }

  // Generic error handler
  private handleError(operation: string) {
    return (error: any): Observable<any> => {
      console.error(`${operation} failed:`, error);
      
      // Check if it's a network error (status 0)
      if (error.status === 0) {
        console.error('Network error detected. API server might be down or unreachable.');
      }
      
      // Return a user-friendly error message
      return throwError(() => ({
        success: false,
        message: `Failed to ${operation.toLowerCase()}: ${error.message || 'Server unreachable'}`,
        data: null
      }));
    };
  }
}
