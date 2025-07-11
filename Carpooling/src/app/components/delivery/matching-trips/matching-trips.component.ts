import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DeliveryService } from '../../../services/delivery.service';
import { TripListDto, DeliveryRequestResponseDto, SelectTripDto } from '../../../model/delivery.model';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-matching-trips',
  templateUrl: './matching-trips.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent],
  styleUrls: ['./matching-trips.component.css']
})
export class MatchingTripsComponent implements OnInit {
  requestId: number = 0;
  matchingTrips: TripListDto[] = [];
  deliveryRequest: DeliveryRequestResponseDto | null = null;
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;
  deliveryNotes: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deliveryService: DeliveryService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.requestId = +params['id'];
      this.loadData();
    });
  }

  loadData(): void {
    // Get delivery request details
    this.deliveryService.getDeliveryRequest(this.requestId).subscribe({
      next: (response) => {
        if (response.success) {
          this.deliveryRequest = response.data;
          this.loadMatchingTrips();
        } else {
          this.errorMessage = response.message || 'Failed to load delivery request';
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while loading the delivery request';
        this.isLoading = false;
      }
    });
  }

  loadMatchingTrips(): void {
    this.deliveryService.getMatchingTrips(this.requestId).subscribe({
      next: (response) => {
        if (response.success) {
          this.matchingTrips = response.data || [];
          console.log('Matching trips:', this.matchingTrips);
        } else {
          this.errorMessage = response.message || 'Failed to load matching trips';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while loading matching trips';
        this.isLoading = false;
      }
    });
  }

  selectTrip(tripId: number): void {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    const selectTripData: SelectTripDto = {
      tripId: tripId,
      notes: this.deliveryNotes.trim() || undefined
    };
    
    this.deliveryService.selectTripForDelivery(this.requestId, selectTripData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Trip selected successfully!';
          // Navigate after a short delay to show the success message
          setTimeout(() => {
            this.router.navigate(['/delivery/my-requests']);
          }, 1500);
        } else {
          this.errorMessage = response.message || 'Failed to select trip';
          this.isSubmitting = false;
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while selecting the trip';
        this.isSubmitting = false;
      }
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  goBack(): void {
    this.router.navigate(['/delivery/my-requests']);
  }
} 