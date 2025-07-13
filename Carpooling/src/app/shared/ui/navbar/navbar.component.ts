import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/enums.model';
import { DeliveryService } from '../../../core/services/delivery.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isUserDropdownOpen = false;
  isLoggedIn = false;
  userData: any = null;
  selectedDeliveryCount = 0;
  private refreshSubscription?: Subscription;

  constructor(
    private authService: AuthService, 
    private deliveryService: DeliveryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.updateLoginStatus();
    this.authService.authChange.subscribe(() => {
      this.updateLoginStatus();
    });
    
    // Set up periodic refresh of selected delivery count (every 2 minutes)
    this.refreshSubscription = interval(120000).subscribe(() => {
      this.checkSelectedDeliveries();
    });
  }
  
  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  updateLoginStatus(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.userData = this.authService.getUserData();
      if (this.userData?.userRole === UserRole.Driver) {
        this.checkSelectedDeliveries();
      }
    } else {
      this.userData = null;
      this.selectedDeliveryCount = 0;
    }
  }

  checkSelectedDeliveries(): void {
    if (this.isLoggedIn && this.userData?.userRole === UserRole.Driver) {
      this.deliveryService.getSelectedForMe().subscribe({
        next: (response) => {
          if (response.success) {
            this.selectedDeliveryCount = response.data.length;
          }
        },
        error: (error) => {
          console.error('Error fetching selected deliveries:', error);
        }
      });
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      this.isUserDropdownOpen = false;
    }
  }

  toggleUserDropdown(): void {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
    if (this.isUserDropdownOpen) {
      this.isMenuOpen = false;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserInitials(): string {
    if (!this.userData) return '';
    
    const firstName = this.userData.firstName || '';
    const lastName = this.userData.lastName || '';
    
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  getUserRoleText(): string {
    if (!this.userData) return '';
    
    switch (this.userData.userRole) {
      case UserRole.Passenger:
        return 'Passenger';
      case UserRole.Driver:
        return 'Driver';
      case UserRole.Admin:
        return 'Administrator';
      default:
        return '';
    }
  }
}
