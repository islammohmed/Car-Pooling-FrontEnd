import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import * as L from 'leaflet';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import '@geoapify/geocoder-autocomplete/styles/minimal.css';
import 'leaflet/dist/leaflet.css';
import { RouteService } from '../../services/route.service';
import { GeocoderAutocomplete } from '@geoapify/geocoder-autocomplete';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TripService } from '../../services/trip.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-map',
  templateUrl: './track-route.component.html',
  styleUrls: ['./track-route.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class TrackRouteComponent implements OnInit, OnDestroy {
  private map!: L.Map;
  private tripId: number = -1;
  private userLat = signal<number>(0);
  private userLng = signal<number>(0);

  private sourceLat = signal<number>(0);
  private sourceLng = signal<number>(0);
  private destinationLat = signal<number>(0);
  private destinationLng = signal<number>(0);

  private sourceMarker?: L.Marker;
  private destinationMarker?: L.Marker;
  private routeLine: L.Polyline[] = [];
  
  hasRouteInstructions: boolean = false;
  tripLoaded: boolean = false;
  useUserLocation: boolean = false;
  isLoading: boolean = false;
  isCalculatingRoute: boolean = false;
  
  private readonly apiKey = 'b17305e1db124fbe9ec3da0776b98f3a';
  
  // Fallback coordinates for common Egyptian cities
  private readonly cityCoordinates: { [key: string]: { lat: number, lng: number } } = {
    'alexandria': { lat: 31.2001, lng: 29.9187 },
    'cairo': { lat: 30.0444, lng: 31.2357 },
    'giza': { lat: 29.9870, lng: 31.2118 },
    'sharm el-sheikh': { lat: 27.9158, lng: 34.3300 },
    'luxor': { lat: 25.6872, lng: 32.6396 },
    'aswan': { lat: 24.0889, lng: 32.8998 },
    'hurghada': { lat: 27.2579, lng: 33.8116 },
    'port said': { lat: 31.2652, lng: 32.3019 },
    'suez': { lat: 29.9668, lng: 32.5498 },
    'mansoura': { lat: 31.0409, lng: 31.3785 },
    'tanta': { lat: 30.7865, lng: 31.0004 },
    'asyut': { lat: 27.1783, lng: 31.1859 },
    'ismailia': { lat: 30.6043, lng: 32.2728 },
    'faiyum': { lat: 29.3084, lng: 30.8428 },
    'zagazig': { lat: 30.5833, lng: 31.5167 },
    'damietta': { lat: 31.4175, lng: 31.8144 },
    'assiut': { lat: 27.1783, lng: 31.1859 },
    'damanhur': { lat: 31.0341, lng: 30.4729 },
    'minya': { lat: 28.1099, lng: 30.7503 },
    'qena': { lat: 26.1637, lng: 32.7279 },
    'sohag': { lat: 26.5569, lng: 31.6957 },
    'beni suef': { lat: 29.0661, lng: 31.0994 },
    'marsa matruh': { lat: 31.3543, lng: 27.2373 },
    'new valley': { lat: 25.4476, lng: 30.5546 }
  };

  constructor(private routeService: RouteService,
    private tripService: TripService,
    private route: ActivatedRoute,
    private http: HttpClient) {
    this.tripId = +this.route.snapshot.paramMap.get('id')!;
    console.log('Trip ID from route:', this.tripId);
  }

  ngOnInit(): void {
    if (this.map) return; // prevent duplicate initialization

    this.initMap();
    this.loadTripData();
  }

  initMap(): void {
    // Initialize map without specific coordinates
    this.map = L.map('map').setView([26.8206, 30.8025], 5); // Egypt center

    L.tileLayer(
      'https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=GYHHAKd7OsMv1VG5yrOm',
      {
        attribution:
          '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
      }
    ).addTo(this.map);

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.userLat.set(position.coords.latitude);
        this.userLng.set(position.coords.longitude);
        
        // If trip data is already loaded, update the route
        if (this.tripLoaded) {
          this.updateMapView();
        }
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }

  loadTripData(): void {
    this.isLoading = true;
    this.tripService.getTripById(this.tripId).subscribe({
      next: (response) => {
        console.log('Trip data loaded:', response);
        
        // Check if coordinates are valid or need geocoding
        if (!response) {
          console.error('No trip data returned');
          this.showError('Failed to load trip data. Please try again later.');
          this.isLoading = false;
          return;
        }
        
        // If coordinates are 0, try to geocode the locations
        if ((response.sourceLatitude === 0 && response.sourceLongitude === 0) || 
            (response.destinationLatitute === 0 && response.destinationLongitude === 0)) {
          console.log('Trip has text locations but no coordinates. Geocoding required.');
          this.geocodeLocationsDirect(response.sourceLocation, response.destination);
        } else {
          // Set source and destination coordinates
          this.sourceLat.set(response.sourceLatitude);
          this.sourceLng.set(response.sourceLongitude);
          this.destinationLat.set(response.destinationLatitute);
          this.destinationLng.set(response.destinationLongitude);
          
          this.tripLoaded = true;
          this.isLoading = false;
          this.updateMapView();
        }
      },
      error: (error) => {
        console.error('Error loading trip data:', error);
        this.showError('Failed to load trip data. Please try again later.');
        this.isLoading = false;
        
        // Retry after 3 seconds
        setTimeout(() => {
          console.log('Retrying to load trip data...');
          this.loadTripData();
        }, 3000);
      }
    });
  }

  geocodeLocationsDirect(sourceLocation: string, destinationLocation: string): void {
    console.log(`Direct geocoding: source="${sourceLocation}", destination="${destinationLocation}"`);
    
    // Show loading message
    const routeElement = document.getElementById('route');
    if (routeElement) {
      routeElement.innerHTML = '<div class="loading-message">Geocoding locations...</div>';
    }
    
    // Try to use fallback coordinates first
    const sourceFallback = this.getFallbackCoordinates(sourceLocation);
    const destFallback = this.getFallbackCoordinates(destinationLocation);
    
    if (sourceFallback && destFallback) {
      console.log('Using fallback coordinates for both locations');
      this.sourceLat.set(sourceFallback.lat);
      this.sourceLng.set(sourceFallback.lng);
      this.destinationLat.set(destFallback.lat);
      this.destinationLng.set(destFallback.lng);
      
      this.tripLoaded = true;
      this.isLoading = false;
      this.updateMapView();
      return;
    }
    
    // If we don't have fallbacks for both, try JSONP geocoding
    if (!sourceFallback) {
      this.geocodeWithJSONP(sourceLocation + ', Egypt', 'source');
    } else {
      this.sourceLat.set(sourceFallback.lat);
      this.sourceLng.set(sourceFallback.lng);
      console.log(`Using fallback coordinates for source: ${this.sourceLat()}, ${this.sourceLng()}`);
    }
    
    if (!destFallback) {
      this.geocodeWithJSONP(destinationLocation + ', Egypt', 'destination');
    } else {
      this.destinationLat.set(destFallback.lat);
      this.destinationLng.set(destFallback.lng);
      console.log(`Using fallback coordinates for destination: ${this.destinationLat()}, ${this.destinationLng()}`);
    }
    
    // Check if we've set both coordinates using fallbacks
    if ((sourceFallback || this.sourceLat() !== 0) && 
        (destFallback || this.destinationLat() !== 0)) {
      this.geocodingComplete();
    }
  }
  
  geocodeWithJSONP(location: string, type: 'source' | 'destination'): void {
    // Create a unique callback function name
    const callbackName = 'geocodeCallback_' + type + '_' + Math.random().toString(36).substring(2, 9);
    
    // Add the callback function to window
    (window as any)[callbackName] = (response: any) => {
      console.log(`JSONP ${type} response:`, response);
      
      if (response && response.results && response.results.length > 0) {
        const coords = response.results[0];
        
        if (type === 'source') {
          this.sourceLat.set(coords.lat);
          this.sourceLng.set(coords.lon);
          console.log(`Source geocoded: ${this.sourceLat()}, ${this.sourceLng()}`);
          
          // Check if both geocoding operations are complete
          if (this.destinationLat() !== 0 && this.destinationLng() !== 0) {
            this.geocodingComplete();
          }
        } else {
          this.destinationLat.set(coords.lat);
          this.destinationLng.set(coords.lon);
          console.log(`Destination geocoded: ${this.destinationLat()}, ${this.destinationLng()}`);
          
          // Check if both geocoding operations are complete
          if (this.sourceLat() !== 0 && this.sourceLng() !== 0) {
            this.geocodingComplete();
          }
        }
      } else {
        console.error(`Failed to geocode ${type} location`);
        this.showError(`Could not find coordinates for ${type} location. Please try a different trip.`);
        this.isLoading = false;
      }
      
      // Clean up the script tag and callback
      const scriptElement = document.getElementById('geocode-script-' + type);
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
      delete (window as any)[callbackName];
    };
    
    // Add timeout to handle script loading failure
    const timeoutId = setTimeout(() => {
      console.error(`Geocoding ${type} timed out`);
      this.showError(`Geocoding ${type} timed out. Please try again later.`);
      this.isLoading = false;
      
      // Clean up
      const scriptElement = document.getElementById('geocode-script-' + type);
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
      delete (window as any)[callbackName];
    }, 10000); // 10 seconds timeout
    
    // Create and append the script tag
    const script = document.createElement('script');
    script.id = 'geocode-script-' + type;
    script.src = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(location)}&format=json&apiKey=${this.apiKey}&callback=${callbackName}`;
    
    // Set up onload handler to clear the timeout
    script.onload = () => {
      clearTimeout(timeoutId);
    };
    
    // Set up error handler
    script.onerror = () => {
      clearTimeout(timeoutId);
      console.error(`Failed to load geocoding script for ${type}`);
      this.showError(`Failed to load geocoding service. Please try again later.`);
      this.isLoading = false;
      
      // Clean up
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete (window as any)[callbackName];
    };
    
    document.body.appendChild(script);
  }
  
  geocodingComplete(): void {
    console.log('Both locations geocoded successfully');
    this.tripLoaded = true;
    this.isLoading = false;
    this.updateMapView();
  }

  geocodeLocations(sourceLocation: string, destinationLocation: string): void {
    console.log(`Geocoding: source="${sourceLocation}", destination="${destinationLocation}"`);
    
    // Show loading message
    const routeElement = document.getElementById('route');
    if (routeElement) {
      routeElement.innerHTML = '<div class="loading-message">Geocoding locations...</div>';
    }
    
    // Use forkJoin to run both geocoding requests in parallel
    forkJoin({
      source: this.routeService.geocoding(sourceLocation).pipe(catchError(err => {
        console.error('Error geocoding source:', err);
        return of(null);
      })),
      destination: this.routeService.geocoding(destinationLocation).pipe(catchError(err => {
        console.error('Error geocoding destination:', err);
        return of(null);
      }))
    }).subscribe({
      next: results => {
        console.log('Geocoding results:', results);
        let geocodingSuccessful = true;
        
        // Process source geocoding result
        if (results.source && results.source.results && results.source.results.length > 0) {
          const sourceCoords = results.source.results[0].geometry.coordinates;
          this.sourceLat.set(sourceCoords[1]); // Latitude is second in GeoJSON
          this.sourceLng.set(sourceCoords[0]); // Longitude is first in GeoJSON
          console.log(`Source geocoded: ${this.sourceLat()}, ${this.sourceLng()}`);
        } else {
          console.error('Failed to geocode source location');
          geocodingSuccessful = false;
        }
        
        // Process destination geocoding result
        if (results.destination && results.destination.results && results.destination.results.length > 0) {
          const destCoords = results.destination.results[0].geometry.coordinates;
          this.destinationLat.set(destCoords[1]); // Latitude is second in GeoJSON
          this.destinationLng.set(destCoords[0]); // Longitude is first in GeoJSON
          console.log(`Destination geocoded: ${this.destinationLat()}, ${this.destinationLng()}`);
        } else {
          console.error('Failed to geocode destination location');
          geocodingSuccessful = false;
        }
        
        this.isLoading = false;
        
        if (geocodingSuccessful) {
          this.tripLoaded = true;
          this.updateMapView();
        } else {
          this.showError('Could not find coordinates for one or both locations. Please try a different trip.');
        }
      },
      error: err => {
        console.error('Error during geocoding:', err);
        this.isLoading = false;
        this.showError('Failed to convert locations to coordinates. Please try again later.');
      }
    });
  }

  showError(message: string): void {
    const routeElement = document.getElementById('route');
    if (routeElement) {
      routeElement.innerHTML = `<div class="error-message">${message}</div>`;
    } else {
      alert(message);
    }
  }

  updateMapView(): void {
    // Add source marker (green)
    if (this.sourceMarker) {
      this.map.removeLayer(this.sourceMarker);
    }
    
    const greenIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    this.sourceMarker = L.marker(
      [this.sourceLat(), this.sourceLng()],
      { icon: greenIcon }
    ).addTo(this.map);
    this.sourceMarker.bindPopup("<b>Start Location</b>").openPopup();
    
    // Draw route
    this.DepictRoute();
  }

  refreshCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.userLat.set(position.coords.latitude);
        this.userLng.set(position.coords.longitude);
        
        if (this.useUserLocation) {
          this.DepictRoute();
        }
      });
    }
  }

  toggleUseUserLocation(): void {
    this.useUserLocation = !this.useUserLocation;
    this.DepictRoute();
  }

  // ... rest of your code ...
  DepictRoute() {
    // Check if we have valid coordinates
    if (this.destinationLat() === 0 && this.destinationLng() === 0) {
      console.log('Invalid destination coordinates (0,0). Waiting for trip data to load...');
      return;
    }

    const startLat = this.useUserLocation ? this.userLat() : this.sourceLat();
    const startLng = this.useUserLocation ? this.userLng() : this.sourceLng();

    // Check if start coordinates are valid
    if (startLat === 0 && startLng === 0) {
      console.log('Invalid start coordinates (0,0). Waiting for location data...');
      return;
    }

    if (this.destinationMarker) {
      this.map.removeLayer(this.destinationMarker);
    }
    if (this.routeLine.length > 0) {
      for (let i = 0; i < this.routeLine.length; i++) {
        {
          this.map.removeLayer(this.routeLine[i]);
        }
      }
    }
    
    // Clear previous route instructions
    const routeElement = document.getElementById('route');
    if (routeElement) {
      routeElement.innerHTML = '';
    }
    
    this.hasRouteInstructions = false;
    this.isCalculatingRoute = true;
    
    // Store the start time to ensure minimum loading time
    const startTime = new Date().getTime();
    const minimumLoadingTime = 8000; // 5 seconds minimum loading time
    
    // Add a new marker at the destination location (red)
    const redIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    this.destinationMarker = L.marker(
      [this.destinationLat(), this.destinationLng()],
      { icon: redIcon }
    ).addTo(this.map);
    this.destinationMarker.bindPopup("<b>Destination</b>");

    console.log(`Calculating route from (${startLat},${startLng}) to (${this.destinationLat()},${this.destinationLng()})`);
    
    // Try to get route with JSONP first
    try {
      this.getRouteWithJSONP(startLat, startLng, this.destinationLat(), this.destinationLng(), startTime, minimumLoadingTime);
      
      // Set a fallback timer in case JSONP fails
      setTimeout(() => {
        // If we still don't have route instructions after 8 seconds, use direct line
        if (!this.hasRouteInstructions) {
          console.log('Routing API failed or timed out, using direct line fallback');
          this.ensureMinimumLoadingTime(startTime, minimumLoadingTime, () => {
            this.drawDirectLine(startLat, startLng, this.destinationLat(), this.destinationLng());
          });
        }
      }, 8000); // 8 seconds timeout for fallback
    } catch (error) {
      console.error('Error calling routing API:', error);
      // Use direct line as fallback
      this.ensureMinimumLoadingTime(startTime, minimumLoadingTime, () => {
        this.drawDirectLine(startLat, startLng, this.destinationLat(), this.destinationLng());
      });
    }
  }
  
  ensureMinimumLoadingTime(startTime: number, minimumLoadingTime: number, callback: () => void): void {
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - startTime;
    
    if (elapsedTime < minimumLoadingTime) {
      // If not enough time has passed, wait until minimum time is reached
      const remainingTime = minimumLoadingTime - elapsedTime;
      console.log(`Waiting ${remainingTime}ms to ensure minimum loading time`);
      setTimeout(() => {
        callback();
      }, remainingTime);
    } else {
      // If minimum time has already passed, call the callback immediately
      callback();
    }
  }
  
  getRouteWithJSONP(startLat: number, startLng: number, endLat: number, endLng: number, startTime: number, minimumLoadingTime: number): void {
    // Create a unique callback function name
    const callbackName = 'routeCallback_' + Math.random().toString(36).substring(2, 9);
    
    // Add the callback function to window
    (window as any)[callbackName] = (response: any) => {
      console.log('JSONP route response:', response);
      
      // Ensure minimum loading time before showing results
      this.ensureMinimumLoadingTime(startTime, minimumLoadingTime, () => {
        this.isCalculatingRoute = false;
        
        if (response && response.features && response.features.length > 0) {
          this.hasRouteInstructions = true;
          
          // Clear loading message
          const routeElement = document.getElementById('route');
          if (routeElement) {
            routeElement.innerHTML = '';
          }
          
          const legs = response.features[0].properties.legs;
          if (legs && legs.length > 0 && legs[0].steps) {
            const steps = legs[0].steps;
            const coordinates = response.features[0].geometry.coordinates[0];
            
            for(let i = 0; i < steps.length; i++) {
              const step = steps[i];
              const stepLine = L.polyline(
              [
                [coordinates[step.from_index][1], coordinates[step.from_index][0]],
                [coordinates[step.to_index][1], coordinates[step.to_index][0]]
              ],
              { color: 'blue' })
              this.routeLine.push(stepLine);
              stepLine.addTo(this.map);      
              let popupContent = `<b>Step ${i + 1}:</b> ${step.instruction.text}`;
              let route = document.getElementById('route');
              if (route) {
                route.innerHTML += `<p>${popupContent}</p>`;
              }
            }
            
            // Fit the map to show both markers
            this.map.fitBounds([
              [startLat, startLng],
              [endLat, endLng],
            ]);
          }
        } else {
          console.error('Failed to calculate route');
          this.showError('Failed to calculate route. Please try again later.');
        }
      });
      
      // Clean up the script tag and callback
      const scriptElement = document.getElementById('route-script');
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
      delete (window as any)[callbackName];
    };
    
    // Add timeout to handle script loading failure
    const timeoutId = setTimeout(() => {
      console.error('Route calculation timed out');
      
      this.ensureMinimumLoadingTime(startTime, minimumLoadingTime, () => {
        this.isCalculatingRoute = false;
        this.showError('Route calculation timed out. Please try again later.');
      });
      
      // Clean up
      const scriptElement = document.getElementById('route-script');
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
      delete (window as any)[callbackName];
    }, 15000); // 15 seconds timeout
    
    // Create and append the script tag
    const script = document.createElement('script');
    script.id = 'route-script';
    script.src = `https://api.geoapify.com/v1/routing?waypoints=${startLat},${startLng}|${endLat},${endLng}&mode=drive&apiKey=${this.apiKey}&callback=${callbackName}`;
    
    // Set up onload handler to clear the timeout
    script.onload = () => {
      clearTimeout(timeoutId);
    };
    
    // Set up error handler
    script.onerror = () => {
      clearTimeout(timeoutId);
      
      this.ensureMinimumLoadingTime(startTime, minimumLoadingTime, () => {
        this.isCalculatingRoute = false;
        console.error('Failed to load routing script');
        this.showError('Failed to load routing service. Please try again later.');
      });
      
      // Clean up
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete (window as any)[callbackName];
    };
    
    document.body.appendChild(script);
  }

  drawDirectLine(startLat: number, startLng: number, endLat: number, endLng: number): void {
    console.log('Drawing direct line between points');
    this.isCalculatingRoute = false;
    
    // Clear loading message
    const routeElement = document.getElementById('route');
    if (routeElement) {
      routeElement.innerHTML = '';
    }
    
    // Draw a straight line between start and end points
    const directLine = L.polyline(
      [
        [startLat, startLng],
        [endLat, endLng]
      ],
      { 
        color: 'blue',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10',
        lineJoin: 'round'
      }
    );
    
    this.routeLine.push(directLine);
    directLine.addTo(this.map);
    
    // Calculate approximate distance
    const distance = this.calculateDistance(startLat, startLng, endLat, endLng);
    
    // Add a simple instruction
    this.hasRouteInstructions = true;
    if (routeElement) {
      routeElement.innerHTML = `
        <div class="direct-route-info">
          <p><b>Direct Route</b> (as the crow flies)</p>
          <p>Distance: approximately ${distance.toFixed(1)} km</p>
          <p class="note">Note: This is a direct line and doesn't follow roads. Actual driving distance may be longer.</p>
        </div>
      `;
    }
    
    // Fit the map to show both markers
    this.map.fitBounds([
      [startLat, startLng],
      [endLat, endLng],
    ]);
  }
  
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  }
  
  deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  getFallbackCoordinates(location: string): { lat: number, lng: number } | null {
    if (!location) return null;
    
    // Clean up the location string for matching
    const cleanLocation = location.toLowerCase()
      .replace(/,.*$/, '') // Remove everything after a comma
      .trim();
    
    // Try to find an exact match
    if (this.cityCoordinates[cleanLocation]) {
      return this.cityCoordinates[cleanLocation];
    }
    
    // Try to find a partial match
    for (const city in this.cityCoordinates) {
      if (cleanLocation.includes(city) || city.includes(cleanLocation)) {
        return this.cityCoordinates[city];
      }
    }
    
    return null;
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
