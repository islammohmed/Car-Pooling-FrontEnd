import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, LoginResponse, DocumentVerificationDto } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  userData: any = null;
  selectedFile: File | null = null;
  isVerifying = false;
  verificationMessage = '';
  verificationSuccess = false;
  documentVerifications: DocumentVerificationDto[] = [];
  isLoadingDocuments = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadDocumentVerifications();
  }

  loadUserData(): void {
    this.userData = this.authService.getUserData();
    if (!this.userData) {
      // If no user data in localStorage, try to get from login response
      const token = this.authService.getToken();
      if (token) {
        // You might want to fetch fresh user data from the server here
        console.log('User data not found in localStorage');
      }
    }
  }

  loadDocumentVerifications(): void {
    this.isLoadingDocuments = true;
    this.authService.getDocumentVerifications().subscribe({
      next: (response) => {
        this.isLoadingDocuments = false;
        if (response.success && response.data) {
          this.documentVerifications = response.data;
        }
      },
      error: (error) => {
        this.isLoadingDocuments = false;
        console.error('Error loading document verifications:', error);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (file.type.startsWith('image/')) {
        this.selectedFile = file;
        this.verificationMessage = '';
      } else {
        this.verificationMessage = 'Please select an image file.';
        this.verificationSuccess = false;
      }
    }
  }

  verifyNationalId(): void {
    if (!this.selectedFile) {
      this.verificationMessage = 'Please select a National ID image first.';
      this.verificationSuccess = false;
      return;
    }

    this.isVerifying = true;
    this.verificationMessage = '';

    this.authService.verifyPassengerNationalId(this.selectedFile).subscribe({
      next: (response) => {
        this.isVerifying = false;
        if (response.success) {
          this.verificationMessage = 'National ID verification submitted successfully! Status: Pending';
          this.verificationSuccess = true;
          this.selectedFile = null;
          // Reset file input
          const fileInput = document.getElementById('nationalIdFile') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
          // Reload document verifications to show the new pending status
          this.loadDocumentVerifications();
        } else {
          this.verificationMessage = response.message || 'Verification failed.';
          this.verificationSuccess = false;
        }
      },
      error: (error) => {
        this.isVerifying = false;
        this.verificationMessage = 'An error occurred during verification. Please try again.';
        this.verificationSuccess = false;
        console.error('Verification error:', error);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserRoleText(role: number): string {
    switch (role) {
      case 0: return 'Passenger';
      case 1: return 'Driver';
      case 2: return 'Admin';
      default: return 'Unknown';
    }
  }

  getVerificationStatusText(isVerified: boolean): string {
    return isVerified ? 'Verified' : 'Not Verified';
  }

  getEmailConfirmationStatusText(isEmailConfirmed: boolean): string {
    return isEmailConfirmed ? 'Confirmed' : 'Not Confirmed';
  }

  getDocumentStatusText(status: string): string {
    switch (status) {
      case 'Pending': return 'Pending';
      case 'UnderReview': return 'Under Review';
      case 'Approved': return 'Approved';
      case 'Rejected': return 'Rejected';
      default: return 'Unknown';
    }
  }

  getDocumentStatusClass(status: string): string {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'UnderReview': return 'status-under-review';
      case 'Approved': return 'status-approved';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  }

  getNationalIdVerificationStatus(): string {
    const nationalIdDoc = this.documentVerifications.find(doc => 
      doc.documentType.toLowerCase().includes('national') || 
      doc.documentType.toLowerCase().includes('id')
    );
    
    if (nationalIdDoc) {
      return this.getDocumentStatusText(nationalIdDoc.status);
    }
    return 'Not Submitted';
  }

  getNationalIdVerificationClass(): string {
    const nationalIdDoc = this.documentVerifications.find(doc => 
      doc.documentType.toLowerCase().includes('national') || 
      doc.documentType.toLowerCase().includes('id')
    );
    
    if (nationalIdDoc) {
      return this.getDocumentStatusClass(nationalIdDoc.status);
    }
    return 'status-not-submitted';
  }

  // Add a helper to determine if upload is allowed
  canUploadNationalId(): boolean {
    const status = this.getNationalIdVerificationStatus();
    return status === 'Rejected' || status === 'Not Submitted';
  }
}
