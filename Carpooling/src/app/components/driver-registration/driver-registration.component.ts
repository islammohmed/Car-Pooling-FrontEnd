import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-driver-registration',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="container mt-5">
      <div class="card">
        <div class="card-header bg-primary text-white">
          <h3>Driver Registration</h3>
        </div>
        <div class="card-body">
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            This is a simplified driver registration page. You can upload your documents here.
          </div>
          
          <div class="mb-4">
            <h5>Required Documents</h5>
            <div class="row">
              <div class="col-md-4 mb-3">
                <label for="nationalId" class="form-label">National ID</label>
                <input type="file" id="nationalId" class="form-control" accept="image/*">
              </div>
              <div class="col-md-4 mb-3">
                <label for="drivingLicense" class="form-label">Driving License</label>
                <input type="file" id="drivingLicense" class="form-control" accept="image/*">
              </div>
              <div class="col-md-4 mb-3">
                <label for="carLicense" class="form-label">Car License</label>
                <input type="file" id="carLicense" class="form-control" accept="image/*">
              </div>
            </div>
          </div>
          
          <div class="mb-4">
            <h5>Car Details</h5>
            <div class="row">
              <div class="col-md-4 mb-3">
                <label for="model" class="form-label">Car Model</label>
                <input type="text" id="model" class="form-control" placeholder="e.g., Toyota Corolla">
              </div>
              <div class="col-md-4 mb-3">
                <label for="color" class="form-label">Car Color</label>
                <input type="text" id="color" class="form-control" placeholder="e.g., Black">
              </div>
              <div class="col-md-4 mb-3">
                <label for="plateNumber" class="form-label">Plate Number</label>
                <input type="text" id="plateNumber" class="form-control" placeholder="e.g., ABC 123">
              </div>
            </div>
          </div>
          
          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-primary">Submit Application</button>
            <a routerLink="/" class="btn btn-secondary">Cancel</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .form-label {
      font-weight: 500;
    }
  `]
})
export class DriverRegistrationComponent implements OnInit {
  constructor() {
    console.log('DriverRegistrationComponent constructor called');
  }

  ngOnInit(): void {
    console.log('DriverRegistrationComponent initialized');
  }
} 