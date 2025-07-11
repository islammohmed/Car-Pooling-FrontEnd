import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FeedbackService } from '../../../services/feedback.service';
import { TripService } from '../../../services/trip.service';
import { AuthService } from '../../../services/auth.service';
import { CreateFeedbackDto } from '../../../model/feedback.model';
import { Trip, TripDto, TripParticipantDto } from '../../../model/trip.model';
import { TripStatus, JoinStatus } from '../../../model/enums.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { NotificationService } from '../../../services/notification.service';

interface TripParticipant {
  userId: string;
  userName: string;
  isDriver: boolean;
}

@Component({
  selector: 'app-create-feedback',
  templateUrl: './create-feedback.component.html',
  styleUrls: ['./create-feedback.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NavbarComponent, FooterComponent]
})
export class CreateFeedbackComponent implements OnInit {
  feedbackForm: FormGroup;
  tripId: number;
  trip: TripDto | null = null;
  participants: TripParticipant[] = [];
  rating: number = 5; // Default rating set to 5
  hoverRating: number = 0; // For hover effect on stars
  isSubmitting = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private feedbackService: FeedbackService,
    private tripService: TripService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.feedbackForm = this.fb.group({
      receiverId: ['', [Validators.required]],
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(5)]]
    });

    // Get tripId from route params
    const tripIdParam = this.route.snapshot.paramMap.get('tripId');
    console.log('Raw tripId from route:', tripIdParam);
    
    if (!tripIdParam) {
      this.errorMessage = 'Trip ID is missing from the URL';
      this.notificationService.error(this.errorMessage);
      this.tripId = 0; // Set to invalid ID
      return;
    }
    
    this.tripId = +tripIdParam;
    console.log('Parsed tripId:', this.tripId);
    
    if (isNaN(this.tripId) || this.tripId <= 0) {
      this.errorMessage = 'Invalid Trip ID format';
      this.notificationService.error(this.errorMessage);
      this.tripId = 0; // Set to invalid ID
    }
  }

  ngOnInit(): void {
    console.log('CreateFeedbackComponent initialized with tripId:', this.tripId);
    
    if (!this.tripId || this.tripId <= 0) {
      this.errorMessage = 'Valid Trip ID is required';
      this.notificationService.error('Valid Trip ID is required');
      return;
    }

    // Log current user data
    const userData = this.authService.getUserData();
    console.log('Current user data:', userData);

    // Load trip details
    this.loadTripDetails();
  }

  loadTripDetails(): void {
    console.log('Loading trip details for tripId:', this.tripId);
    
    this.tripService.getTripById(this.tripId).subscribe({
      next: (trip) => {
        if (!trip) {
          this.errorMessage = 'Trip not found';
          this.notificationService.error('Trip not found');
          return;
        }
        
        this.trip = trip;
        console.log('Trip loaded successfully:', JSON.stringify(trip));
        console.log('Driver ID in trip:', trip.driverId, 'Type:', typeof trip.driverId);
        
        // Check if trip is completed
        if (trip.status !== TripStatus.Completed) {
          this.errorMessage = `Feedback can only be given for completed trips. Current status: ${trip.status}`;
          this.notificationService.error(this.errorMessage);
          return;
        }
        
        // Directly create a participant for the driver
        const currentUserId = this.authService.getUserData()?.userId;
        console.log('Current user ID:', currentUserId);
        console.log('Trip driver ID:', trip.driverId);
        
        // If driverId is empty or undefined, fetch participants explicitly
        if (!trip.driverId) {
          console.log('Driver ID is empty, fetching participants...');
          this.tripService.getTripParticipants(this.tripId).subscribe({
            next: (participants) => {
              console.log('Fetched participants:', participants);
              
              // Find the driver participant
              const driverParticipant = participants.find(p => p.isDriver);
              
              if (driverParticipant && driverParticipant.userId) {
                console.log('Found driver participant:', driverParticipant);
                this.participants = [{
                  userId: driverParticipant.userId,
                  userName: `${driverParticipant.userName || 'Driver'} (Driver)`,
                  isDriver: true
                }];
                
                // Set the driver as the default receiver
                this.feedbackForm.patchValue({ receiverId: driverParticipant.userId });
                console.log('Set driver as receiver from participants:', driverParticipant.userId);
              } else {
                // If no driver found, try to use any participant
                if (participants.length > 0) {
                  const firstParticipant = participants[0];
                  console.log('No driver found, using first participant:', firstParticipant);
                  this.participants = [{
                    userId: firstParticipant.userId,
                    userName: firstParticipant.userName || 'Participant',
                    isDriver: false
                  }];
                  
                  // Set the first participant as the default receiver
                  this.feedbackForm.patchValue({ receiverId: firstParticipant.userId });
                  console.log('Set first participant as receiver:', firstParticipant.userId);
                } else {
                  this.errorMessage = 'No participants found for this trip';
                  this.notificationService.error(this.errorMessage);
                }
              }
              
              console.log('Participants array after fetch:', this.participants);
              console.log('Form value after setting receiver:', this.feedbackForm.value);
            },
            error: (error) => {
              console.error('Error fetching participants:', error);
              this.errorMessage = `Failed to load participants: ${error.message || 'Unknown error'}`;
              this.notificationService.error(this.errorMessage);
            }
          });
        } else {
          // Use the driver ID from the trip
          const driverId = trip.driverId;
          
          // Force add driver as participant
          console.log('Using driver as participant with ID:', driverId);
          this.participants = [{
            userId: driverId,
            userName: `${trip.driverName || 'Driver'} (Driver)`,
            isDriver: true
          }];
          
          // Set the driver as the default receiver
          this.feedbackForm.patchValue({ receiverId: driverId });
          console.log('Set driver as receiver:', driverId);
          console.log('Participants array:', this.participants);
          console.log('Form value after setting receiver:', this.feedbackForm.value);
        }
      },
      error: (error) => {
        console.error('Error loading trip details:', error);
        this.errorMessage = `Failed to load trip details: ${error.message || 'Unknown error'}`;
        this.notificationService.error(this.errorMessage);
      }
    });
  }

  loadParticipants(): void {
    if (!this.trip) {
      this.errorMessage = 'Trip data is missing';
      this.notificationService.error('Trip data is missing');
      return;
    }

    const currentUserId = this.authService.getUserData()?.userId;
    if (!currentUserId) {
      this.errorMessage = 'User information is missing';
      this.notificationService.error('User information is missing');
      return;
    }
    
    this.participants = [];  // Reset participants array
    
    // Always add driver if current user is not the driver
    if (this.trip.driverId && this.trip.driverId !== currentUserId) {
      console.log('Adding driver to participants:', this.trip.driverName);
      this.participants.push({
        userId: this.trip.driverId,
        userName: `${this.trip.driverName || 'Driver'} (Driver)`,
        isDriver: true
      });
    }
    
    // Add approved participants who are not the current user
    if (this.trip.participants && this.trip.participants.length > 0) {
      console.log('Processing participants:', this.trip.participants);
      const approvedParticipants = this.trip.participants
        .filter((p: TripParticipantDto) => 
          p && p.userId && 
          p.joinStatus === JoinStatus.Approved && 
          p.userId !== currentUserId &&
          p.userId !== this.trip?.driverId  // Don't add driver twice
        )
        .map((p: TripParticipantDto) => ({
          userId: p.userId,
          userName: p.userName || 'Passenger',
          isDriver: false
        }));
      
      console.log('Approved participants:', approvedParticipants);
      this.participants = [...this.participants, ...approvedParticipants];
    }
    
    console.log('Final participants list:', this.participants);
    
    // If no participants found, check if we can add the driver
    if (this.participants.length === 0) {
      // If we're here and we have a driver ID that's not the current user, try to add the driver again
      if (this.trip.driverId && this.trip.driverId !== currentUserId) {
        console.log('No participants found, adding driver as fallback');
        this.participants.push({
          userId: this.trip.driverId,
          userName: `${this.trip.driverName || 'Driver'} (Driver)`,
          isDriver: true
        });
      } else {
        this.errorMessage = 'No participants found to rate';
        this.notificationService.error('No participants found to rate');
        return;
      }
    }

    // Automatically set the receiverId if there's only one participant
    if (this.participants.length === 1) {
      const receiverId = this.participants[0].userId;
      console.log('Setting receiverId:', receiverId);
      this.feedbackForm.patchValue({ receiverId });
    } else if (this.participants.length > 1) {
      // Set the first participant as default
      const receiverId = this.participants[0].userId;
      console.log('Setting default receiverId:', receiverId);
      this.feedbackForm.patchValue({ receiverId });
    }
  }

  setRating(value: number): void {
    this.rating = value;
    this.feedbackForm.patchValue({ rating: value });
  }

  isInvalid(controlName: string): boolean {
    const control = this.feedbackForm.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  onSubmit(): void {
    console.log('Submit button clicked');
    console.log('Form value:', this.feedbackForm.value);
    console.log('Form valid:', this.feedbackForm.valid);
    
    if (!this.feedbackForm.valid) {
      console.log('Form validation errors:', this.getFormValidationErrors());
      this.notificationService.error('Please fill in all required fields correctly');
      return;
    }
    
    // Ensure we have a valid rating
    if (!this.feedbackForm.value.rating || this.feedbackForm.value.rating < 1) {
      console.log('Setting default rating:', this.rating);
      this.feedbackForm.patchValue({ rating: this.rating });
    }
    
    // Check if comment is provided
    if (!this.feedbackForm.value.comment || this.feedbackForm.value.comment.trim().length < 5) {
      this.notificationService.error('Please provide a comment (minimum 5 characters)');
      return;
    }
    
    this.isSubmitting = true;
    
    // Check if user is logged in
    const currentUser = this.authService.getUserData();
    if (!currentUser || !currentUser.userId) {
      this.errorMessage = 'You must be logged in to submit feedback';
      this.notificationService.error(this.errorMessage);
      this.isSubmitting = false;
      return;
    }
    
    console.log('Current user:', currentUser);
    
    // Create feedback DTO with minimal required information
    // The server will determine the sender from the token
    const feedbackDto: CreateFeedbackDto = {
      tripId: this.tripId,
      receiverId: this.feedbackForm.value.receiverId,
      rating: this.feedbackForm.value.rating,
      comment: this.feedbackForm.value.comment
    };
    
    console.log('Sending feedback:', feedbackDto);

    this.feedbackService.createFeedback(feedbackDto).subscribe({
      next: (response) => {
        console.log('Feedback response:', response);
        if (response && response.success) {
          this.successMessage = 'Feedback submitted successfully!';
          this.errorMessage = '';
          this.notificationService.success('Feedback submitted successfully!');
          
          // Redirect after a short delay
          setTimeout(() => {
            this.router.navigate(['/trip/my-trips']);
          }, 2000);
        } else {
          this.errorMessage = response?.message || 'Failed to submit feedback';
          this.notificationService.error(this.errorMessage);
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error submitting feedback:', error);
        this.errorMessage = error.message || error.error?.message || 'Failed to submit feedback';
        this.notificationService.error(this.errorMessage);
        this.isSubmitting = false;
      }
    });
  }
  
  // Helper method to get form validation errors
  getFormValidationErrors(): string[] {
    const errors: string[] = [];
    Object.keys(this.feedbackForm.controls).forEach(key => {
      const control = this.feedbackForm.get(key);
      if (control && control.errors) {
        Object.keys(control.errors).forEach(errorKey => {
          errors.push(`${key} - ${errorKey}`);
        });
      }
    });
    return errors;
  }

  goBack(): void {
    this.router.navigate(['/trip/my-trips']);
  }
}
