import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TripSearchComponent } from './trip-search/trip-search.component';
import { PostTripComponent } from './post-trip/post-trip.component';
import { MyTripsComponent } from './my-trips/my-trips.component';
import { TripDetailsComponent } from './trip-details/trip-details.component';
import { AuthGuard } from '../../services/auth.guard';
import { DriverVerificationGuard } from '../../services/driver-verification.guard';

const routes: Routes = [
  {
    path: 'search',
    component: TripSearchComponent
  },
  {
    path: 'post',
    component: PostTripComponent,
    canActivate: [AuthGuard, DriverVerificationGuard]
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

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TripRoutingModule { } 