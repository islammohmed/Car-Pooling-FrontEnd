import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TripService } from '../../../services/trip.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { CreateTripDto } from '../../../model/trip.model';
import { Gender, TripStatus, UserRole, VerificationStatus } from '../../../model/enums.model';
import { DocumentVerificationDto } from '../../../model/user.model';
import { NotificationService } from '../../../services/notification.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-post-trip',
  templateUrl: './post-trip.component.html',
  styleUrls: ['./post-trip.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent, FooterComponent]
})
export class PostTripComponent implements OnInit {
  tripForm: FormGroup;
  isSubmitting = false;
  isVerified = false;
  minDate: string;
  documentVerifications: DocumentVerificationDto[] = [];
  isLoading = true;
  error: string = '';

  constructor(
    private fb: FormBuilder,
    private tripService: TripService,
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    
    this.tripForm = this.fb.group({
      sourceLocation: ['', [Validators.required]],
      destination: ['', [Validators.required]],
      startDate: [this.minDate, [Validators.required]],
      startTime: ['', [Validators.required]],
      pricePerSeat: ['', [Validators.required, Validators.min(0)]],
      availableSeats: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      estimatedDuration: ['', [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
      genderPreference: [Gender.Any],
      acceptsDeliveries: [false],
      maxDeliveryWeight: [{ value: null, disabled: true }],
      tripDescription: ['', [Validators.required, Validators.minLength(10)]],
      notes: ['']
    });

    // Enable/disable maxDeliveryWeight based on acceptsDeliveries
    this.tripForm.get('acceptsDeliveries')?.valueChanges.subscribe(value => {
      const maxDeliveryWeightControl = this.tripForm.get('maxDeliveryWeight');
      if (value) {
        maxDeliveryWeightControl?.enable();
        maxDeliveryWeightControl?.setValidators([Validators.required, Validators.min(0.1)]);
      } else {
        maxDeliveryWeightControl?.disable();
        maxDeliveryWeightControl?.clearValidators();
      }
      maxDeliveryWeightControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    // Check if user is a driver
    const userData = this.authService.getUserData();
    if (!userData || userData.userRole !== UserRole.Driver) {
      this.notificationService.error('Only drivers can post trips');
      this.router.navigate(['/']);
      return;
    }

    // Check if driver is verified
    this.checkDriverVerification();
  }

  checkDriverVerification(): void {
    this.isLoading = true;
    this.userService.getDriverVerificationStatus().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.isVerified = response.data;
          if (!this.isVerified) {
            this.notificationService.warning(response.message || 'You need to verify your documents before posting trips');
          }
        } else {
          this.notificationService.error(response.message || 'Failed to check verification status');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error checking verification status:', error);
        this.notificationService.error('Failed to check verification status');
      }
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.tripForm.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  navigateToVerification(): void {
    this.router.navigate(['/account/verification']);
  }

  onSubmit(): void {
    if (this.tripForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.tripForm.controls).forEach(key => {
        const control = this.tripForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
      return;
    }

    // Combine date and time
    const dateStr = this.tripForm.value.startDate;
    const timeStr = this.tripForm.value.startTime;
    const startTime = new Date(`${dateStr}T${timeStr}`);
    
    // Validate that the trip date is not in the past
    const now = new Date();
    if (startTime < now) {
      this.error = 'Trip start time cannot be in the past. Please select a future date and time.';
      this.notificationService.error(this.error);
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    // Create trip DTO
    const tripDto: CreateTripDto = {
      driverId: this.authService.getUserData().id,
      sourceLocation: this.tripForm.value.sourceLocation,
      destination: this.tripForm.value.destination,
      startTime: startTime,
      pricePerSeat: this.tripForm.value.pricePerSeat,
      availableSeats: this.tripForm.value.availableSeats,
      estimatedDuration: this.tripForm.value.estimatedDuration,
      genderPreference: this.tripForm.value.genderPreference,
      acceptsDeliveries: this.tripForm.value.acceptsDeliveries,
      maxDeliveryWeight: this.tripForm.value.acceptsDeliveries ? this.tripForm.value.maxDeliveryWeight : null,
      tripDescription: this.tripForm.value.tripDescription,
      notes: this.tripForm.value.notes,
      status: TripStatus.Pending
    };

    this.tripService.createTrip(tripDto).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.notificationService.success('Trip created successfully');
        this.router.navigate(['/trips', response.id]);
      },
      error: (error) => {
        console.error('Error creating trip:', error);
        this.isSubmitting = false;
        this.notificationService.error(error?.error?.message || 'Failed to create trip');
      }
    });
  }
}
