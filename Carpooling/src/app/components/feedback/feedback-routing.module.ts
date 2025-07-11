import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateFeedbackComponent } from './create-feedback/create-feedback.component';
import { DisplayFeedbackComponent } from './display-feedback/display-feedback.component';
import { AuthGuard } from '../../services/auth.guard';

const routes: Routes = [
  {
    path: 'create/:tripId',
    component: CreateFeedbackComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'display/:userId',
    component: DisplayFeedbackComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FeedbackRoutingModule { } 