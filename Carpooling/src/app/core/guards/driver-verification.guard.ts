import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/enums.model';

@Injectable({
  providedIn: 'root'
})
export class DriverVerificationGuard implements CanActivate {
  
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    // Check if user is logged in and is a driver
    const userData = this.authService.getUserData();
    if (!userData || userData.userRole !== UserRole.Driver) {
      this.notificationService.error('Only drivers can access this page');
      this.router.navigate(['/']);
      return false;
    }

    // Allow access to document update page regardless of verification status
    if (state.url.includes('/driver-registration/update-documents')) {
      return true;
    }

    // Check driver verification status for other driver pages
    return this.userService.getDriverVerificationStatus().pipe(
      map(response => {
        if (response.success && response.data) {
          return true; // Driver is verified
        } else {
          // Driver is not verified, redirect to document update page
          this.notificationService.warning('You need to verify your documents before accessing this page');
          this.router.navigate(['/driver-registration/update-documents']);
          return false;
        }
      }),
      catchError(error => {
        console.error('Error checking driver verification:', error);
        this.notificationService.error('Failed to check verification status');
        return of(false);
      })
    );
  }
} 