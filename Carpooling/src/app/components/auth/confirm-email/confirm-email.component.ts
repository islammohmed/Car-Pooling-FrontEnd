import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NotificationService } from '../../../services/notification.service';

interface ConfirmEmailResponse {
  success: boolean;
  message: string;
  data: string;
  errors: string[];
}

@Component({
  selector: 'app-confirm-email',
  templateUrl: './confirm-email.component.html',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  styleUrls: ['../login/login.component.css']
})
export class ConfirmEmailComponent implements OnInit {
  confirmForm: FormGroup;
  isSubmitting = false;
  isResending = false;
  private apiUrl = 'https://localhost:7262/api/Auth/confirm-email';
  private resendUrl = 'https://localhost:7262/api/Auth/resend-confirmation'; // Adjust if different
  
  // Get email and userId from route params or local storage
  private email: string = '';
  private userId: string = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {
    this.confirmForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnInit() {
    // Get email and userId from route query params or local storage
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || localStorage.getItem('confirmationEmail') || '';
      this.userId = params['userId'] || localStorage.getItem('confirmationUserId') || '';
      
      if (!this.email || !this.userId) {
        this.notificationService.error('Missing confirmation details. Please try registering again.');
        this.router.navigate(['/register']);
      }
    });
  }

  get code() {
    return this.confirmForm.get('code');
  }

  onConfirm() {
    if (this.confirmForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const confirmationCode = this.confirmForm.value.code;

      const payload = {
        email: this.email,
        code: confirmationCode,
        userId: this.userId
      };

      this.http.post<ConfirmEmailResponse>(this.apiUrl, payload).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          
          if (response.success) {
            this.notificationService.success(response.message || 'Email confirmed successfully!');
            
            // Clear stored confirmation data
            localStorage.removeItem('confirmationEmail');
            localStorage.removeItem('confirmationUserId');
            
            // Redirect to login or dashboard
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
            
          } else {
            // Handle API success=false case
            const errorMessage = response.errors && response.errors.length > 0 
              ? response.errors.join(', ') 
              : response.message || 'Email confirmation failed';
            
            this.notificationService.error(errorMessage);
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Confirmation error:', error);
          
          let errorMessage = 'Failed to confirm email. Please try again.';
          
          if (error.error?.errors && Array.isArray(error.error.errors)) {
            errorMessage = error.error.errors.join(', ');
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 400) {
            errorMessage = 'Invalid confirmation code. Please check and try again.';
          } else if (error.status === 404) {
            errorMessage = 'Confirmation request not found. Please try registering again.';
          } else if (error.status === 0) {
            errorMessage = 'Unable to connect to server. Please check your connection.';
          }
          
          this.notificationService.error(errorMessage);
        }
      });
    } else {
      this.confirmForm.markAllAsTouched();
      if (this.code?.invalid) {
        this.notificationService.warning('Please enter a valid 6-digit confirmation code.');
      }
    }
  }

  resendCode() {
    if (this.isResending) return;
    
    this.isResending = true;
    
    const payload = {
      email: this.email,
      userId: this.userId
    };

    this.http.post<ConfirmEmailResponse>(this.resendUrl, payload).subscribe({
      next: (response) => {
        this.isResending = false;
        
        if (response.success) {
          this.notificationService.success(response.message || 'Verification code sent to your email!');
        } else {
          const errorMessage = response.errors && response.errors.length > 0 
            ? response.errors.join(', ') 
            : response.message || 'Failed to resend code';
          
          this.notificationService.error(errorMessage);
        }
      },
      error: (error) => {
        this.isResending = false;
        console.error('Resend error:', error);
        
        let errorMessage = 'Failed to resend verification code.';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 429) {
          errorMessage = 'Too many requests. Please wait before requesting another code.';
        } else if (error.status === 0) {
          errorMessage = 'Unable to connect to server. Please check your connection.';
        }
        
        this.notificationService.error(errorMessage);
      }
    });
  }

  // Helper method to format the code input (optional - for better UX)
  onCodeInput(event: any) {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 6) {
      value = value.substring(0, 6); // Limit to 6 digits
    }
    this.confirmForm.patchValue({ code: value });
  }

  // Navigate back to registration
  goBack() {
    this.router.navigate(['/register']);
  }
}