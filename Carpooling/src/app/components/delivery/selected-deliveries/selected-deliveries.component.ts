import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { DeliveryService } from '../../../services/delivery.service';
import { DeliveryRequestResponseDto, DeliveryStatus } from '../../../model/delivery.model';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-selected-deliveries',
  templateUrl: './selected-deliveries.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent, RouterModule],
  styleUrls: ['./selected-deliveries.component.css']
})
export class SelectedDeliveriesComponent implements OnInit {
  selectedDeliveries: DeliveryRequestResponseDto[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  processingRequestId: number | null = null;

  constructor(
    private deliveryService: DeliveryService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadSelectedDeliveries();
  }

  loadSelectedDeliveries(): void {
    this.isLoading = true;
    this.deliveryService.getSelectedForMe().subscribe({
      next: (response) => {
        if (response.success) {
          this.selectedDeliveries = response.data;
        } else {
          this.errorMessage = response.message || 'Failed to load selected delivery requests';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while loading selected delivery requests';
        this.isLoading = false;
      }
    });
  }

  acceptDelivery(requestId: number, tripId: number): void {
    this.processingRequestId = requestId;
    this.errorMessage = '';
    this.successMessage = '';

    this.deliveryService.acceptDelivery(requestId, tripId).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Delivery request accepted successfully';
          // Remove the accepted request from the list
          this.selectedDeliveries = this.selectedDeliveries.filter(d => d.id !== requestId);
          
          // If no more selected deliveries, redirect after a short delay
          if (this.selectedDeliveries.length === 0) {
            setTimeout(() => {
              this.router.navigate(['/delivery/driver/my-deliveries']);
            }, 1500);
          } else {
            this.processingRequestId = null;
          }
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

  rejectDelivery(requestId: number): void {
    this.processingRequestId = requestId;
    this.errorMessage = '';
    this.successMessage = '';

    this.deliveryService.rejectDelivery(requestId).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Delivery request rejected';
          // Remove the rejected request from the list
          this.selectedDeliveries = this.selectedDeliveries.filter(d => d.id !== requestId);
          
          // If no more selected deliveries, redirect after a short delay
          if (this.selectedDeliveries.length === 0) {
            setTimeout(() => {
              this.router.navigate(['/delivery/driver/my-deliveries']);
            }, 1500);
          } else {
            this.processingRequestId = null;
          }
        } else {
          this.errorMessage = response.message || 'Failed to reject delivery request';
          this.processingRequestId = null;
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while rejecting the delivery request';
        this.processingRequestId = null;
      }
    });
  }

  viewDeliveryDetails(id: number): void {
    this.router.navigate(['/delivery/details', id]);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
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
} 