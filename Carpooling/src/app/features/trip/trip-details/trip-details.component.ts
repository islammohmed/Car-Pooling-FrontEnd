import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TripService } from '../../../services/trip.service';
import { AuthService } from '../../../services/auth.service';
import { TripDto, BookTripDto, TripParticipantDto } from '../../../model/trip.model';
import { UserRole, TripStatus, JoinStatus } from '../../../model/enums.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../components/shared/navbar/navbar.component';
import { FooterComponent } from '../../../components/shared/footer/footer.component';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { UserService } from '../../../services/user.service';
import { UserDto } from '../../../model/user.model';

@Component({
  selector: 'app-trip-details',
  templateUrl: './trip-details.component.html',
  styleUrls: ['./trip-details.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent, FooterComponent, RouterModule]
})
export class TripDetailsComponent implements OnInit {
  tripId: number = 0;
  trip: TripDto | null = null;
  loading: boolean = true;
  error: string = '';
  successMessage: string = '';
  bookingForm: FormGroup;
  cancelTripForm: FormGroup;
  isSubmitting: boolean = false;
  UserRole = UserRole;
  TripStatus = TripStatus;
  JoinStatus = JoinStatus;
  hasBooking: boolean = false;
  checkingBooking: boolean = false;
  showCancelForm: boolean = false;
  driverDetails: UserDto | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tripService: TripService,
    private authService: AuthService,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private userService: UserService
  ) {
    this.bookingForm = this.fb.group({
      seatCount: [1, [Validators.required, Validators.min(1), Validators.max(10)]]
    });

    this.cancelTripForm = this.fb.group({
      cancellationReason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id']; // Convert to number
      if (isNaN(id) || id <= 0) {
        this.notificationService.error('Invalid trip ID');
        this.loading = false;
        return;
      }
      this.tripId = id;
      this.loadTripDetails();
    });
  }

  loadTripDetails(): void {
    if (!this.tripId) {
      this.notificationService.error('Trip ID is required');
      this.loading = false;
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    this.tripService.getTripById(this.tripId).subscribe({
      next: (data) => {
        if (!data) {
          this.notificationService.error('Trip not found');
          this.loading = false;
          return;
        }
        
        this.trip = data;
        
        // Load participants separately using the dedicated endpoint
        this.loadTripParticipants();
        
        // Load driver details from API
        if (this.trip!.driverId) {
          this.loadDriverDetails(this.trip!.driverId);
        }
        
        // Check if trip date is in the past
        if (this.trip && new Date(this.trip.departureTime) < new Date()) {
          this.notificationService.warning('This trip is in the past and cannot be booked.');
        }
        
        // Update max seats validator based on available seats
        if (this.trip && this.trip.availableSeats > 0) {
          this.bookingForm.get('seatCount')?.setValidators([
            Validators.required,
            Validators.min(1),
            Validators.max(this.trip.availableSeats)
          ]);
          this.bookingForm.get('seatCount')?.updateValueAndValidity();
        }

        // Check if user has already booked this trip
        this.checkUserBooking();
        
        this.loading = false;
      },
      error: (err) => {
        this.notificationService.error('Failed to load trip details. ' + (err.error?.message || err.message || 'Unknown error'));
        this.loading = false;
      }
    });
  }
  
  loadDriverDetails(driverId: string): void {
    this.userService.getUserById(driverId).subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.driverDetails = response.data;
          
          // Update trip driver rating with the one from user API if available
          if (this.trip && this.driverDetails && this.driverDetails.avgRating !== undefined) {
            this.trip.driverRating = this.driverDetails.avgRating;
          }
        }
      },
      error: (err) => {
        console.error('Failed to load driver details:', err);
      }
    });
  }
  
  // Show cancel trip form
  showCancelTripForm(): void {
    this.showCancelForm = true;
    this.cancelTripForm.reset();
  }
  
  // Hide cancel trip form
  hideCancelTripForm(): void {
    this.showCancelForm = false;
  }
  
  // Cancel trip as driver
  cancelTrip(): void {
    if (!this.trip) {
      this.notificationService.error('Trip details not available.');
      return;
    }
    
    if (!this.isTripDriver()) {
      this.notificationService.error('Only the trip driver can cancel this trip.');
      return;
    }
    
    if (this.cancelTripForm.invalid) {
      this.notificationService.error('Please provide a valid cancellation reason.');
      return;
    }
    
    const userData = this.authService.getUserData();
    if (!userData || !userData.userId) {
      this.notificationService.error('User information not found.');
      return;
    }
    
    this.isSubmitting = true;
    
    const cancelTripDto = {
      tripId: this.tripId,
      userId: userData.userId,
      role: userData.userRole,
      cancellationReason: this.cancelTripForm.get('cancellationReason')?.value
    };
    
    this.tripService.cancelTripAsDriver(cancelTripDto).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response && response.success) {
          this.notificationService.success('Trip cancelled successfully!');
          this.showCancelForm = false;
          
          // Update trip status locally
          if (this.trip) {
            this.trip.status = TripStatus.Cancelled;
          }
          
          // Reload trip details to show updated status
          setTimeout(() => {
            this.loadTripDetails();
          }, 1000);
          
          // Redirect to my trips page after a short delay
          setTimeout(() => {
            this.router.navigate(['/trip/my-trips']);
          }, 2000);
        } else {
          this.notificationService.error(response.message || 'Failed to cancel trip.');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notificationService.error('Failed to cancel trip. ' + (err.error?.message || err.message || 'Unknown error'));
      }
    });
  }
  
  loadTripParticipants(): void {
    if (!this.tripId || !this.trip) {
      return;
    }
    
    // Initialize participants as an empty array if it doesn't exist
    if (!this.trip.participants) {
      this.trip.participants = [];
    }
    
    this.tripService.getTripParticipants(this.tripId).subscribe({
      next: (participants) => {
        if (this.trip) {
          // Ensure we have a valid array of participants
          this.trip.participants = Array.isArray(participants) ? participants : [];
        }
      },
      error: (err) => {
        // Make sure we have at least an empty array
        if (this.trip) {
          this.trip.participants = [];
        }
      }
    });
  }

  checkUserBooking(): void {
    if (!this.isLoggedIn() || !this.tripId) {
      return;
    }
    
    this.checkingBooking = true;
    
    this.tripService.checkBooking(this.tripId).subscribe({
      next: (response) => {
        this.checkingBooking = false;
        if (response && response.success) {
          this.hasBooking = response.data;
          
          // Only show the success message if user has a booking and is not the driver
          if (this.hasBooking && !this.isTripDriver()) {
            this.notificationService.info('You have already booked this trip.');
          }
        }
      },
      error: (err) => {
        this.checkingBooking = false;
        
        // Fallback to the old method if API call fails
        this.hasBooking = this.checkBookingFromParticipants();
      }
    });
  }

  // Fallback method to check booking from participants list
  checkBookingFromParticipants(): boolean {
    const userData = this.authService.getUserData();
    if (!userData || !this.trip) {
      return false;
    }
    
    // Ensure participants is an array
    const participants = Array.isArray(this.trip.participants) ? this.trip.participants : [];
    
    const hasBooking = participants.some(p => 
      p.userId === userData.userId && 
      p.userId !== this.trip?.driverId && 
      p.isDriver !== true
    );
    return hasBooking;
  }

  bookTrip(): void {
    if (this.bookingForm.invalid) {
      this.notificationService.error('Please select a valid number of seats');
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.trip) {
      this.notificationService.error('Trip details not available.');
      return;
    }
    
    // Check if user is the driver of this specific trip
    if (this.isTripDriver()) {
      this.notificationService.error('You cannot book your own trip as you are the driver.');
      return;
    }
    
    // Drivers should be able to book other trips
    
    // Check if trip date is in the past
    if (new Date(this.trip.departureTime) < new Date()) {
      this.notificationService.error('This trip is in the past and cannot be booked.');
      return;
    }

    if (this.trip.availableSeats <= 0 || this.trip.status !== TripStatus.Pending) {
      this.notificationService.error('This trip cannot be booked at the moment.');
      return;
    }

    const userData = this.authService.getUserData();
    if (!userData) {
      this.router.navigate(['/login']);
      return;
    }

    // Check if user has already booked this trip
    if (this.isAlreadyBooked()) {
      this.notificationService.success('You have already booked this trip.');
      return;
    }

    const seatCount = this.bookingForm.get('seatCount')?.value;
    if (!seatCount || seatCount > this.trip.availableSeats) {
      this.notificationService.error(`Only ${this.trip.availableSeats} seats available.`);
      return;
    }

    this.isSubmitting = true;
    
    const bookingData = {
      tripId: this.tripId,
      userId: userData.userId,
      seatCount: seatCount,
      joinedAt: new Date().toISOString()
    };

    this.tripService.bookTrip(bookingData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        
        // Handle the direct response object (not wrapped in success/message)
        if (response && response.tripId) {
          // Set success message
          this.notificationService.success('Trip booked successfully!');
          // Update booking status
          this.hasBooking = true;
          
          // Update local trip data
          if (this.trip) {
            // Initialize participants array if needed
            if (!this.trip.participants) {
              this.trip.participants = [];
            }
            
            // Ensure participants is an array
            if (!Array.isArray(this.trip.participants)) {
              this.trip.participants = [];
            }
            
            // Add current user to participants based on the response
            const newParticipant = {
              userId: response.userId,
              userName: response.fullName,
              joinStatus: response.status === 'Confirmed' ? JoinStatus.Approved : JoinStatus.Pending,
              seatCount: response.seatCount
            };
            
            // Add to participants array if not already there
            if (!this.trip.participants.some(p => p.userId === response.userId)) {
              this.trip.participants.push(newParticipant);
            }
            
            // Update available seats
            this.trip.availableSeats = Math.max(0, this.trip.availableSeats - response.seatCount);
          }
          
          // Redirect to my-bookings page after short delay
          setTimeout(() => {
            this.router.navigate(['/trip/my-bookings']);
          }, 2000);
        } else if (response && response.success === false) {
          // Handle API error response with success property
          this.notificationService.error(response.message || 'Failed to book trip');
        } else {
          // Fallback error
          this.notificationService.error('Failed to book trip');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        
        // Extract the error message from the response if available
        if (err.error && err.error.message) {
          // Handle specific error messages
          if (err.error.message === "Email not confirmed") {
            this.notificationService.error('Your email is not confirmed. Please confirm your email before booking a trip.');
          } else {
            this.notificationService.error(err.error.message);
          }
        } else {
          this.notificationService.error('Failed to book trip. ' + (err.message || 'Unknown error'));
        }
      }
    });
  }

  completeTrip(): void {
    if (!this.trip || this.trip.status !== 'Confirmed') {
      this.notificationService.error('This trip cannot be completed at the moment.');
      return;
    }

    // Only allow driver to complete the trip
    if (!this.isTripDriver()) {
      this.notificationService.error('Only the trip driver can complete this trip.');
      return;
    }

    this.isSubmitting = true;

    this.tripService.completeTrip(this.tripId).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response && response.success) {
          this.notificationService.success('Trip completed successfully!');
          
          // Reload trip details to show updated status
          setTimeout(() => {
            this.loadTripDetails();
          }, 1000);
        } else {
          this.notificationService.error((response && response.message) ? response.message : 'Failed to complete trip');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notificationService.error('Failed to complete trip. ' + (err.error?.message || err.message || 'Unknown error'));
      }
    });
  }

  getUserRole(): UserRole | undefined {
    const userData = this.authService.getUserData();
    return userData ? userData.userRole : undefined;
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isDriver(): boolean {
    const userData = this.authService.getUserData();
    return userData && userData.userRole === UserRole.Driver;
  }

  isPassenger(): boolean {
    const userData = this.authService.getUserData();
    return userData && userData.userRole === UserRole.Passenger;
  }

  isAdmin(): boolean {
    const userData = this.authService.getUserData();
    return userData && userData.userRole === UserRole.Admin;
  }
  
  getUserId(): string | number | undefined {
    const userData = this.authService.getUserData();
    return userData ? userData.userId : undefined;
  }

  isTripDriver(): boolean {
    const userData = this.authService.getUserData();
    
    // Check if user is logged in and is the driver of this trip
    // Use loose equality to handle string/number type differences
    return !!userData && !!this.trip && 
           (userData.userId == this.trip.driverId || 
            Number(userData.userId) === Number(this.trip.driverId));
  }

  isPendingTrip(): boolean {
    if (!this.trip) return false;
    
    // Check if status is the string 'Pending'
    if (this.trip.status === 'Pending') return true;
    
    // Check if status is the enum value TripStatus.Pending (as a string)
    if (String(this.trip.status) === String(TripStatus.Pending)) return true;
    
    return false;
  }

  isAlreadyBooked(): boolean {
    // First check if we have a result from the API call
    if (this.hasBooking) {
      return true;
    }
    
    // Check if user is the driver
    if (this.isTripDriver()) {
      return false; // Driver is not considered "booked"
    }
    
    // Fall back to checking participants if API result is not available
    const userData = this.authService.getUserData();
    if (!userData || !this.trip) {
      return false;
    }
    
    // Ensure participants is an array
    const participants = Array.isArray(this.trip.participants) ? this.trip.participants : [];
    
    // Check if user is in participants list
    return participants.some(p => 
      p.userId === userData.userId && 
      p.userId !== this.trip?.driverId && 
      p.isDriver !== true
    );
  }

  getStatusClass(status: TripStatus): string {
    switch (status) {
      case TripStatus.Pending:
        return 'status-pending';
      case TripStatus.Ongoing:
        return 'status-in-progress';
      case TripStatus.Completed:
        return 'status-completed';
      case TripStatus.Cancelled:
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getStatusText(status: TripStatus): string {
    switch (status) {
      case TripStatus.Pending: return 'Pending';
      case TripStatus.Confirmed: return 'Confirmed';
      case TripStatus.Ongoing: return 'Ongoing';
      case TripStatus.Completed: return 'Completed';
      case TripStatus.Cancelled: return 'Cancelled';
      default: return 'Pending'; // fallback
    }
  }

  /**
   * Returns only the passengers (excludes the driver) from the participants list
   */
  getPassengers(): TripParticipantDto[] {
    if (!this.trip) {
      return [];
    }
    
    // Ensure participants is an array
    const participants = Array.isArray(this.trip.participants) ? this.trip.participants : [];
    
    // Filter out the driver (participant with isDriver flag or with userId matching driverId)
    return participants.filter(p => 
      p.isDriver !== true && 
      p.userId !== this.trip?.driverId
    );
  }

  /**
   * Returns the driver from the participants list
   */
  getDriver(): TripParticipantDto | null {
    if (!this.trip) {
      return null;
    }
    
    // Ensure participants is an array
    const participants = Array.isArray(this.trip.participants) ? this.trip.participants : [];
    
    // Find the participant with isDriver flag or with userId matching driverId
    return participants.find(p => 
      p.isDriver === true || 
      p.userId === this.trip?.driverId
    ) || null;
  }

  getBookedSeatsCount(): number {
    if (!this.trip) {
      return 0;
    }
    
    // Count only approved passengers and their seat counts
    return this.getPassengers()
      .filter(p => p.joinStatus === JoinStatus.Approved)
      .reduce((total, p) => total + (p.seatCount || 1), 0);
  }

  // For debugging only - force trip status to Pending
  forceStatusToPending(): void {
    if (this.trip) {
      this.trip.status = TripStatus.Pending;
    }
  }

  // Direct cancel method that bypasses all checks
  cancelTripDirectly(): void {
    if (!this.trip) {
      this.notificationService.error('Trip details not available.');
      return;
    }
    
    const userData = this.authService.getUserData();
    if (!userData || !userData.userId) {
      this.notificationService.error('User information not found.');
      return;
    }
    
    this.isSubmitting = true;
    
    const cancelTripDto = {
      tripId: this.tripId,
      userId: userData.userId,
      role: userData.userRole,
      cancellationReason: 'Emergency cancellation via direct button'
    };
    
    this.tripService.cancelTripAsDriver(cancelTripDto).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response && response.success) {
          this.notificationService.success('Trip cancelled successfully!');
          
          // Update trip status locally
          if (this.trip) {
            this.trip.status = TripStatus.Cancelled;
          }
          
          // Reload trip details to show updated status
          setTimeout(() => {
            this.loadTripDetails();
          }, 1000);
          
          // Redirect to my trips page after a short delay
          setTimeout(() => {
            this.router.navigate(['/trip/my-trips']);
          }, 2000);
        } else {
          this.notificationService.error(response.message || 'Failed to cancel trip.');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notificationService.error('Failed to cancel trip. ' + (err.error?.message || err.message || 'Unknown error'));
      }
    });
  }

  /**
   * Returns the driver's rating from either the driver details (API) or the trip data
   */
  getDriverRating(): number {
    if (this.driverDetails && this.driverDetails.avgRating !== undefined) {
      return this.driverDetails.avgRating;
    }
    
    return this.trip ? this.trip.driverRating || 0 : 0;
  }
} 