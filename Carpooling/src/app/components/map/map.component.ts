import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import * as L from 'leaflet';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import '@geoapify/geocoder-autocomplete/styles/minimal.css';
import 'leaflet/dist/leaflet.css';
import { RouteService } from '../../services/route.service';
import { GeocoderAutocomplete } from '@geoapify/geocoder-autocomplete';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit, OnDestroy {
  private map!: L.Map;
  private userLat = signal<number>(0);
  private userLng = signal<number>(0);

  private destinationLat = signal<number>(0);
  private destinationLng = signal<number>(0);

  private destinationMarker?: L.Marker;
  private routeLine: L.Polyline[] = [];

  constructor(private routeService: RouteService) {}

  ngOnInit(): void {
    if (this.map) return; // prevent duplicate initialization

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.userLat.set(position.coords.latitude);
        this.userLng.set( position.coords.longitude);
        this.map = L.map('map').setView([this.userLat(), this.userLng()], 13);

        L.tileLayer(
          'https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=GYHHAKd7OsMv1VG5yrOm',
          {
            attribution:
              '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
          }
        ).addTo(this.map);

        L.marker([this.userLat(), this.userLng()]).addTo(this.map);
      });
      let autocomplete = new GeocoderAutocomplete(
        document.getElementById('autocomplete')!,
        'b17305e1db124fbe9ec3da0776b98f3a'
      );
      autocomplete.on('select', (location) => {
        this.destinationLat.set(location.properties.lat);
        this.destinationLng.set(location.properties.lon);
        this.DepictRoute();
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }

  // ... rest of your code ...
  DepictRoute() {
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
    // Add a new marker at the selected location (red by default, or use a custom icon)
    const redIcon = new L.Icon({
      iconUrl: 'red-placeholder.png', // Replace with your red marker icon URL
      iconSize: [30, 38],
    });
    this.destinationMarker = L.marker(
      [this.destinationLat(), this.destinationLng()],
      { icon: redIcon }
    )
      .addTo(this.map);

    // Draw a blue line between the user and the destination
    this.routeService.getRoute(this.userLat(), this.userLng(), this.destinationLat(), this.destinationLng()).subscribe( response=> {
      for(let i = 0; i < response.directions.length; i++) {
        const step = response.directions[i];
        const stepLine = L.polyline(
        [
          [response.coordinates[step.from_index][1], response.coordinates[step.from_index][0]],
          [response.coordinates[step.to_index][1], response.coordinates[step.to_index][0]]
        ],
        { color: 'blue' })
        this.routeLine.push(
        stepLine
      );
      stepLine.addTo(this.map);      
      let popupContent = `<b>Step ${i + 1}:</b> ${step.instruction.text}`;
      let route = document.getElementById('route');
      if (route) {
        route.innerHTML += `<p>${JSON.stringify(popupContent)}</p>`;
      }
    }
      
    })
    
    this.map.fitBounds([
      [this.userLat(), this.userLng()],
      [this.destinationLat(), this.destinationLng()],
    ]);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
