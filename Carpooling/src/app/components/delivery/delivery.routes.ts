import { Routes } from '@angular/router';
import { CreateDeliveryRequestComponent } from './create-delivery-request/create-delivery-request.component';
import { MatchingTripsComponent } from './matching-trips/matching-trips.component';
import { MyRequestsComponent } from './my-requests/my-requests.component';
import { MyDeliveriesComponent } from './my-deliveries/my-deliveries.component';
import { DeliveryDetailsComponent } from './delivery-details/delivery-details.component';
import { AuthGuard } from '../../services/auth.guard';
import { SelectedDeliveriesComponent } from './selected-deliveries/selected-deliveries.component';

export const DELIVERY_ROUTES: Routes = [
  // User routes
  { path: 'create', component: CreateDeliveryRequestComponent, canActivate: [AuthGuard] },
  { path: 'matching-trips/:id', component: MatchingTripsComponent, canActivate: [AuthGuard] },
  { path: 'my-requests', component: MyRequestsComponent, canActivate: [AuthGuard] },
  { path: 'details/:id', component: DeliveryDetailsComponent, canActivate: [AuthGuard] },
  
  // Driver routes
  { 
    path: 'driver', 
    children: [
      // Delivery requests that have been selected for driver's trips
      {
        path: 'selected-deliveries',
        component: SelectedDeliveriesComponent,
        canActivate: [AuthGuard],
        data: { roles: [1] }
      },
      // Deliveries the driver has accepted to handle
      { 
        path: 'my-deliveries', 
        component: MyDeliveriesComponent, 
        canActivate: [AuthGuard], 
        data: { roles: [1] } 
      },
      // Driver can also create delivery requests (as a user)
      { 
        path: 'create-request', 
        component: CreateDeliveryRequestComponent, 
        canActivate: [AuthGuard], 
        data: { roles: [1] } 
      },
      // Driver's own delivery requests (as a user)
      { 
        path: 'my-requests', 
        component: MyRequestsComponent, 
        canActivate: [AuthGuard], 
        data: { roles: [1] } 
      }
    ]
  }
]; 