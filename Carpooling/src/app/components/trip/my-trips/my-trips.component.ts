import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TripService } from '../../../services/trip.service';
import { TripListDto, TripParticipantDto } from '../../../model/trip.model';
import { AuthService } from '../../../services/auth.service';
import { UserRole, TripStatus, JoinStatus } from '../../../model/enums.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { NotificationService } from '../../../services/notification.service';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ModalService } from '../../../services/modal.service';

// Extended TripListDto to include participants and booked seats
interface ExtendedTripListDto extends TripListDto {
  participants?: TripParticipantDto[];
  bookedSeats?: number;
}

@Component({
  selector: 'app-my-trips',
  templateUrl: './my-trips.component.html',
  styleUrls: ['./my-trips.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, FooterComponent]
})
export class MyTripsComponent implements OnInit {
  trips: ExtendedTripListDto[] = [];
  filteredTrips: ExtendedTripListDto[] = [];
  displayedTrips: ExtendedTripListDto[] = [];
  isLoading = false;
  isDriver = false;
  TripStatus = TripStatus; // Make enum available to template
  JoinStatus = JoinStatus; // Make enum available to template
  tripStatuses = Object.values(TripStatus); // Make enum values available for dropdown
  stars = [1, 2, 3, 4, 5]; // Array for star ratings
  selectedFilter = 'all';
  
  // Pagination
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;

  // Add a property to store the ID of the trip to be completed
  private tripToCompleteId: number | null = null;

  constructor(
    private tripService: TripService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private modalService: ModalService
  ) { }

  ngOnInit(): void {
    // Check if user is a driver
    const userData = this.authService.getUserData();
    if (!userData) {
      this.notificationService.error('You must be logged in to view your trips');
      this.router.navigate(['/login']);
      return;
    }

    this.isDriver = userData.userRole === UserRole.Driver;
    
    if (this.isDriver) {
      this.loadDriverTrips();
    } else {
      this.loadPassengerBookings();
    }
  }

  async loadDriverTrips(): Promise<void> {
    this.isLoading = true;
    try {
      const trips = await firstValueFrom(this.tripService.getMyTrips());
      
      // Get detailed trip information for each trip
      const extendedTrips = await Promise.all(
        trips.map(async (trip) => {
          try {
            // Ensure trip has a valid ID
            if (!trip.id || isNaN(trip.id)) {
              console.error('Invalid trip ID in response:', trip);
              return null;
            }
            
            const detailedTrip = await firstValueFrom(this.tripService.getTripById(trip.id));
            return {
              ...trip,
              participants: detailedTrip?.participants || [],
              bookedSeats: detailedTrip?.participants?.filter(p => p.joinStatus === JoinStatus.Approved).length || 0
            } as ExtendedTripListDto;
          } catch (error) {
            console.error(`Error fetching details for trip ${trip.id}:`, error);
            return {
              ...trip,
              participants: [],
              bookedSeats: 0
            } as ExtendedTripListDto;
          }
        })
      );
      
      // Filter out null trips (those with invalid IDs)
      this.trips = extendedTrips.filter(trip => trip !== null) as ExtendedTripListDto[];
      this.applyFilter(this.selectedFilter);
    } catch (error) {
      console.error('Error loading trips:', error);
      this.notificationService.error('Failed to load your trips');
    } finally {
      this.isLoading = false;
    }
  }

  loadPassengerBookings(): void {
    this.isLoading = true;
    this.tripService.getMyBookings().subscribe({
      next: (trips) => {
        // Filter out trips with invalid IDs
        this.trips = trips.filter(trip => trip.id !== undefined && trip.id !== null && !isNaN(trip.id));
        
        if (this.trips.length < trips.length) {
          console.warn('Filtered out trips with invalid IDs:', 
            trips.filter(trip => trip.id === undefined || trip.id === null || isNaN(trip.id)));
        }
        
        this.applyFilter(this.selectedFilter);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.notificationService.error('Failed to load your bookings');
        this.isLoading = false;
      }
    });
  }

  filterTrips(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedFilter = select.value;
    this.applyFilter(this.selectedFilter);
  }

  applyFilter(filter: string): void {
    if (filter === 'all') {
      this.filteredTrips = [...this.trips];
    } else {
      const statusFilter = filter as TripStatus;
      this.filteredTrips = this.trips.filter(trip => trip.status === statusFilter);
    }
    
    this.totalPages = Math.ceil(this.filteredTrips.length / this.pageSize);
    this.goToPage(1);
  }
  
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    
    this.currentPage = page;
    const startIndex = (page - 1) * this.pageSize;
    this.displayedTrips = this.filteredTrips.slice(startIndex, startIndex + this.pageSize);
  }
  
  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }
  
  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  viewTripDetails(tripId: number): void {
    console.log('Trip ID:', tripId);
    if (tripId !== undefined && tripId !== null && !isNaN(tripId)) {
      this.router.navigate(['/trip/details', tripId]);
    } else {
      console.error('Invalid trip ID:', tripId);
      this.notificationService.error('Invalid trip ID');
    }
  }

  // Helper method to get star class based on rating
  getStarClass(starPosition: number, rating: number): string {
    if (starPosition <= rating) {
      return 'fas fa-star';
    } else if (starPosition - 0.5 <= rating) {
      return 'fas fa-star-half-alt';
    } else {
      return 'far fa-star';
    }
  }
  
  // Helper method to get initials from name
  getInitials(name: string): string {
    if (!name) return '?';
    
    const nameParts = name.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }
  
  // Helper method to get status class for TripStatus
  getTripStatusClass(status: TripStatus): string {
    switch (status) {
      case TripStatus.Pending:
        return 'status-pending';
      case TripStatus.Confirmed:
        return 'status-confirmed';
      case TripStatus.Ongoing:
        return 'status-ongoing';
      case TripStatus.Completed:
        return 'status-completed';
      case TripStatus.Cancelled:
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  }
  
  // Helper method to get status text for TripStatus
  getTripStatusText(status: TripStatus): string {
    switch (status) {
      case TripStatus.Pending:
        return 'Pending';
      case TripStatus.Confirmed:
        return 'Confirmed';
      case TripStatus.Ongoing:
        return 'Ongoing';
      case TripStatus.Completed:
        return 'Completed';
      case TripStatus.Cancelled:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  // Helper method to get status class (for JoinStatus - existing)
  getStatusClass(status: JoinStatus): string {
    switch (status) {
      case JoinStatus.Approved:
        return 'approved';
      case JoinStatus.Pending:
        return 'pending';
      case JoinStatus.Rejected:
        return 'rejected';
      default:
        return '';
    }
  }
  
  // Helper method to get status text (for JoinStatus - existing)
  getStatusText(status: JoinStatus): string {
    switch (status) {
      case JoinStatus.Approved:
        return 'Approved';
      case JoinStatus.Pending:
        return 'Pending';
      case JoinStatus.Rejected:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }

  viewMatchingDeliveries(tripId: number): void {
    if (tripId !== undefined && tripId !== null && !isNaN(tripId)) {
      this.router.navigate(['/delivery/driver/pending-deliveries'], { 
        queryParams: { tripId: tripId } 
      });
    } else {
      console.error('Invalid trip ID:', tripId);
      this.notificationService.error('Invalid trip ID');
    }
  }

  // Method to open the completion confirmation modal
  openCompleteTripModal(tripId: number): void {
    if (!tripId || isNaN(tripId)) {
      this.notificationService.error('Invalid trip ID');
      return;
    }
    
    this.tripToCompleteId = tripId;
    this.modalService.open('completeTripModal');
  }

  // Method to confirm trip completion (called from the modal)
  confirmCompleteTrip(): void {
    if (!this.tripToCompleteId || isNaN(this.tripToCompleteId)) {
      this.notificationService.error('Invalid trip ID');
      this.modalService.close('completeTripModal');
      return;
    }

    console.log('Confirming trip completion for ID:', this.tripToCompleteId);
    console.log('Trip ID type:', typeof this.tripToCompleteId);
    
    // Ensure tripId is a number
    const numericTripId = Number(this.tripToCompleteId);
    
    this.tripService.completeTrip(numericTripId).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.notificationService.success('Trip marked as completed successfully!');
          // Reload trips to update status
          this.loadDriverTrips();
          this.modalService.close('completeTripModal');
        } else {
          this.notificationService.error(response?.message || 'Failed to complete trip');
          this.modalService.close('completeTripModal');
        }
      },
      error: (error) => {
        console.error('Error completing trip:', error);
        this.notificationService.error('Failed to complete trip: ' + (error.error?.message || error.message || 'Unknown error'));
        this.modalService.close('completeTripModal');
      }
    });
  }

  // Keep the existing completeTrip method for backward compatibility
  completeTrip(tripId: number): void {
    this.openCompleteTripModal(tripId);
  }

  leaveFeedback(tripId: number): void {
    if (!tripId || isNaN(tripId)) {
      this.notificationService.error('Invalid trip ID');
      return;
    }
    
    // Navigate to the correct feedback creation route
    this.router.navigate(['/feedback/create', tripId]);
  }
}
