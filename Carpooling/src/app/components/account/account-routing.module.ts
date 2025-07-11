import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DocumentVerificationComponent } from './document-verification/document-verification.component';
import { AuthGuard } from '../../services/auth.guard';

const routes: Routes = [
  {
    path: 'document-verification',
    component: DocumentVerificationComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule { } 