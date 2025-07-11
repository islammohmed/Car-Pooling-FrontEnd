import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { DocumentVerificationDto, DriverRegistrationDto } from '../../../model/user.model';
import { CommonModule } from '@angular/common';
import { VerificationStatus } from '../../../model/enums.model';

@Component({
  selector: 'app-become-driver',
  templateUrl: './become-driver.component.html',
  styleUrls: ['./become-driver.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule]
})
export class BecomeDriverComponent implements OnInit {
  driverForm: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  nationalIdFile: File | null = null;
  drivingLicenseFile: File | null = null;
  carLicenseFile: File | null = null;
  
  // Document verification status
  documentVerifications: DocumentVerificationDto[] = [];
  isLoadingDocuments = false;
  documentError = '';
  
  // Enum for template usage
  VerificationStatus = VerificationStatus;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    console.log('BecomeDriverComponent constructor called');
    this.driverForm = this.fb.group({
      model: ['', [Validators.required]],
      color: ['', [Validators.required]],
      plateNumber: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    console.log('BecomeDriverComponent initialized');
    // Fetch document verification status
    this.loadDocumentVerifications();
  }

  loadDocumentVerifications(): void {
    this.isLoadingDocuments = true;
    this.documentError = '';
    
    this.userService.getDocumentVerifications().subscribe({
      next: (response) => {
        this.isLoadingDocuments = false;
        if (response.success) {
          this.documentVerifications = response.data;
        } else {
          this.documentError = response.message || 'Failed to load document status';
        }
      },
      error: (error) => {
        this.isLoadingDocuments = false;
        this.documentError = error.error?.message || 'An error occurred while loading document status';
      }
    });
  }
  
  // Helper methods for document status checks
  areAllDocumentsApproved(): boolean {
    if (this.documentVerifications.length === 0) {
      return false;
    }
    return this.documentVerifications.every(doc => doc.status === VerificationStatus.Approved);
  }
  
  hasRejectedDocuments(): boolean {
    return this.documentVerifications.some(doc => doc.status === VerificationStatus.Rejected);
  }
  
  hasPendingDocumentsOnly(): boolean {
    return this.documentVerifications.some(doc => doc.status === VerificationStatus.Pending) && 
           !this.documentVerifications.some(doc => doc.status === VerificationStatus.Rejected);
  }
  
  getStatusText(status: VerificationStatus): string {
    switch(status) {
      case VerificationStatus.Approved:
        return 'Approved';
      case VerificationStatus.Rejected:
        return 'Rejected';
      case VerificationStatus.Pending:
      default:
        return 'Pending';
    }
  }

  getStatusClass(status: VerificationStatus): string {
    switch(status) {
      case VerificationStatus.Approved:
        return 'status-approved';
      case VerificationStatus.Rejected:
        return 'status-rejected';
      case VerificationStatus.Pending:
      default:
        return 'status-pending';
    }
  }

  getStatusIcon(status: VerificationStatus): string {
    switch(status) {
      case VerificationStatus.Approved:
        return 'fa-check-circle';
      case VerificationStatus.Rejected:
        return 'fa-times-circle';
      case VerificationStatus.Pending:
      default:
        return 'fa-clock';
    }
  }

  onNationalIdChange(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.nationalIdFile = element.files[0];
    }
  }

  onDrivingLicenseChange(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.drivingLicenseFile = element.files[0];
    }
  }

  onCarLicenseChange(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.carLicenseFile = element.files[0];
    }
  }

  onSubmit(): void {
    if (this.driverForm.invalid) {
      return;
    }

    if (!this.nationalIdFile || !this.drivingLicenseFile || !this.carLicenseFile) {
      this.errorMessage = 'All documents are required';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const driverDto: DriverRegistrationDto = {
      nationalIdImage: this.nationalIdFile,
      drivingLicenseImage: this.drivingLicenseFile,
      carLicenseImage: this.carLicenseFile,
      model: this.driverForm.get('model')?.value,
      color: this.driverForm.get('color')?.value,
      plateNumber: this.driverForm.get('plateNumber')?.value
    };

    const formData = this.userService.prepareDriverRegistrationFormData(driverDto);

    this.userService.registerAsDriver(formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success) {
          this.successMessage = 'Your driver registration has been submitted successfully. Please wait for admin approval.';
          this.driverForm.reset();
          this.nationalIdFile = null;
          this.drivingLicenseFile = null;
          this.carLicenseFile = null;
          // Reload document verifications after successful submission
          this.loadDocumentVerifications();
        } else {
          this.errorMessage = response.message || 'An error occurred during registration';
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message || 'An error occurred during registration';
      }
    });
  }
} 