import { Routes } from '@angular/router';
import { TripSearchComponent } from './trip-search/trip-search.component';
import { PostTripComponent } from './post-trip/post-trip.component';
import { MyTripsComponent } from './my-trips/my-trips.component';
import { TripDetailsComponent } from './trip-details/trip-details.component';
import { AuthGuard } from '../../core/guards/auth.guard';

export const TRIP_ROUTES: Routes = [
  { path: '', component: TripSearchComponent },
  { 
    path: 'post', 
    component: PostTripComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'my-trips', 
    component: MyTripsComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'details/:id', 
    component: TripDetailsComponent,
    canActivate: [AuthGuard]
  }
]; 