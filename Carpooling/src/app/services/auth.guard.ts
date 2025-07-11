import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Check if route has roles restriction
    if (route.data && route.data['roles']) {
      const userRole = this.authService.getUserData()?.userRole;
      const requiredRoles = route.data['roles'];

      // Check if user has required role
      if (userRole === undefined || !requiredRoles.includes(userRole)) {
        this.router.navigate(['/']);
        return false;
      }
    }

    return true;
  }
} 