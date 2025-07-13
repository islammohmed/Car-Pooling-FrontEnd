import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { DocumentVerificationComponent } from './components/admin/document-verification/document-verification.component';
import { DocumentDetailComponent } from './components/admin/document-detail/document-detail.component';
import { TestRoutingComponent } from './components/test-routing/test-routing.component';
import { DriverRegistrationComponent } from './components/driver-registration/driver-registration.component';
import { CreateFeedbackComponent } from './components/feedback/create-feedback/create-feedback.component';
import { ProfileComponent } from './profile/profile.component';
import { TrackRouteComponent } from './components/track-route/track-route.component';
import { AuthGuard } from './core';
import { UserRole } from './core/models/enums.model';
import { AUTH_ROUTES } from './features/auth';
import { TRIP_ROUTES } from './features/trip';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: '', children: AUTH_ROUTES },
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
    children: TRIP_ROUTES,
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
