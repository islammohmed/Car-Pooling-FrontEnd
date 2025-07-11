import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService, DocumentVerificationDto, DocumentVerificationActionDto } from '../../../services/admin.service';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-document-detail',
  templateUrl: './document-detail.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe],
  styleUrls: ['./document-detail.component.css']
})
export class DocumentDetailComponent implements OnInit {
  userId: string = '';
  documents: DocumentVerificationDto[] = [];
  loading = true;
  error: string | null = null;
  userName = 'User';
  
  showRejectionForm = false;
  currentDocumentId: number | null = null;
  rejectionForm: FormGroup;
  
  processingAction = false;
  actionSuccess: string | null = null;
  actionError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.rejectionForm = this.fb.group({
      rejectionReason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
      this.loadUserDocuments();
    });
  }

  loadUserDocuments(): void {
    this.loading = true;
    this.adminService.getUserDocuments(this.userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.documents = response.data;
          if (this.documents.length > 0) {
            this.userName = this.documents[0].userFullName;
          }
        } else {
          this.error = response.message || 'Failed to load user documents';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error loading user documents: ' + (err.message || 'Unknown error');
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'Approved': return 'status-approved';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  }

  getUserInitials(): string {
    if (!this.userName) return 'U';
    
    const nameParts = this.userName.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return this.userName.substring(0, 2).toUpperCase();
  }

  showRejectForm(documentId: number): void {
    this.currentDocumentId = documentId;
    this.showRejectionForm = true;
    this.rejectionForm.reset();
  }

  cancelRejection(): void {
    this.showRejectionForm = false;
    this.currentDocumentId = null;
  }

  approveDocument(documentId: number): void {
    this.processDocumentAction({
      documentId: documentId,
      newStatus: 'Approved'
    });
  }

  rejectDocument(): void {
    if (this.rejectionForm.invalid || !this.currentDocumentId) {
      return;
    }

    this.processDocumentAction({
      documentId: this.currentDocumentId,
      newStatus: 'Rejected',
      rejectionReason: this.rejectionForm.value.rejectionReason
    });
  }

  processDocumentAction(action: DocumentVerificationActionDto): void {
    this.processingAction = true;
    this.actionSuccess = null;
    this.actionError = null;

    this.adminService.verifyDocument(action).subscribe({
      next: (response) => {
        if (response.success) {
          this.actionSuccess = response.message || 'Document status updated successfully';
          this.showRejectionForm = false;
          this.currentDocumentId = null;
          
          // Reload documents after a short delay
          setTimeout(() => {
            this.loadUserDocuments();
          }, 1500);
        } else {
          this.actionError = response.message || 'Failed to update document status';
        }
        this.processingAction = false;
      },
      error: (err) => {
        this.actionError = 'Error updating document: ' + (err.message || 'Unknown error');
        this.processingAction = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/documents']);
  }
}
