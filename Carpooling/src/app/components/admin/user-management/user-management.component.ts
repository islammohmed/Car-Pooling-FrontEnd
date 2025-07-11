import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { NotificationService } from '../../../services/notification.service';
import { UserDto } from '../../../model/user.model';
import { UserRole } from '../../../model/enums.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: UserDto[] = [];
  filteredUsers: UserDto[] = [];
  loading = true;
  searchTerm = '';
  roleFilter = 'all';
  statusFilter = 'all';
  UserRole = UserRole;
  
  constructor(
    private userService: UserService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        if (response && response.success) {
          this.users = response.data || [];
          this.applyFilters();
        } else {
          this.notificationService.error('Failed to load users');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.notificationService.error('Failed to load users: ' + (error.error?.message || error.message || 'Unknown error'));
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      // Apply search term filter
      const searchMatch = !this.searchTerm || 
        user.firstName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.phoneNumber?.includes(this.searchTerm);
      
      // Apply role filter
      const roleMatch = this.roleFilter === 'all' || 
        (this.roleFilter === 'admin' && user.userRole === UserRole.Admin) ||
        (this.roleFilter === 'driver' && user.userRole === UserRole.Driver) ||
        (this.roleFilter === 'passenger' && user.userRole === UserRole.Passenger);
      
      // Apply status filter
      const statusMatch = this.statusFilter === 'all' ||
        (this.statusFilter === 'blocked' && user.isBlocked) ||
        (this.statusFilter === 'active' && !user.isBlocked);
      
      return searchMatch && roleMatch && statusMatch;
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  onRoleFilterChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  getUserRoleName(role: number): string {
    switch (role) {
      case UserRole.Passenger: return 'Passenger';
      case UserRole.Driver: return 'Driver';
      case UserRole.Admin: return 'Admin';
      default: return 'Unknown';
    }
  }

  blockUser(user: UserDto): void {
    if (!user || !user.id) return;
    
    if (confirm(`Are you sure you want to block ${user.firstName} ${user.lastName}?`)) {
      this.userService.blockUser(user.id).subscribe({
        next: (response) => {
          if (response && response.success) {
            this.notificationService.success(`User ${user.firstName} ${user.lastName} has been blocked`);
            user.isBlocked = true;
          } else {
            this.notificationService.error('Failed to block user');
          }
        },
        error: (error) => {
          console.error('Error blocking user:', error);
          this.notificationService.error('Failed to block user: ' + (error.error?.message || error.message || 'Unknown error'));
        }
      });
    }
  }

  unblockUser(user: UserDto): void {
    if (!user || !user.id) return;
    
    if (confirm(`Are you sure you want to unblock ${user.firstName} ${user.lastName}?`)) {
      this.userService.unblockUser(user.id).subscribe({
        next: (response) => {
          if (response && response.success) {
            this.notificationService.success(`User ${user.firstName} ${user.lastName} has been unblocked`);
            user.isBlocked = false;
          } else {
            this.notificationService.error('Failed to unblock user');
          }
        },
        error: (error) => {
          console.error('Error unblocking user:', error);
          this.notificationService.error('Failed to unblock user: ' + (error.error?.message || error.message || 'Unknown error'));
        }
      });
    }
  }

  deleteUser(user: UserDto): void {
    if (!user || !user.id) return;
    
    if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: (response) => {
          if (response && response.success) {
            this.notificationService.success(`User ${user.firstName} ${user.lastName} has been deleted`);
            this.users = this.users.filter(u => u.id !== user.id);
            this.applyFilters();
          } else {
            this.notificationService.error('Failed to delete user');
          }
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.notificationService.error('Failed to delete user: ' + (error.error?.message || error.message || 'Unknown error'));
        }
      });
    }
  }

  refreshUsers(): void {
    this.loadUsers();
  }
  
  resetFilters(): void {
    this.searchTerm = '';
    this.roleFilter = 'all';
    this.statusFilter = 'all';
    this.applyFilters();
  }
  
  // Helper methods for the template to avoid filter operations in the template
  getPassengersCount(): number {
    return this.users.filter(u => u.userRole === UserRole.Passenger).length;
  }
  
  getDriversCount(): number {
    return this.users.filter(u => u.userRole === UserRole.Driver).length;
  }
  
  getBlockedUsersCount(): number {
    return this.users.filter(u => u.isBlocked).length;
  }
}
