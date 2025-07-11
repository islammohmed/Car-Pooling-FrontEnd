import { Routes } from '@angular/router';
import { BecomeDriverComponent } from './become-driver/become-driver.component';

export const userRoutes: Routes = [
  { 
    path: 'become-driver', 
    component: BecomeDriverComponent 
  },
  {
    path: '', 
    redirectTo: 'become-driver', 
    pathMatch: 'full'
  }
]; 