import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService, DocumentVerificationDto } from '../../../services/admin.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-document-verification',
  templateUrl: './document-verification.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe],
  styleUrls: ['./document-verification.component.css']
})
export class DocumentVerificationComponent implements OnInit {
  pendingDocuments: DocumentVerificationDto[] = [];
  loading = true;
  error: string | null = null;
  
  // Group documents by user
  groupedDocuments: { [userId: string]: DocumentVerificationDto[] } = {};
  userIds: string[] = [];

  constructor(
    private adminService: AdminService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadPendingDocuments();
  }

  loadPendingDocuments(): void {
    this.loading = true;
    this.adminService.getPendingDocuments().subscribe({
      next: (response) => {
        if (response.success) {
          this.pendingDocuments = response.data;
          this.groupDocumentsByUser();
        } else {
          this.error = response.message || 'Failed to load pending documents';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error loading pending documents: ' + (err.message || 'Unknown error');
        this.loading = false;
      }
    });
  }

  groupDocumentsByUser(): void {
    this.groupedDocuments = {};
    
    // Group documents by user ID
    this.pendingDocuments.forEach(doc => {
      if (!this.groupedDocuments[doc.userId]) {
        this.groupedDocuments[doc.userId] = [];
      }
      this.groupedDocuments[doc.userId].push(doc);
    });
    
    // Extract user IDs for iteration
    this.userIds = Object.keys(this.groupedDocuments);
  }

  getUserName(userId: string): string {
    const docs = this.groupedDocuments[userId];
    if (docs && docs.length > 0) {
      return docs[0].userFullName;
    }
    return 'Unknown User';
  }

  getDocumentCount(userId: string): number {
    return this.groupedDocuments[userId]?.length || 0;
  }

  viewUserDocuments(userId: string): void {
    this.router.navigate(['/admin/documents', userId]);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'Approved': return 'status-approved';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  }
}
