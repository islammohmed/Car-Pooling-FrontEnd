import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { CreateFeedbackComponent } from './create-feedback/create-feedback.component';
import { DisplayFeedbackComponent } from './display-feedback/display-feedback.component';
import { FeedbackRoutingModule } from './feedback-routing.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    FeedbackRoutingModule,
    CreateFeedbackComponent,
    DisplayFeedbackComponent
  ],
  exports: []
})
export class FeedbackModule { } 