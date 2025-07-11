import { Routes } from '@angular/router';
import { DriverRegistrationComponent } from './driver-registration.component';
import { UpdateDocumentsComponent } from './update-documents/update-documents.component';

export const driverRegistrationRoutes: Routes = [
  { 
    path: '', 
    component: DriverRegistrationComponent 
  },
  { 
    path: 'update-documents', 
    component: UpdateDocumentsComponent 
  }
]; 