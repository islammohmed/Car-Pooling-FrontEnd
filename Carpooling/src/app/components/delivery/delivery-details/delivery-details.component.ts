import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DeliveryService } from '../../../services/delivery.service';
import { DeliveryRequestResponseDto, DeliveryStatus } from '../../../model/delivery.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-delivery-details',
  templateUrl: './delivery-details.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent],
  styleUrls: ['./delivery-details.component.css']
})
export class DeliveryDetailsComponent implements OnInit {
  deliveryId: number = 0;
  delivery: DeliveryRequestResponseDto | null = null;
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  isCancelling = false;
  DeliveryStatus = DeliveryStatus; // Make enum available to template

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deliveryService: DeliveryService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.deliveryId = +params['id'];
      this.loadDeliveryDetails();
    });
  }

  loadDeliveryDetails(): void {
    this.isLoading = true;
    this.deliveryService.getDeliveryRequest(this.deliveryId).subscribe({
      next: (response) => {
        if (response.success) {
          this.delivery = response.data;
        } else {
          this.errorMessage = response.message || 'Failed to load delivery details';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while loading delivery details';
        this.isLoading = false;
      }
    });
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

  canCancel(): boolean {
    if (!this.delivery) return false;
    
    return this.delivery.status === DeliveryStatus.Pending || 
           this.delivery.status === DeliveryStatus.TripSelected;
  }

  cancelDelivery(): void {
    if (!this.delivery || !this.canCancel()) return;
    
    this.isCancelling = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.deliveryService.cancelRequest(this.delivery.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Delivery request cancelled successfully';
          this.delivery = response.data;
        } else {
          this.errorMessage = response.message || 'Failed to cancel delivery request';
        }
        this.isCancelling = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while cancelling the delivery request';
        this.isCancelling = false;
      }
    });
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Not available';
    return new Date(date).toLocaleString();
  }

  goBack(): void {
    window.history.back();
  }
} 