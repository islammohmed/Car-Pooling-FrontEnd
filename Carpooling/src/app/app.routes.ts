import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ConfirmEmailComponent } from './components/auth/confirm-email/confirm-email.component';
import { HomeComponent } from './components/home/home.component';
import { DocumentVerificationComponent } from './components/admin/document-verification/document-verification.component';
import { DocumentDetailComponent } from './components/admin/document-detail/document-detail.component';
import { AuthGuard } from './services/auth.guard';
import { UserRole } from './model/enums.model';
import { TestRoutingComponent } from './components/test-routing/test-routing.component';
import { DriverRegistrationComponent } from './components/driver-registration/driver-registration.component';
import { CreateFeedbackComponent } from './components/feedback/create-feedback/create-feedback.component';
import { ProfileComponent } from './profile/profile.component';
import { TrackRouteComponent } from './components/track-route/track-route.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { 
    path: 'login', 
    loadChildren: () => import('./components/auth/auth.module').then(m => m.AuthModule) 
  },
  { 
    path: 'register', 
    loadChildren: () => import('./components/auth/auth.module').then(m => m.AuthModule) 
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'confirm-email', component: ConfirmEmailComponent },
  { 
    path: 'profile', 
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'admin/documents', 
    component: DocumentVerificationComponent,
    canActivate: [AuthGuard],
    data: { roles: ['Admin'] }
  },
  { 
    path: 'admin/documents/:userId', 
    component: DocumentDetailComponent,
    canActivate: [AuthGuard],
    data: { roles: ['Admin'] }
  },
  {
    path: 'account',
    loadChildren: () => import('./components/account/account.module').then(m => m.AccountModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'trip',
    loadChildren: () => import('./components/trip/trip.module').then(m => m.TripModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./components/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard],
    data: { roles: [UserRole.Admin] }
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
  // Direct route to feedback creation for troubleshooting
  { 
    path: 'direct-feedback/:tripId', 
    component: CreateFeedbackComponent,
    canActivate: [AuthGuard]
  },
  { path: 'test-routing', component: TestRoutingComponent },
  { path: 'driver-registration', component: DriverRegistrationComponent },
  { 
    path: 'track/:id', 
    component: TrackRouteComponent
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
