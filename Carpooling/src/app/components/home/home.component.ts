import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../model/enums.model';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { FooterComponent } from '../shared/footer/footer.component';
import { TripSearchComponent } from '../trip/trip-search/trip-search.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent, TripSearchComponent]
})
export class HomeComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isDriver(): boolean {
    const userData = this.authService.getUserData();
    return userData && userData.userRole === UserRole.Driver;
  }

  isPassenger(): boolean {
    const userData = this.authService.getUserData();
    return userData && userData.userRole === UserRole.Passenger;
  }

  isAdmin(): boolean {
    const userData = this.authService.getUserData();
    return userData && userData.userRole === UserRole.Admin;
  }

  navigateToBecomingDriver(): void {
    console.log('Navigating to become driver page...');
    this.router.navigate(['/user/become-driver']).then(
      success => console.log('Navigation success:', success),
      error => console.error('Navigation error:', error)
    );
  }

  directNavigate(path: string): void {
    console.log('Direct navigating to:', path);
    window.location.href = path;
  }
}
