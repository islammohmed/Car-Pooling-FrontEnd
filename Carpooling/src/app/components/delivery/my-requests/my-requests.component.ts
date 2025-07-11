import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DeliveryService } from '../../../services/delivery.service';
import { DeliveryRequestResponseDto, DeliveryStatus } from '../../../model/delivery.model';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-my-requests',
  templateUrl: './my-requests.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent],
  styleUrls: ['./my-requests.component.css']
})
export class MyRequestsComponent implements OnInit {
  myRequests: DeliveryRequestResponseDto[] = [];
  filteredRequests: DeliveryRequestResponseDto[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  processingRequestId: number | null = null;
  selectedFilter = 'all';
  DeliveryStatus = DeliveryStatus; // Make enum available to template

  constructor(
    private deliveryService: DeliveryService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadMyRequests();
  }

  loadMyRequests(): void {
    this.isLoading = true;
    this.deliveryService.getMyRequests().subscribe({
      next: (response) => {
        if (response.success) {
          this.myRequests = response.data;
          this.applyFilter(this.selectedFilter);
        } else {
          this.errorMessage = response.message || 'Failed to load your requests';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while loading your requests';
        this.isLoading = false;
      }
    });
  }

  filterRequests(filter: string): void {
    this.selectedFilter = filter;
    this.applyFilter(filter);
  }

  applyFilter(filter: string): void {
    if (filter === 'all') {
      this.filteredRequests = [...this.myRequests];
    } else {
      this.filteredRequests = this.myRequests.filter(request => 
        request.status.toLowerCase() === filter.toLowerCase()
      );
    }
  }

  cancelRequest(requestId: number): void {
    this.processingRequestId = requestId;
    this.errorMessage = '';
    this.successMessage = '';

    this.deliveryService.cancelRequest(requestId).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Delivery request cancelled successfully';
          
          // Update the request in the list instead of reloading
          const index = this.myRequests.findIndex(r => r.id === requestId);
          if (index !== -1) {
            this.myRequests[index] = response.data;
            this.applyFilter(this.selectedFilter);
          }
        } else {
          this.errorMessage = response.message || 'Failed to cancel delivery request';
        }
        this.processingRequestId = null;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while cancelling the delivery request';
        this.processingRequestId = null;
      }
    });
  }

  viewDetails(requestId: number): void {
    this.router.navigate(['/delivery/details', requestId]);
  }

  viewMatchingTrips(requestId: number): void {
    this.router.navigate(['/delivery/matching-trips', requestId]);
  }

  createNewRequest(): void {
    this.router.navigate(['/delivery/create']);
  }

  getStatusClass(status: DeliveryStatus): string {
    switch (status) {
      case DeliveryStatus.Pending:
        return 'status-pending';
      case DeliveryStatus.TripSelected:
        return 'status-selected';
      case DeliveryStatus.Accepted:
        return 'status-accepted';
      case DeliveryStatus.InTransit:
        return 'status-in-transit';
      case DeliveryStatus.Delivered:
        return 'status-delivered';
      case DeliveryStatus.Rejected:
        return 'status-rejected';
      case DeliveryStatus.Cancelled:
        return 'status-cancelled';
      case DeliveryStatus.Expired:
        return 'status-expired';
      default:
        return '';
    }
  }

  isStatusActive(currentStatus: DeliveryStatus, statusToCheck: DeliveryStatus): boolean {
    const statusOrder = [
      DeliveryStatus.Pending,
      DeliveryStatus.TripSelected,
      DeliveryStatus.Accepted, 
      DeliveryStatus.InTransit, 
      DeliveryStatus.Delivered
    ];
    
    if (currentStatus === DeliveryStatus.Cancelled || 
        currentStatus === DeliveryStatus.Rejected ||
        currentStatus === DeliveryStatus.Expired) {
      return statusToCheck === currentStatus;
    }
    
    const currentIndex = statusOrder.indexOf(currentStatus);
    const checkIndex = statusOrder.indexOf(statusToCheck);
    
    return currentIndex >= checkIndex;
  }

  canCancel(status: DeliveryStatus): boolean {
    return status === DeliveryStatus.Pending || status === DeliveryStatus.TripSelected;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Not available';
    return new Date(date).toLocaleString();
  }
} 