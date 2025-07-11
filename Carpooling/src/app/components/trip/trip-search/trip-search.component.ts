import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TripService } from '../../../services/trip.service';
import { AuthService } from '../../../services/auth.service';
import { TripListDto } from '../../../model/trip.model';

@Component({
  selector: 'app-trip-search',
  templateUrl: './trip-search.component.html',
  styleUrls: ['./trip-search.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class TripSearchComponent implements OnInit {
  searchForm: FormGroup;
  trips: TripListDto[] = [];
  isLoading = false;
  searchPerformed = false;
  minDate: string;
  error: string = '';

  constructor(
    private fb: FormBuilder,
    private tripService: TripService,
    private authService: AuthService,
    private router: Router
  ) {
    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    
    this.searchForm = this.fb.group({
      source: ['', [Validators.required]],
      destination: ['', [Validators.required]],
      date: [this.minDate, [Validators.required]]
    });
  }

  ngOnInit(): void {
  }

  isInvalid(controlName: string): boolean {
    const control = this.searchForm.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  searchTrips(): void {
    if (this.searchForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.searchForm.controls).forEach(key => {
        const control = this.searchForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
      return;
    }

    const { source, destination, date } = this.searchForm.value;
    
    // Validate that the selected date is not in the past
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0); // Set to beginning of day
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day
    
    if (selectedDate < today) {
      this.error = 'Cannot search for trips in the past. Please select a current or future date.';
      this.trips = [];
      return;
    }
    
    this.error = '';
    this.isLoading = true;
    this.searchPerformed = true;

    const formattedDate = new Date(date).toISOString().split('T')[0];

    this.tripService.searchTrips(source, destination, formattedDate)
      .subscribe({
        next: (data) => {
          this.trips = data || [];
          this.isLoading = false;
          
          // Log the trips to help debug
          console.log('Trips received:', this.trips);
          
          // Check if any trips have undefined IDs
          const hasUndefinedIds = this.trips.some(trip => !trip || trip.id === undefined);
          if (hasUndefinedIds) {
            console.warn('Some trips have undefined IDs');
          }
        },
        error: (error) => {
          console.error('Error searching trips:', error);
          this.isLoading = false;
          this.trips = [];
          this.error = error.error?.message || 'Error searching for trips';
        }
      });
  }

  viewTripDetails(tripId: number | undefined): void {
    if (!tripId) {
      console.error('Cannot view details: Trip ID is undefined');
      return;
    }
    
    try {
      console.log('Navigating to trip details:', tripId);
      this.router.navigate(['/trip/details', tripId]);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  bookTrip(tripId: number | undefined): void {
    if (!tripId) {
      console.error('Cannot book trip: Trip ID is undefined');
      return;
    }
    
    try {
      console.log('Navigating to book trip:', tripId);
      this.router.navigate(['/trip/details', tripId]);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
}
