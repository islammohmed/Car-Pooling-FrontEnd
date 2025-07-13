import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, catchError, throwError } from 'rxjs';
import { MapRoute } from '../model/route.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RouteService {
  private readonly key = 'b17305e1db124fbe9ec3da0776b98f3a';
  
  constructor(private http: HttpClient) {}

  geocoding(address: string): Observable<any> {
    // Use Angular's proxy to avoid CORS issues
    const url = `/geoapify/v1/geocode/autocomplete?text=${encodeURIComponent(address)}&format=json&apiKey=${this.key}`;
    console.log('Geocoding URL:', url);
    
    return this.http.get(url).pipe(
      catchError(this.handleError('Geocode address'))
    );
  }

  autocomplete(){
    const url = `/geoapify/v1/geocode/autocomplete?text=YOUR_TEXT&format=json&apiKey=${this.key}`;
    return this.http.get(url).pipe(
      catchError(this.handleError('Autocomplete'))
    );
  }

  getRoute(startLat: number, startLng: number, endLat: number, endLng: number): Observable<MapRoute> {
    // Validate coordinates
    if (this.isInvalidCoordinate(startLat) || this.isInvalidCoordinate(startLng) || 
        this.isInvalidCoordinate(endLat) || this.isInvalidCoordinate(endLng)) {
      console.error(`Invalid coordinates: start(${startLat},${startLng}), end(${endLat},${endLng})`);
      return throwError(() => new Error('Invalid coordinates. Please provide valid latitude and longitude values.'));
    }
    
    console.log(`Routing API call: ${startLat},${startLng}|${endLat},${endLng}`);
    
    // Use Angular's proxy to avoid CORS issues
    const url = `/geoapify/v1/routing?waypoints=${startLat},${startLng}|${endLat},${endLng}&mode=drive&apiKey=${this.key}`;
    console.log('Routing URL:', url);
    
    return this.http.get(url).pipe(
      map((data: any) => this.parseRouteResponse(data)),
      catchError(this.handleError('Get route'))
    );
  }
  
  private parseRouteResponse(data: any): MapRoute {
    console.log('Route API response:', data);
    
    if (!data || !data.features || !data.features.length || 
        !data.features[0].properties || !data.features[0].geometry || 
        !data.features[0].geometry.coordinates || !data.features[0].geometry.coordinates[0]) {
      throw new Error('Invalid response from routing API');
    }
    
    return {
      duration: data.features[0].properties.time,
      directions: data.features[0].properties.legs[0].steps,
      coordinates: data.features[0].geometry.coordinates[0],
      distance: data.features[0].properties.distance,
    } as MapRoute;
  }
  
  private isInvalidCoordinate(coord: number): boolean {
    return coord === undefined || coord === null || isNaN(coord) || coord === 0;
  }
  
  private handleError(operation: string) {
    return (error: any): Observable<never> => {
      console.error(`${operation} failed:`, error);
      return throwError(() => new Error(`Failed to ${operation.toLowerCase()}: ${error.message || 'Unknown error'}`));
    };
  }
}
