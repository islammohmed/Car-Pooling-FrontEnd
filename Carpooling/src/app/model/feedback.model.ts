export interface CreateFeedbackDto {
  comment: string;
  rating: number;
  tripId: number;
  receiverId: string;
}

// Helper function to validate feedback data
export function validateFeedbackData(data: CreateFeedbackDto): { isValid: boolean, errors: string[] } {
  const errors: string[] = [];
  
  if (!data.comment || data.comment.trim().length < 5) {
    errors.push('Comment is required and must be at least 5 characters');
  }
  
  if (!data.rating || data.rating < 1 || data.rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }
  
  if (!data.tripId || isNaN(data.tripId)) {
    errors.push('Valid trip ID is required');
  }
  
  if (!data.receiverId) {
    errors.push('Receiver ID is required');
  } else {
    console.log('Validating receiverId:', data.receiverId, 'Type:', typeof data.receiverId);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export interface FeedbackResponseDto {
  id: number;
  comment: string;
  rating: number;
  tripId: number;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  tripSource: string;
  tripDestination: string;
  tripStartTime: Date;
}

export interface UserFeedbackSummaryDto {
  userId: string;
  fullName: string;
  averageRating: number;
  totalFeedbacks: number;
  recentFeedbacks: FeedbackResponseDto[];
} 