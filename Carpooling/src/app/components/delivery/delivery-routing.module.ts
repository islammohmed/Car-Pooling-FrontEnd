import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DELIVERY_ROUTES } from './delivery.routes';

@NgModule({
  imports: [RouterModule.forChild(DELIVERY_ROUTES)],
  exports: [RouterModule]
})
export class DeliveryRoutingModule { } 