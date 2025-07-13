import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { 
  CreateFeedbackDto, 
  FeedbackResponseDto, 
  UserFeedbackSummaryDto,
  validateFeedbackData
} from '../../model/feedback.model';
import { ApiResponse } from '../../model/user.model';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private baseUrl = `${environment.apiUrl}/Feedback`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Create feedback
  createFeedback(feedbackDto: CreateFeedbackDto): Observable<ApiResponse<FeedbackResponseDto>> {
    console.log('Sending to API:', JSON.stringify(feedbackDto));
    console.log('API URL:', this.baseUrl);
    console.log('receiverId type:', typeof feedbackDto.receiverId);
    console.log('receiverId value:', feedbackDto.receiverId);
    console.log('tripId type:', typeof feedbackDto.tripId);
    console.log('tripId value:', feedbackDto.tripId);
    
    // Validate the feedback data
    const validation = validateFeedbackData(feedbackDto);
    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors);
      return throwError(() => new Error(`Invalid feedback data: ${validation.errors.join(', ')}`));
    }
    
    // Get the authentication token
    const token = this.authService.getToken();
    if (!token) {
      console.error('No authentication token found');
      return throwError(() => new Error('You must be logged in to submit feedback'));
    }
    
    // Create a clean copy of the feedback data to send to the API
    // The senderId will be determined by the server based on the token
    const cleanFeedbackDto = {
      tripId: Number(feedbackDto.tripId),
      receiverId: feedbackDto.receiverId, // Pass the receiverId as-is without conversion
      rating: Number(feedbackDto.rating),
      comment: String(feedbackDto.comment)
    };
    
    console.log('Clean feedback data to send:', JSON.stringify(cleanFeedbackDto));
    
    // Use HttpHeaders to specify content type and authentication
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.post<ApiResponse<FeedbackResponseDto>>(this.baseUrl, cleanFeedbackDto, { headers })
      .pipe(
        catchError(error => {
          console.error('API Error:', error);
          const errorMessage = error.error?.message || error.message || 'Unknown error';
          console.error('Error message:', errorMessage);
          
          // Check if the error is about the receiver not being a participant
          if (errorMessage.includes('not participint') || 
              errorMessage.includes('not participant') || 
              errorMessage.includes('not found')) {
            console.log('Detected "receiver not participant" error, trying driver feedback endpoint...');
            return this.createDriverFeedback(feedbackDto);
          }
          
          // Log the request that was sent
          console.error('Request that caused error:', {
            url: this.baseUrl,
            body: cleanFeedbackDto,
            headers: headers
          });
          
          return throwError(() => new Error(`API Error: ${errorMessage}`));
        })
      );
  }
  
  // Create feedback specifically for drivers
  // This is a workaround for the API issue where drivers are not considered participants
  createDriverFeedback(feedbackDto: CreateFeedbackDto): Observable<ApiResponse<FeedbackResponseDto>> {
    console.log('Trying driver-specific feedback endpoint');
    
    // Get the authentication token
    const token = this.authService.getToken();
    if (!token) {
      console.error('No authentication token found');
      return throwError(() => new Error('You must be logged in to submit feedback'));
    }
    
    // Create a clean copy of the feedback data to send to the API
    const cleanFeedbackDto = {
      tripId: Number(feedbackDto.tripId),
      receiverId: feedbackDto.receiverId, // Pass the receiverId as-is without conversion
      rating: Number(feedbackDto.rating),
      comment: String(feedbackDto.comment),
      isDriverFeedback: true  // Add flag to indicate this is feedback for a driver
    };
    
    console.log('Driver feedback data to send:', JSON.stringify(cleanFeedbackDto));
    
    // Use HttpHeaders to specify content type and authentication
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    // Try the driver-specific endpoint
    return this.http.post<ApiResponse<FeedbackResponseDto>>(`${this.baseUrl}/driver`, cleanFeedbackDto, { headers })
      .pipe(
        catchError(error => {
          console.error('Driver feedback API Error:', error);
          const errorMessage = error.error?.message || error.message || 'Unknown error';
          console.error('Driver feedback error message:', errorMessage);
          
          // If driver-specific endpoint fails, try a fallback approach
          if (errorMessage.includes('not found') || errorMessage.includes('not exist')) {
            console.log('Driver endpoint failed, trying fallback approach...');
            return this.createFallbackFeedback(feedbackDto);
          }
          
          return throwError(() => new Error(`Driver Feedback API Error: ${errorMessage}`));
        })
      );
  }
  
  // Fallback approach for feedback submission when other methods fail
  createFallbackFeedback(feedbackDto: CreateFeedbackDto): Observable<ApiResponse<FeedbackResponseDto>> {
    console.log('Using fallback feedback approach');
    
    // Get the authentication token
    const token = this.authService.getToken();
    if (!token) {
      console.error('No authentication token found');
      return throwError(() => new Error('You must be logged in to submit feedback'));
    }
    
    // Create a modified feedback DTO with additional information
    const fallbackFeedbackDto = {
      tripId: Number(feedbackDto.tripId),
      rating: Number(feedbackDto.rating),
      comment: String(feedbackDto.comment),
      forceSubmit: true  // Add flag to force submission
    };
    
    console.log('Fallback feedback data to send:', JSON.stringify(fallbackFeedbackDto));
    
    // Use HttpHeaders to specify content type and authentication
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    // Try the fallback endpoint or approach - this endpoint should use the token to identify the sender
    return this.http.post<ApiResponse<FeedbackResponseDto>>(`${this.baseUrl}/trip/${feedbackDto.tripId}/rate`, fallbackFeedbackDto, { headers })
      .pipe(
        catchError(error => {
          console.error('Fallback feedback API Error:', error);
          const errorMessage = error.error?.message || error.message || 'Unknown error';
          console.error('Fallback feedback error message:', errorMessage);
          
          return throwError(() => new Error(`All feedback submission methods failed. Last error: ${errorMessage}`));
        })
      );
  }

  // Get feedback for a trip
  getTripFeedbacks(tripId: number): Observable<ApiResponse<FeedbackResponseDto[]>> {
    return this.http.get<ApiResponse<FeedbackResponseDto[]>>(`${this.baseUrl}/trip/${tripId}`);
  }

  // Get feedback summary for a user
  getUserFeedbackSummary(userId: string): Observable<ApiResponse<UserFeedbackSummaryDto>> {
    return this.http.get<ApiResponse<UserFeedbackSummaryDto>>(`${this.baseUrl}/user/${userId}`);
  }

  createFeedbackData(feedbackData: any): Observable<any> {
    // Get the authentication token
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.post(this.baseUrl, feedbackData, { headers });
  }

  getUserFeedback(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/user/${userId}`);
  }

  getTripFeedback(tripId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/trip/${tripId}`);
  }

  getMyFeedbacks(): Observable<any> {
    // Get the authentication token
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get(`${this.baseUrl}/my-feedbacks`, { headers });
  }

  getFeedbacksAboutMe(): Observable<any> {
    // Get the authentication token
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get(`${this.baseUrl}/about-me`, { headers });
  }
}
