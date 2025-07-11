import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DeliveryService } from '../../../services/delivery.service';
import { DeliveryRequestResponseDto } from '../../../model/delivery.model';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { TripService } from '../../../services/trip.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-pending-deliveries',
  templateUrl: './pending-deliveries.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CurrencyPipe, DatePipe, NavbarComponent],
  styleUrls: ['./pending-deliveries.component.css']
})
export class PendingDeliveriesComponent implements OnInit {
  pendingRequests: DeliveryRequestResponseDto[] = [];
  filteredRequests: DeliveryRequestResponseDto[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  processingRequestId: number | null = null;
  tripId: number | null = null;
  tripDetails: any = null;
  filteringByTrip = false;

  constructor(
    private deliveryService: DeliveryService,
    private tripService: TripService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Check if we have a tripId in the query params
    this.route.queryParams.subscribe(params => {
      if (params['tripId']) {
        this.tripId = +params['tripId'];
        this.filteringByTrip = true;
        this.loadTripDetails(this.tripId);
      }
      this.loadPendingRequests();
    });
  }

  loadTripDetails(tripId: number): void {
    this.tripService.getTripById(tripId).subscribe({
      next: (trip) => {
        this.tripDetails = trip;
      },
      error: (error) => {
        console.error('Error loading trip details:', error);
        this.errorMessage = 'Failed to load trip details';
      }
    });
  }

  loadPendingRequests(): void {
    this.isLoading = true;
    this.deliveryService.getPendingRequests(this.tripId || undefined).subscribe({
      next: (response) => {
        if (response.success) {
          this.pendingRequests = response.data;
          this.filterRequests();
        } else {
          this.errorMessage = response.message || 'Failed to load pending requests';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while loading pending requests';
        this.isLoading = false;
      }
    });
  }

  filterRequests(): void {
    if (this.tripId && this.filteringByTrip) {
      // Filter requests that match the selected trip
      this.filteredRequests = this.pendingRequests.filter(request => {
        // Check if this request has matching trips and if our tripId is in the list
        return request.matchingTrips && 
               request.matchingTrips.some(trip => trip.tripId === this.tripId);
      });
    } else {
      // Show all pending requests
      this.filteredRequests = this.pendingRequests;
    }
  }

  getSelectedTripId(requestId: number): number {
    const selectElement = document.getElementById(`trip-select-${requestId}`) as HTMLSelectElement;
    if (selectElement && selectElement.value) {
      return +selectElement.value;
    }
    // If no trip is selected or element not found, return 0 (which will likely cause an error)
    // This should never happen as the button should be disabled in this case
    return 0;
  }

  acceptDelivery(requestId: number, tripId: number): void {
    this.processingRequestId = requestId;
    this.errorMessage = '';
    this.successMessage = '';

    // If we're filtering by trip, use that tripId
    const finalTripId = this.tripId || tripId;

    this.deliveryService.acceptDelivery(requestId, finalTripId).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Delivery request accepted successfully';
          // Redirect to my deliveries page after a short delay
          setTimeout(() => {
            this.router.navigate(['/delivery/driver/my-deliveries']);
          }, 1500);
        } else {
          this.errorMessage = response.message || 'Failed to accept delivery request';
          this.processingRequestId = null;
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while accepting the delivery request';
        this.processingRequestId = null;
      }
    });
  }

  clearTripFilter(): void {
    this.tripId = null;
    this.tripDetails = null;
    this.filteringByTrip = false;
    this.filterRequests();
    this.router.navigate([], {
      queryParams: { tripId: null },
      queryParamsHandling: 'merge'
    });
  }
} 