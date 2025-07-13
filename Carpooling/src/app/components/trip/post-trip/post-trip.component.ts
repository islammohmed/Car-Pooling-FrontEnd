import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TripService } from '../../../services/trip.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { CreateTripDto } from '../../../model/trip.model';
import {
  Gender,
  TripStatus,
  UserRole,
  VerificationStatus,
} from '../../../model/enums.model';
import { DocumentVerificationDto } from '../../../model/user.model';
import { NotificationService } from '../../../services/notification.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { environment } from '../../../../environments/environment';
import { GeocoderAutocomplete } from '@geoapify/geocoder-autocomplete';

@Component({
  selector: 'app-post-trip',
  templateUrl: './post-trip.component.html',
  styleUrls: ['./post-trip.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NavbarComponent,
    FooterComponent,
  ],
})
export class PostTripComponent implements OnInit, AfterViewChecked {
  @ViewChild('autocompleteContainer') autocompleteContainerRef!: ElementRef;

  private sourceAutocompleteInitialized = false;
  private destinationAutocompleteInitialized = false;
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
      sourceLatitude: [0, [Validators.required]],
      sourceLongitude: [0, [Validators.required]],
      sourceCity: ['', [Validators.required]],

      
      destinationLocation: ['', [Validators.required]],
      destinationLatitude: [0, [Validators.required]],
      destinationLongitude: [0, [Validators.required]],
      destinationCity: ['', [Validators.required]],
      startDate: [this.minDate, [Validators.required]],
      startTime: ['', [Validators.required]],
      pricePerSeat: ['', [Validators.required, Validators.min(0)]],
      availableSeats: [
        1,
        [Validators.required, Validators.min(1), Validators.max(10)],
      ],
      estimatedDuration: [
        '',
        [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)],
      ],
      genderPreference: [Gender.Any],
      acceptsDeliveries: [false],
      maxDeliveryWeight: [{ value: null, disabled: true }],
      tripDescription: ['', [Validators.required, Validators.minLength(10)]],
      notes: [''],
    });

    // Enable/disable maxDeliveryWeight based on acceptsDeliveries
    this.tripForm.get('acceptsDeliveries')?.valueChanges.subscribe((value) => {
      const maxDeliveryWeightControl = this.tripForm.get('maxDeliveryWeight');
      if (value) {
        maxDeliveryWeightControl?.enable();
        maxDeliveryWeightControl?.setValidators([
          Validators.required,
          Validators.min(0.1),
        ]);
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

  ngAfterViewChecked(): void {
    // Initialize autocomplete after the view is ready
    if (this.isVerified && !this.isLoading) {
      this.initializeAutocompletes();
    }
  }

  initializeAutocompletes(): void {
    // Initialize source autocomplete
    if (!this.sourceAutocompleteInitialized) {
      const sourceEl = document.getElementById('autocomplete');
      if (sourceEl) {
        const sourceAutocomplete = new GeocoderAutocomplete(
          sourceEl,
          environment.geoapifyKey,
          { 
            placeholder: 'Enter pickup location',
            skipIcons: true
          }
        );
        sourceAutocomplete.on('select', (location) => {
          this.tripForm
            .get('sourceLocation')
            ?.setValue(location.properties.formatted);
          this.tripForm
            .get('sourceLatitude')
            ?.setValue(location.properties.lat);
          this.tripForm
            .get('sourceLongitude')
            ?.setValue(location.properties.lon);
          this.tripForm
            .get('sourceCity')
            ?.setValue(
              location.properties.country === 'Egypt'
                ? location.properties.state
                : location.properties.city
            );
        });
        this.sourceAutocompleteInitialized = true;
      }
    }

    // Initialize destination autocomplete
    if (!this.destinationAutocompleteInitialized) {
      const destEl = document.getElementById('destinationAutocomplete');
      if (destEl) {
        const destAutocomplete = new GeocoderAutocomplete(
          destEl,
          environment.geoapifyKey,
          { 
            placeholder: 'Enter destination',
            skipIcons: true
          }
        );
        destAutocomplete.on('select', (location) => {
          this.tripForm
            .get('destinationLocation')
            ?.setValue(location.properties.formatted);
          this.tripForm
            .get('destinationLatitude')
            ?.setValue(location.properties.lat);
          this.tripForm
            .get('destinationLongitude')
            ?.setValue(location.properties.lon);
          this.tripForm
            .get('destinationCity')
            ?.setValue(
              location.properties.country === 'Egypt'
                ? location.properties.state
                : location.properties.city
            );
        });
        this.destinationAutocompleteInitialized = true;
      }
    }
  }

  checkDriverVerification(): void {
    this.isLoading = true;
    this.userService.getDriverVerificationStatus().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.isVerified = response.data;
          if (!this.isVerified) {
            this.notificationService.warning(
              response.message ||
                'You need to verify your documents before posting trips'
            );
          }
        } else {
          this.notificationService.error(
            response.message || 'Failed to check verification status'
          );
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error checking verification status:', error);
        this.notificationService.error('Failed to check verification status');
      },
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.tripForm.get(controlName);
    return control
      ? control.invalid && (control.dirty || control.touched)
      : false;
  }

  navigateToVerification(): void {
    this.router.navigate(['/account/verification']);
  }

  onSubmit(): void {
    if (this.tripForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.tripForm.controls).forEach((key) => {
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
      this.error =
        'Trip start time cannot be in the past. Please select a future date and time.';
      this.notificationService.error(this.error);
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    // Create trip DTO
    const tripDto: CreateTripDto = {
      driverId: this.authService.getUserData().id,
      sourceLocation: this.tripForm.value.sourceLocation,
      sourceLatitude: this.tripForm.value.sourceLatitude,
      sourceLongitude: this.tripForm.value.sourceLongitude,
      sourceCity: this.tripForm.value.sourceCity,
      destinationLocation: this.tripForm.value.destinationLocation,
      destinationLatitude: this.tripForm.value.destinationLatitude,
      destinationLongitude: this.tripForm.value.destinationLongitude,
      destinationCity: this.tripForm.value.destinationCity,
      startTime: startTime,
      pricePerSeat: this.tripForm.value.pricePerSeat,
      availableSeats: this.tripForm.value.availableSeats,
      estimatedDuration: this.tripForm.value.estimatedDuration + ":00", // Add seconds to match format HH:MM:SS
      genderPreference: this.tripForm.value.genderPreference,
      acceptsDeliveries: this.tripForm.value.acceptsDeliveries,
      maxDeliveryWeight: this.tripForm.value.acceptsDeliveries
        ? this.tripForm.value.maxDeliveryWeight
        : null,
      tripDescription: this.tripForm.value.tripDescription,
      notes: this.tripForm.value.notes,
      status: TripStatus.Pending,
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
        this.notificationService.error(
          error?.error?.message || 'Failed to create trip'
        );
      },
    });
  }
}
