export interface CreateDeliveryRequestDto {
  receiverPhone: string;
  dropoffLocation: string;
  sourceLocation: string;
  weight: number;
  itemDescription: string;
  price: number;
  deliveryStartDate: Date;
  deliveryEndDate: Date;
}

export interface DeliveryRequestResponseDto {
  id: number;
  receiverPhone: string;
  dropoffLocation: string;
  sourceLocation: string;
  weight: number;
  itemDescription: string;
  price: number;
  status: DeliveryStatus;
  senderId: string;
  senderName: string;
  tripId?: number;
  driverName?: string;
  estimatedDeliveryTime?: Date;
  deliveryStartDate?: Date;
  deliveryEndDate?: Date;
  matchingTrips?: TripListDto[];
  notes?: string;
  statusHistory?: DeliveryStatusHistoryDto[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface UpdateDeliveryStatusDto {
  status: DeliveryStatus;
  notes?: string;
}

export interface SelectTripDto {
  tripId: number;
  notes?: string;
}

export interface DeliveryStatusHistoryDto {
  status: DeliveryStatus;
  timestamp: Date;
  notes?: string;
}

export enum DeliveryStatus {
  Pending = 'Pending',
  TripSelected = 'TripSelected',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  InTransit = 'InTransit',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled',
  Expired = 'Expired'
}

export interface TripListDto {
  tripId: number;
  driverName: string;
  pricePerSeat: number;
  estimatedDuration: string;
  availableSeats: number;
  tripDescription: string;
  status: string;
  sourceLocation: string;
  destination: string;
  startTime: Date;
  createdAt: Date;
  genderPreference: string;
  participantsCount: number;
} 