import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { CommonModule } from '@angular/common';

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userRole: number;
  ssn: string;
  drivingLicenseImage: string;
  national_ID_Image: string;
}

interface RegisterResponseData {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  token: string;
  tokenExpiration: string;
  isVerified: boolean;
  confirmNumber: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  data: RegisterResponseData;
  errors: string[];
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;

  private apiUrl = 'http://localhost:5140/api/Auth/register';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z\s]+$/)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z\s]+$/)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      phone: ['', [Validators.required, Validators.pattern(/^(01[0-9]{9}|\+201[0-9]{9})$/)]],
      nationalId: ['', [Validators.required, Validators.pattern(/^[0-9]{14}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100), this.passwordStrengthValidator]],
      confirmPassword: ['', Validators.required],
      termsAccepted: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const valid = /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
    return valid ? null : { passwordStrength: true };
  }

  private passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmPassword && confirmPassword.errors) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }

  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get email() { return this.registerForm.get('email'); }
  get phone() { return this.registerForm.get('phone'); }
  get nationalId() { return this.registerForm.get('nationalId'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get termsAccepted() { return this.registerForm.get('termsAccepted'); }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getPasswordStrength(): string {
    const password = this.password?.value || '';
    let score = 0;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
    if (password.length >= 8) score++;
    return score < 3 ? 'weak' : score < 4 ? 'medium' : 'strong';
  }

  private formatPhoneNumber(phone: string): string {
    phone = phone.replace(/\s/g, '').trim();
    if (phone.startsWith('01')) return '+20' + phone;
    return phone;
  }

  private prepareRegistrationData(): RegisterRequest {
    const formValue = this.registerForm.value;
    return {
      email: formValue.email.trim().toLowerCase(),
      password: formValue.password,
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      phoneNumber: this.formatPhoneNumber(formValue.phone),
      userRole: 0,
      ssn: formValue.nationalId.trim(),
      drivingLicenseImage: '',
      national_ID_Image: ''
    };
  }

  onSubmit(): void {
    if (!this.registerForm.valid || this.isLoading) {
      this.markAllFieldsAsTouched();
      this.findFirstInvalidField()?.focus();
      return;
    }

    this.isLoading = true;
    const registerData = this.prepareRegistrationData();

    this.http.post<RegisterResponse>(this.apiUrl, registerData).subscribe({
      next: (response) => this.handleRegistrationSuccess(response),
      error: (error) => this.handleRegistrationError(error)
    });
  }

  private handleRegistrationSuccess(response: RegisterResponse): void {
    this.isLoading = false;
    if (response.success) {
      const userData = {
        userId: response.data.userId,
        email: response.data.email,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        confirmNumber: response.data.confirmNumber
      };
      sessionStorage.setItem('pendingUser', JSON.stringify(userData));
      this.notificationService.success(`A confirmation code has been sent to ${response.data.email}.`, { duration: 8000 });
      this.router.navigate(['/confirm-email'], { queryParams: { email: response.data.email, userId: response.data.userId } });
    } else {
      this.notificationService.error(response.message || 'Registration failed. Please try again.', { duration: 6000 });
    }
  }

  private handleRegistrationError(error: any): void {
    this.isLoading = false;
    let errorMessage = 'Registration failed. Please try again.';
    let errorTitle = 'Registration Error';

    switch (error.status) {
      case 400:
        errorMessage = error.error?.errors?.join(', ') || error.error?.message || 'Invalid data provided.';
        errorTitle = 'Validation Error';
        break;
      case 409:
        errorMessage = 'Email or phone number already exists.';
        errorTitle = 'Account Exists';
        break;
      case 422:
        errorMessage = 'Validation failed. Check your inputs.';
        errorTitle = 'Validation Error';
        break;
      case 500:
        errorMessage = 'Server error. Try again later.';
        errorTitle = 'Server Error';
        break;
      case 0:
        errorMessage = 'Network error. Check your connection.';
        errorTitle = 'Connection Error';
        break;
    }

    this.notificationService.error(errorMessage, { duration: 8000 });
  }

  private markAllFieldsAsTouched(): void {
    Object.values(this.registerForm.controls).forEach(control => control.markAsTouched());
  }

  private findFirstInvalidField(): HTMLElement | null {
    const fieldIds = ['firstName', 'lastName', 'email', 'phone', 'nationalId', 'password', 'confirmPassword', 'termsAccepted'];
    for (const id of fieldIds) {
      const control = this.registerForm.get(id);
      if (control?.invalid) {
        return document.getElementById(id);
      }
    }
    return null;
  }

  hasFormErrors(): boolean {
    return this.registerForm.invalid && this.registerForm.touched;
  }

  getFormErrors(): any {
    const errors: any = {};
    Object.entries(this.registerForm.controls).forEach(([key, control]) => {
      if (control.errors) errors[key] = control.errors;
    });
    return errors;
  }
}
