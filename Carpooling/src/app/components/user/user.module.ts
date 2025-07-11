import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BecomeDriverComponent } from './become-driver/become-driver.component';
import { userRoutes } from './user.routes';

@NgModule({
  declarations: [
    // BecomeDriverComponent is now standalone, so it's not declared here
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forChild(userRoutes),
    // Import the standalone component
    BecomeDriverComponent
  ],
  exports: [
    // Export the standalone component
    BecomeDriverComponent
  ]
})
export class UserModule { } 