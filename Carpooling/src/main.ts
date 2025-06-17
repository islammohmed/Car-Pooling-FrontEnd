import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes'; // Adjust path as needed

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(), // This is what you need to add
    provideRouter(routes),
    // Add other providers here as needed
  ]
}).catch(err => console.error(err));