import { HttpClient } from '@angular/common/http';
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import * as L from 'leaflet';
import { Map, MapStyle, config } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
})
export class MapComponent implements OnInit, OnDestroy {

  private map!: L.Map;

  ngOnInit(): void {
    if (this.map) return; // prevent duplicate initialization

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        this.map = L.map('map').setView([userLat, userLng], 13);
       
        L.tileLayer(
          'https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=GYHHAKd7OsMv1VG5yrOm',
          {
            attribution:
              '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
          }
        ).addTo(this.map);
        // L.marker([userLat, userLng]).addTo(this.map);
        // marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
        // Wait until the map is rendered before calling invalidateSize
        setTimeout(() => {
          this.map.invalidateSize();
        }, 500);
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }
  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
