import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { MapRoute } from '../model/route.model';

@Injectable({
  providedIn: 'root',
})
export class RouteService {
  private readonly key = 'b17305e1db124fbe9ec3da0776b98f3a';
  constructor(private http: HttpClient) {}

  geocoding(address: string): Observable<any> {
    var url = `https://api.geoapify.com/v1/geocode/autocomplete?text=YOUR_TEXT&format=json&apiKey=${this.key}`;
    return this.http.get(url);
  }

  autocomplete(){
    var url = `https://api.geoapify.com/v1/geocode/autocomplete?text=YOUR_TEXT&format=json&apiKey=${this.key}`;
    return this.http.get(url);
  }

  getRoute(startLat: number, startLng: number , endLat: number, endLng: number): Observable<MapRoute> {
    console.log(`${startLat},${startLng}|${endLat},${endLng}`)
    let routeApi = `https://api.geoapify.com/v1/routing?waypoints=${startLat},${startLng}|${endLat},${endLng}&mode=drive&apiKey=${this.key}`;
    return this.http.get(routeApi)
    .pipe<MapRoute>(
        map((data:any) =>{
          // return data
          return {
            duration: data.features[0].properties.time,
            directions: data.features[0].properties.legs[0].steps,
            coordinates: data.features[0].geometry.coordinates[0],
            distance: data.features[0].properties.distance,
          } as MapRoute;
        }
        ));
  }
}
