import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HomeComponent } from './components/home/home.component';
import { NotificationComponent } from './components/Notification/notification/notification.component';
import { SharedModule } from './components/shared/shared.module';
import { TripModule } from './components/trip/trip.module';
import { AccountModule } from './components/account/account.module';
import { DriverRegistrationModule } from './components/driver-registration/driver-registration.module';

// Import standalone components
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DocumentVerificationComponent as AdminDocumentVerificationComponent } from './components/admin/document-verification/document-verification.component';
import { DocumentDetailComponent } from './components/admin/document-detail/document-detail.component';
import { TestRoutingComponent } from './components/test-routing/test-routing.component';
import { DriverRegistrationComponent } from './components/driver-registration/driver-registration.component';
import { UpdateDocumentsComponent } from './components/driver-registration/update-documents/update-documents.component';
import { BecomeDriverComponent } from './components/user/become-driver/become-driver.component';
import { ProfileComponent } from './profile/profile.component';
import { TrackRouteComponent } from './components/track-route/track-route.component';

// Services
import { AuthService } from './services/auth.service';
import { TripService } from './services/trip.service';
import { FeedbackService } from './services/feedback.service';
import { UserService } from './services/user.service';
import { NotificationService } from './services/notification.service';
import { AuthGuard } from './services/auth.guard';

// Interceptors
import { AuthInterceptor } from './services/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    NotificationComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    AppRoutingModule,
    
    // Import standalone components
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    AdminDocumentVerificationComponent,
    DocumentDetailComponent,
    TestRoutingComponent,
    DriverRegistrationComponent,
    UpdateDocumentsComponent,
    BecomeDriverComponent,
    ProfileComponent,
    TrackRouteComponent,
    
    // Feature modules
    SharedModule,
    TripModule,
    AccountModule,
    DriverRegistrationModule
  ],
  providers: [
    AuthService,
    TripService,
    FeedbackService,
    UserService,
    NotificationService,
    AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { } 