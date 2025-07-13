import { ApplicationConfig, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { 
  AuthService, 
  TripService, 
  FeedbackService, 
  UserService, 
  NotificationService,
  AuthGuard,
  authInterceptor
} from './core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    AuthService,
    TripService,
    FeedbackService,
    UserService,
    NotificationService,
    AuthGuard
  ]
};
