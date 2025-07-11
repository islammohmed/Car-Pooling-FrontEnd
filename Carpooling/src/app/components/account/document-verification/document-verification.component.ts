import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { NotificationService } from '../../../services/notification.service';
import { DocumentVerificationDto, DriverRegistrationDto } from '../../../model/user.model';
import { VerificationStatus } from '../../../model/enums.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-document-verification',
  templateUrl: './document-verification.component.html',
  styleUrls: ['./document-verification.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent, FooterComponent]
})
export class DocumentVerificationComponent implements OnInit {
  documentForm: FormGroup;
  isSubmitting = false;
  documentVerifications: DocumentVerificationDto[] = [];
  isLoading = true;
  
  // File upload states
  nationalIdFile: File | null = null;
  drivingLicenseFile: File | null = null;
  carLicenseFile: File | null = null;
  
  // Document status
  hasNationalId = false;
  hasDrivingLicense = false;
  hasCarLicense = false;
  
  nationalIdStatus: VerificationStatus | null = null;
  drivingLicenseStatus: VerificationStatus | null = null;
  carLicenseStatus: VerificationStatus | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.documentForm = this.fb.group({
      model: ['', [Validators.required, Validators.maxLength(50)]],
      color: ['', [Validators.required, Validators.maxLength(20)]],
      plateNumber: ['', [Validators.required, Validators.maxLength(20)]]
    });
  }

  ngOnInit(): void {
    this.loadDocumentVerifications();
  }

  loadDocumentVerifications(): void {
    this.isLoading = true;
    this.userService.getDocumentVerifications().subscribe({
      next: (response) => {
        if (response.success) {
          this.documentVerifications = response.data;
          this.updateDocumentStatus();
        } else {
          this.notificationService.error(response.message || 'Failed to load document verifications');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading document verifications:', error);
        this.notificationService.error('Failed to load document verifications');
        this.isLoading = false;
      }
    });
  }

  updateDocumentStatus(): void {
    // Check for National ID
    const nationalIdDoc = this.documentVerifications.find(doc => doc.documentType === 'NationalId');
    this.hasNationalId = !!nationalIdDoc;
    this.nationalIdStatus = nationalIdDoc?.status ?? null;
    
    // Check for Driving License
    const drivingLicenseDoc = this.documentVerifications.find(doc => doc.documentType === 'DrivingLicense');
    this.hasDrivingLicense = !!drivingLicenseDoc;
    this.drivingLicenseStatus = drivingLicenseDoc?.status ?? null;
    
    // Check for Car License
    const carLicenseDoc = this.documentVerifications.find(doc => doc.documentType === 'CarLicense');
    this.hasCarLicense = !!carLicenseDoc;
    this.carLicenseStatus = carLicenseDoc?.status ?? null;
  }

  onFileSelected(event: Event, documentType: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      
      switch (documentType) {
        case 'NationalId':
          this.nationalIdFile = file;
          break;
        case 'DrivingLicense':
          this.drivingLicenseFile = file;
          break;
        case 'CarLicense':
          this.carLicenseFile = file;
          break;
      }
    }
  }

  uploadSingleDocument(documentType: string, file: File): void {
    if (!file) {
      this.notificationService.error(`Please select a ${documentType} file`);
      return;
    }

    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('documentFile', file);

    this.isSubmitting = true;
    this.userService.updateDocument(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(response.message || `${documentType} uploaded successfully`);
          this.loadDocumentVerifications();
        } else {
          this.notificationService.error(response.message || `Failed to upload ${documentType}`);
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error(`Error uploading ${documentType}:`, error);
        this.notificationService.error(`Failed to upload ${documentType}`);
        this.isSubmitting = false;
      }
    });
  }

  registerAsDriver(): void {
    if (this.documentForm.invalid) {
      this.documentForm.markAllAsTouched();
      return;
    }

    if (!this.nationalIdFile || !this.drivingLicenseFile || !this.carLicenseFile) {
      this.notificationService.error('Please upload all required documents');
      return;
    }

    const driverDto: DriverRegistrationDto = {
      nationalIdImage: this.nationalIdFile,
      drivingLicenseImage: this.drivingLicenseFile,
      carLicenseImage: this.carLicenseFile,
      model: this.documentForm.value.model,
      color: this.documentForm.value.color,
      plateNumber: this.documentForm.value.plateNumber
    };

    const formData = this.userService.prepareDriverRegistrationFormData(driverDto);

    this.isSubmitting = true;
    this.userService.registerAsDriver(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(response.message || 'Driver registration submitted successfully');
          this.loadDocumentVerifications();
        } else {
          this.notificationService.error(response.message || 'Failed to register as driver');
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error registering as driver:', error);
        this.notificationService.error('Failed to register as driver');
        this.isSubmitting = false;
      }
    });
  }

  getStatusClass(status: VerificationStatus | null): string {
    if (status === null) return '';
    
    switch (status) {
      case VerificationStatus.Approved:
        return 'status-approved';
      case VerificationStatus.Rejected:
        return 'status-rejected';
      case VerificationStatus.Pending:
        return 'status-pending';
      default:
        return '';
    }
  }

  getStatusText(status: VerificationStatus | null): string {
    if (status === null) return 'Not Submitted';
    
    switch (status) {
      case VerificationStatus.Approved:
        return 'Approved';
      case VerificationStatus.Rejected:
        return 'Rejected';
      case VerificationStatus.Pending:
        return 'Pending';
      default:
        return 'Unknown';
    }
  }

  navigateToPostTrip(): void {
    this.router.navigate(['/trip/post']);
  }
} 