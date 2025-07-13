import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { TripStatus } from '../../model/enums.model';
import { 
  Trip, 
  TripListDto, 
  CreateTripDto,  
  BookTripDto, 
  CancelTripDto,
  PaginationParams,
  PaginatedResponse,
  TripDto,
  TripParticipantDto
} from '../../model/trip.model';
import { ApiResponse } from '../../model/user.model';

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private baseUrl = `${environment.apiUrl}/Trip`;
  
  constructor(private http: HttpClient) {
    console.log('TripService initialized with baseUrl:', this.baseUrl);
  }

  // Get all trips with pagination
  getAllTrips(params: PaginationParams): Observable<PaginatedResponse<TripListDto>> {
    const queryParams = `?pageNumber=${params.pageNumber}&pageSize=${params.pageSize}`;
    return this.http.get<PaginatedResponse<TripListDto>>(`${this.baseUrl}${queryParams}`);
  }

  // Get trip by ID
  getTripById(tripId: number): Observable<TripDto> {
    console.log(`Fetching trip with ID: ${tripId}`);
    console.log(`API URL: ${this.baseUrl}/${tripId}`);
    
    // Ensure tripId is a valid number
    if (!tripId || isNaN(tripId) || tripId <= 0) {
      console.error('Invalid trip ID:', tripId);
      return throwError(() => new Error('Invalid trip ID'));
    }
    
    // Use the correct API endpoint format
    return this.http.get<any>(`${this.baseUrl}/${tripId}`).pipe(
      map(response => {
        console.log('Raw API Response:', response);
        
        // Handle different API response formats
        let apiTrip: any;
        
        if (response && response.data) {
          // Response is wrapped in ApiResponse format
          console.log('Response is in ApiResponse format');
          apiTrip = response.data.trip;
        } else if (response && (response.id || response.tripId)) {
          // Response is direct trip object
          console.log('Response is direct trip object');
          apiTrip = response;
        } else {
          console.error('Unexpected API response format:', response);
          throw new Error('Trip data not found in API response');
        }
        
        console.log('API Trip before mapping:', JSON.stringify(apiTrip));
        
        // Ensure driverId is preserved exactly as received from API
        const driverId = apiTrip.driverId || '';
        console.log('Driver ID from API:', driverId, 'Type:', typeof driverId);
        
        // Map API response to our TripDto format, handling different response structures
        const mappedTrip: TripDto = {
          id: apiTrip.id || apiTrip.tripId || 0,
          sourceLocation: apiTrip.source || apiTrip.sourceLocation || '',
          sourceLatitude: apiTrip.sourceLatitude || apiTrip.sourceLat || 0,
          sourceLongitude: apiTrip.sourceLongitude || apiTrip.sourceLng || 0,
          sourceCity: apiTrip.sourceCity || '',
          destination: apiTrip.destination || apiTrip.destinationLocation || '',
          destinationLatitute: apiTrip.destinationLatitute || apiTrip.destinationLatitude || 0,
          destinationLongitude: apiTrip.destinationLongitude || 0,
          destinationCity: apiTrip.destinationCity || '',
          departureTime: apiTrip.departureTime || apiTrip.startTime || '',
          availableSeats: apiTrip.availableSeats || 0,
          price: apiTrip.price || apiTrip.pricePerSeat || 0,
          status: apiTrip.status || TripStatus.Pending,
          description: apiTrip.description || apiTrip.tripDescription || '',
          driverId: driverId,
          driverName: apiTrip.driverName || '',
          driverRating: apiTrip.driverRating || 0,
          participants: Array.isArray(apiTrip.participants) ? apiTrip.participants : []
        };
        
        console.log('Mapped trip:', JSON.stringify(mappedTrip));
        return mappedTrip;
      }),
      catchError(error => {
        console.error(`Error fetching trip ${tripId}:`, error);
        return throwError(() => new Error(`Failed to load trip: ${error.message || 'Unknown error'}`));
      })
    );
  }

  // Create a new trip
  createTrip(tripData: any): Observable<any> {
    console.log('Creating trip with data:', JSON.stringify(tripData));
    return this.http.post(`${this.baseUrl}`, tripData).pipe(
      catchError(error => {
        console.error('Error creating trip:', error);
        return throwError(() => new Error(`Failed to create trip: ${error.message || 'Unknown error'}`));
      })
    );
  }

  // Book a trip
  bookTrip(bookingData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/book`, bookingData);
  }

  // Check if user has already booked a trip
  checkBooking(tripId: number): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.baseUrl}/check-booking/${tripId}`);
  }

  // Cancel trip as passenger
  cancelTripAsPassenger(cancelTripDto: CancelTripDto): Observable<ApiResponse<boolean>> {
    // Ensure we're sending the expected properties
    const payload = {
      tripId: cancelTripDto.tripId,
      userId: cancelTripDto.userId,
      cancellationReason: cancelTripDto.cancellationReason || ''
    };
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/cancel/passenger`, payload);
  }

  // Cancel trip as driver
  cancelTripAsDriver(cancelTripDto: CancelTripDto): Observable<ApiResponse<boolean>> {
    // Ensure we're sending the expected properties
    const payload = {
      tripId: cancelTripDto.tripId,
      userId: cancelTripDto.userId,
      cancellationReason: cancelTripDto.cancellationReason || ''
    };
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/cancel/driver`, payload);
  }

  // Complete a trip (driver action)
  completeTrip(tripId: number): Observable<ApiResponse<any>> {
    console.log(`Completing trip with ID: ${tripId}`);
    console.log(`API URL: ${this.baseUrl}/complete/${tripId}`);
    
    // Ensure tripId is a valid number
    if (!tripId || isNaN(tripId) || tripId <= 0) {
      console.error('Invalid trip ID for completion:', tripId);
      return throwError(() => new Error('Invalid trip ID'));
    }
    
    // Convert tripId to number if it's not already
    const numericTripId = Number(tripId);
    
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/complete/${numericTripId}`, {})
      .pipe(
        catchError(error => {
          console.error(`Error completing trip ${tripId}:`, error);
          return throwError(() => new Error(`Failed to complete trip: ${error.message || 'Unknown error'}`));
        })
      );
  }

  // Search for trips based on source, destination, and date
  searchTrips(source: string, destination: string, date: string): Observable<TripListDto[]> {
    let params = new HttpParams()
      .set('source', source)
      .set('destination', destination)
      .set('date', date);

    return this.http.get<any[]>(`${this.baseUrl}/search`, { params }).pipe(
      map(trips => trips.map(apiTrip => ({
        id: apiTrip.tripId,
        source: apiTrip.sourceLocation,
        destination: apiTrip.destination,
        departureTime: apiTrip.startTime,
        availableSeats: apiTrip.availableSeats,
        price: apiTrip.pricePerSeat,
        status: apiTrip.status,
        driverName: apiTrip.driverName,
        driverRating: apiTrip.driverRating || 0,
        driverId: apiTrip.driverId || ''
      })))
    );
  }

  getMyTrips(): Observable<TripListDto[]> {
    return this.http.get<any>(`${this.baseUrl}/my-trips`).pipe(
      map(response => {
        console.log('Raw my-trips response:', response);
        let trips: any[] = [];
        
        if (Array.isArray(response)) {
          trips = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          trips = response.data;
        } else {
          console.error('Unexpected API response format for my-trips:', response);
          return [];
        }
        
        return trips.map(apiTrip => ({
          id: apiTrip.tripId || apiTrip.id || 0,
          source: apiTrip.sourceLocation || apiTrip.source || '',
          destination: apiTrip.destination || apiTrip.destinationLocation || '',
          departureTime: apiTrip.startTime || apiTrip.departureTime || '',
          availableSeats: apiTrip.availableSeats || 0,
          price: apiTrip.pricePerSeat || apiTrip.price || 0,
          status: apiTrip.status || TripStatus.Pending,
          driverName: apiTrip.driverName || '',
          driverRating: apiTrip.driverRating || 0,
          driverId: apiTrip.driverId || ''
        }));
      }),
      catchError(error => {
        console.error('Error fetching my trips:', error);
        return throwError(() => new Error(`Failed to load my trips: ${error.message || 'Unknown error'}`));
      })
    );
  }

  getMyBookings(): Observable<TripListDto[]> {
    return this.http.get<any>(`${this.baseUrl}/my-bookings`).pipe(
      map(response => {
        console.log('Raw my-bookings response:', response);
        let trips: any[] = [];
        
        if (Array.isArray(response)) {
          trips = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          trips = response.data;
        } else {
          console.error('Unexpected API response format for my-bookings:', response);
          return [];
        }
        
        return trips.map(apiTrip => ({
          id: apiTrip.tripId || apiTrip.id || 0,
          source: apiTrip.sourceLocation || apiTrip.source || '',
          destination: apiTrip.destination || apiTrip.destinationLocation || '',
          departureTime: apiTrip.startTime || apiTrip.departureTime || '',
          availableSeats: apiTrip.availableSeats || 0,
          price: apiTrip.pricePerSeat || apiTrip.price || 0,
          status: apiTrip.status || TripStatus.Pending,
          driverName: apiTrip.driverName || '',
          driverRating: apiTrip.driverRating || 0,
          driverId: apiTrip.driverId || ''
        }));
      }),
      catchError(error => {
        console.error('Error fetching my bookings:', error);
        return throwError(() => new Error(`Failed to load my bookings: ${error.message || 'Unknown error'}`));
      })
    );
  }

  // Get trip participants
  getTripParticipants(tripId: number): Observable<TripParticipantDto[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/${tripId}/participants`)
      .pipe(
        map(response => {
          if (response && response.success && Array.isArray(response.data)) {
            // Map API response to our TripParticipantDto format
            return response.data.map(p => ({
              userId: p.userId,
              userName: p.fullName,
              joinStatus: this.mapStatusToJoinStatus(p.status),
              isDriver: p.isDriver || p.userRole === 'Driver',
              seatCount: p.seatCount || 1,
              phoneNumber: p.phoneNumber,
              email: p.email,
              rating: p.rating,
              profileImage: p.profileImage,
              userRole: p.userRole === 'Driver' ? 1 : p.userRole === 'Passenger' ? 0 : 2, // Map string role to enum
              gender: p.gender,
              joinDate: p.joinedAt
            }));
          } else {
            console.warn('Unexpected participants response format:', response);
            return [];
          }
        })
      );
  }

  // Helper method to map status string to JoinStatus enum
  private mapStatusToJoinStatus(status: string): number {
    switch (status) {
      case 'Pending': return 0;
      case 'Approved': 
      case 'Confirmed': return 1;
      case 'Rejected': return 2;
      default: return 0; // Default to Pending
    }
  }
}
