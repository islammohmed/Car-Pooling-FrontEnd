import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FeedbackService } from '../../../services/feedback.service';
import { UserFeedbackSummaryDto } from '../../../model/feedback.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-display-feedback',
  templateUrl: './display-feedback.component.html',
  styleUrls: ['./display-feedback.component.css'],
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent]
})
export class DisplayFeedbackComponent implements OnInit {
  userId: string;
  feedbackSummary: UserFeedbackSummaryDto | null = null;
  isLoading = true;
  errorMessage: string = '';

  constructor(
    private feedbackService: FeedbackService,
    private route: ActivatedRoute
  ) {
    // Get userId from route params
    this.userId = this.route.snapshot.paramMap.get('userId')!;
  }

  ngOnInit(): void {
    if (!this.userId) {
      this.errorMessage = 'User ID is required';
      this.isLoading = false;
      return;
    }

    this.loadUserFeedback();
  }

  loadUserFeedback(): void {
    this.isLoading = true;

    this.feedbackService.getUserFeedbackSummary(this.userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.feedbackSummary = response.data;
        } else {
          this.errorMessage = response.message || 'Failed to load feedback';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading feedback:', error);
        this.errorMessage = error.error?.message || 'Failed to load feedback';
        this.isLoading = false;
      }
    });
  }
}
