import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DocumentVerificationComponent } from './document-verification/document-verification.component';
import { DocumentDetailComponent } from './document-detail/document-detail.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { AuthGuard } from '../../services/auth.guard';

const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'documents', 
    pathMatch: 'full' 
  },
  { 
    path: 'documents', 
    component: DocumentVerificationComponent,
    canActivate: [AuthGuard],
    data: { roles: [2] } // Admin role
  },
  { 
    path: 'documents/:userId', 
    component: DocumentDetailComponent,
    canActivate: [AuthGuard],
    data: { roles: [2] } // Admin role
  },
  {
    path: 'users',
    component: UserManagementComponent,
    canActivate: [AuthGuard],
    data: { roles: [2] } // Admin role
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
