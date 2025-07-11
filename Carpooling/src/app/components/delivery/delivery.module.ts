import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DeliveryRoutingModule } from './delivery-routing.module';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { DeliveryService } from '../../services/delivery.service';
import { TripService } from '../../services/trip.service';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DeliveryRoutingModule,
    // Note: Standalone components don't need to be imported here
  ],
  providers: [
    AuthService,
    UserService,
    DeliveryService,
    TripService
  ]
})
export class DeliveryModule { } 