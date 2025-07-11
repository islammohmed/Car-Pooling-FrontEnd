import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminRoutingModule } from './admin-routing.module';
import { DocumentVerificationComponent } from './document-verification/document-verification.component';
import { DocumentDetailComponent } from './document-detail/document-detail.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    AdminRoutingModule,
    DocumentVerificationComponent,
    DocumentDetailComponent
  ]
})
export class AdminModule { }
