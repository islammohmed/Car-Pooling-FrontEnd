import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { UpdateDocumentDto, DocumentVerificationDto, ApiResponse } from '../../../model/user.model';
import { VerificationStatus } from '../../../model/enums.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-update-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './update-documents.component.html',
  styleUrls: ['./update-documents.component.css']
})
export class UpdateDocumentsComponent implements OnInit {
  documentForm: FormGroup;
  documentTypes: string[] = ['NationalId', 'DrivingLicense', 'CarLicense'];
  selectedFile: File | null = null;
  isSubmitting = false;
  message = '';
  isSuccess = false;
  isError = false;
  documents: DocumentVerificationDto[] = [];
  isLoading = true;
  verificationStatus = VerificationStatus;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.documentForm = this.fb.group({
      documentType: ['', Validators.required],
      documentFile: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.userService.getDocumentVerifications().subscribe({
      next: (response: ApiResponse<DocumentVerificationDto[]>) => {
        if (response.success) {
          this.documents = response.data;
        } else {
          this.showError(response.message || 'Failed to load documents');
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.showError('Error loading documents: ' + (error.error?.message || error.message || 'Unknown error'));
        this.isLoading = false;
      }
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
      this.documentForm.patchValue({
        documentFile: this.selectedFile
      });
      this.documentForm.get('documentFile')?.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    if (this.documentForm.invalid || !this.selectedFile) {
      this.showError('Please select a document type and file');
      return;
    }

    this.isSubmitting = true;
    this.clearMessages();

    const updateDto: UpdateDocumentDto = {
      documentType: this.documentForm.get('documentType')?.value,
      documentFile: this.selectedFile
    };

    const formData = this.userService.prepareUpdateDocumentFormData(updateDto);

    this.userService.updateDocument(formData).subscribe({
      next: (response: ApiResponse<boolean>) => {
        this.isSubmitting = false;
        if (response.success) {
          this.showSuccess('Document updated successfully');
          this.documentForm.reset();
          this.selectedFile = null;
          this.loadDocuments(); // Reload documents after update
        } else {
          this.showError(response.message || 'Failed to update document');
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        this.showError('Error updating document: ' + (error.error?.message || error.message || 'Unknown error'));
      }
    });
  }

  getStatusClass(status: VerificationStatus): string {
    switch (status) {
      case VerificationStatus.Pending: return 'badge bg-warning text-dark';
      case VerificationStatus.Approved: return 'badge bg-success';
      case VerificationStatus.Rejected: return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  getStatusText(status: VerificationStatus): string {
    switch (status) {
      case VerificationStatus.Pending: return 'Pending';
      case VerificationStatus.Approved: return 'Approved';
      case VerificationStatus.Rejected: return 'Rejected';
      default: return 'Unknown';
    }
  }

  private showSuccess(msg: string): void {
    this.message = msg;
    this.isSuccess = true;
    this.isError = false;
  }

  private showError(msg: string): void {
    this.message = msg;
    this.isError = true;
    this.isSuccess = false;
  }

  private clearMessages(): void {
    this.message = '';
    this.isSuccess = false;
    this.isError = false;
  }
} 