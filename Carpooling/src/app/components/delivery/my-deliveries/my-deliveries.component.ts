import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DeliveryService } from '../../../services/delivery.service';
import { DeliveryRequestResponseDto, DeliveryStatus, UpdateDeliveryStatusDto } from '../../../model/delivery.model';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-my-deliveries',
  templateUrl: './my-deliveries.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent],
  styleUrls: ['./my-deliveries.component.css']
})
export class MyDeliveriesComponent implements OnInit {
  myDeliveries: DeliveryRequestResponseDto[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  processingRequestId: number | null = null;
  statusNotes: string = '';
  DeliveryStatus = DeliveryStatus; // Make enum available to template

  constructor(
    private deliveryService: DeliveryService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadMyDeliveries();
  }

  loadMyDeliveries(): void {
    this.isLoading = true;
    this.deliveryService.getMyDeliveries().subscribe({
      next: (response) => {
        if (response.success) {
          this.myDeliveries = response.data;
        } else {
          this.errorMessage = response.message || 'Failed to load deliveries';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while loading deliveries';
        this.isLoading = false;
      }
    });
  }

  updateStatus(requestId: number, newStatus: DeliveryStatus): void {
    this.processingRequestId = requestId;
    this.errorMessage = '';
    this.successMessage = '';

    const statusData: UpdateDeliveryStatusDto = {
      status: newStatus,
      notes: this.statusNotes.trim() || undefined
    };

    this.deliveryService.updateDeliveryStatus(requestId, statusData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = `Delivery status updated to ${newStatus}`;
          
          // Update the delivery in the list
          const index = this.myDeliveries.findIndex(d => d.id === requestId);
          if (index !== -1) {
            this.myDeliveries[index] = response.data;
          }
          
          // Clear the notes
          this.statusNotes = '';
          this.processingRequestId = null;
        } else {
          this.errorMessage = response.message || 'Failed to update delivery status';
          this.processingRequestId = null;
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while updating the delivery status';
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

  getNextStatus(currentStatus: DeliveryStatus): DeliveryStatus | null {
    switch (currentStatus) {
      case DeliveryStatus.Accepted:
        return DeliveryStatus.InTransit;
      case DeliveryStatus.InTransit:
        return DeliveryStatus.Delivered;
      default:
        return null;
    }
  }

  canUpdateStatus(status: DeliveryStatus): boolean {
    return status === DeliveryStatus.Accepted || status === DeliveryStatus.InTransit;
  }

  getNextStatusText(currentStatus: DeliveryStatus): string {
    const nextStatus = this.getNextStatus(currentStatus);
    return nextStatus || '';
  }
} 