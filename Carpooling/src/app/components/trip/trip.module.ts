import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TripSearchComponent } from './trip-search/trip-search.component';
import { PostTripComponent } from './post-trip/post-trip.component';
import { MyTripsComponent } from './my-trips/my-trips.component';
import { TripDetailsComponent } from './trip-details/trip-details.component';
import { SharedModule } from '../shared/shared.module';
import { TripRoutingModule } from './trip-routing.module';
import { TrackRouteComponent } from '../track-route/track-route.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    TripRoutingModule,
    TripSearchComponent,
    TrackRouteComponent,
    PostTripComponent,
    MyTripsComponent,
    TripDetailsComponent
  ],
  exports: [
    TripSearchComponent,
    PostTripComponent,
    MyTripsComponent,
    TripDetailsComponent,
    TrackRouteComponent
  ]
})
export class TripModule { } 