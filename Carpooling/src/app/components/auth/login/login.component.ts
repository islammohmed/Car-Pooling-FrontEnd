import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, LoginRequest } from '../../../services/auth.service'; // Adjust path as needed
import { NotificationService } from '../../../services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;

      const loginData: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(loginData).subscribe({
        next: (response) => {
          this.isLoading = false;
          
          if (response.success) {
            // Store token and user data
            this.authService.storeToken(response.data.token);
            this.authService.storeUserData(response.data);
            
            // Show success notification
            this.notificationService.success('Login successful! Welcome back.');
            
            // Navigate to home page
            this.router.navigate(['/home']);
          } else {
            // Handle API error response
            this.notificationService.error(response.message || 'Login failed');
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login error:', error);
          
          // Handle different error scenarios
          if (error.status === 401) {
            this.notificationService.error('Invalid email or password');
          } else if (error.status === 0) {
            this.notificationService.error('Unable to connect to server');
          } else if (error.error?.message) {
            this.notificationService.error(error.error.message);
          } else {
            this.notificationService.error('An error occurred during login');
          }
        }
      });
    } else {
      this.markFormGroupTouched();
      this.notificationService.warning('Please fill in all required fields correctly');
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  // Getter methods for easy access to form controls
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}