import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ConfirmEmailComponent } from './components/auth/confirm-email/confirm-email.component';
import { AuthGuard } from './services/auth.guard';
import { DriverVerificationGuard } from './services/driver-verification.guard';
import { ProfileComponent } from './profile/profile.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'confirm-email', component: ConfirmEmailComponent },
  { 
    path: 'profile', 
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./components/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard],
    data: { roles: [2] }
  },
  {
    path: 'account',
    loadChildren: () => import('./components/account/account.module').then(m => m.AccountModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'trip',
    loadChildren: () => import('./components/trip/trip.module').then(m => m.TripModule)
  },
  {
    path: 'delivery',
    loadChildren: () => import('./components/delivery/delivery.module').then(m => m.DeliveryModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'user',
    loadChildren: () => import('./components/user/user.module').then(m => m.UserModule)
  },
  {
    path: 'feedback',
    loadChildren: () => import('./components/feedback/feedback.module').then(m => m.FeedbackModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'driver-registration',
    loadChildren: () => import('./components/driver-registration/driver-registration.module').then(m => m.DriverRegistrationModule),
    canActivate: [AuthGuard, DriverVerificationGuard],
    data: { roles: [1] }
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { } 