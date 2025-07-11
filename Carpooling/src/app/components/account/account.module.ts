import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DocumentVerificationComponent } from './document-verification/document-verification.component';
import { SharedModule } from '../shared/shared.module';
import { AccountRoutingModule } from './account-routing.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    AccountRoutingModule,
    DocumentVerificationComponent
  ],
  exports: [
    DocumentVerificationComponent
  ]
})
export class AccountModule { } 