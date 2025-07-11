import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-test-routing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-5">
      <div class="card">
        <div class="card-header bg-success text-white">
          <h3>Routing Test Page</h3>
        </div>
        <div class="card-body">
          <p>This is a test page to verify routing is working correctly.</p>
          <div class="d-grid gap-2">
            <a routerLink="/become-driver" class="btn btn-primary">Go to Become Driver</a>
            <a routerLink="/" class="btn btn-secondary">Back to Home</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TestRoutingComponent implements OnInit {

  constructor() {
    console.log('TestRoutingComponent constructor called');
  }

  ngOnInit(): void {
    console.log('TestRoutingComponent initialized');
  }
} 