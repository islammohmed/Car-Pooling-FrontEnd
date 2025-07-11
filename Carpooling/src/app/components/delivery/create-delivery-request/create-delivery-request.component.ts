import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DeliveryService } from '../../../services/delivery.service';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-create-delivery-request',
  templateUrl: './create-delivery-request.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent],
  styleUrls: ['./create-delivery-request.component.css']
})
export class CreateDeliveryRequestComponent implements OnInit {
  deliveryForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  minDate: string;

  constructor(
    private fb: FormBuilder,
    private deliveryService: DeliveryService,
    private router: Router
  ) {
    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    this.deliveryForm = this.fb.group({
      sourceLocation: ['', [Validators.required]],
      dropoffLocation: ['', [Validators.required]],
      receiverPhone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      weight: ['', [Validators.required, Validators.min(0.1), Validators.max(100)]],
      itemDescription: ['', [Validators.required]],
      price: ['', [Validators.required, Validators.min(0), Validators.max(10000)]],
      deliveryStartDate: ['', [Validators.required]],
      deliveryEndDate: ['', [Validators.required]]
    }, {
      validators: this.dateRangeValidator
    });
  }

  ngOnInit(): void {}

  // Custom validator to ensure end date is after start date
  dateRangeValidator(group: FormGroup) {
    const startDate = group.get('deliveryStartDate')?.value;
    const endDate = group.get('deliveryEndDate')?.value;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end < start) {
        group.get('deliveryEndDate')?.setErrors({ endDateBeforeStartDate: true });
        return { endDateBeforeStartDate: true };
      }
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.deliveryForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // Format dates to ISO string format
    const formValue = { ...this.deliveryForm.value };
    if (formValue.deliveryStartDate) {
      formValue.deliveryStartDate = new Date(formValue.deliveryStartDate).toISOString();
    }
    if (formValue.deliveryEndDate) {
      formValue.deliveryEndDate = new Date(formValue.deliveryEndDate).toISOString();
    }

    this.deliveryService.createDeliveryRequest(formValue).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/delivery/matching-trips', response.data.id]);
        } else {
          this.errorMessage = response.message || 'Failed to create delivery request';
          this.isSubmitting = false;
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while creating the delivery request';
        this.isSubmitting = false;
      }
    });
  }
} 