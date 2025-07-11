import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DriverRegistrationComponent } from './driver-registration.component';
import { UpdateDocumentsComponent } from './update-documents/update-documents.component';
import { driverRegistrationRoutes } from './driver-registration.routes';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(driverRegistrationRoutes),
    DriverRegistrationComponent,
    UpdateDocumentsComponent
  ]
})
export class DriverRegistrationModule { } 