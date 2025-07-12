import { Gender, TripStatus } from './enums.model';

export interface Trip {
  id: number;
  driverId: string;
  driverName: string;
  pricePerSeat: number;
  estimatedDuration: string;
  availableSeats: number;
  notes: string;
  status: TripStatus;
  sourceLocation: string;
  destination: string;
  startTime: Date;
  tripDescription: string;
  genderPreference: Gender;
  acceptsDeliveries: boolean;
  maxDeliveryWeight?: number;
  driverRating?: number;
}

export interface TripListDto {
  id: number;
  source: string;
  destination: string;
  departureTime: string;
  availableSeats: number;
  price: number;
  status: TripStatus;
  driverName: string;
  driverRating: number;
  driverId: string;
}

export interface TripDto {
  id: number;
  source: string;
  destination: string;
  departureTime: string;
  availableSeats: number;
  price: number;
  status: TripStatus;
  description?: string;
  driverId: string;
  driverName: string;
  driverRating: number;
  participants: TripParticipantDto[];
}

export interface TripParticipantDto {
  userId: string;
  userName: string;
  joinStatus: number;
  isDriver?: boolean;
  seatCount?: number;
  phoneNumber?: string;
  email?: string;
  rating?: number;
  profileImage?: string;
  userRole?: number;
  gender?: number;
  joinDate?: string;
}

export interface CreateTripDto {
  driverId: string;
  sourceLocation: string;
  sourceLongitude: string;
  sourceLatitude: string;
  sourceCity: string;
  destination: string;
  startTime: Date;
  pricePerSeat: number;
  availableSeats: number;
  estimatedDuration: string;
  genderPreference: Gender;
  acceptsDeliveries: boolean;
  maxDeliveryWeight?: number;
  tripDescription: string;
  notes: string;
  status: TripStatus;
}

export interface BookTripDto {
  tripId: number;
  seatCount: number;
  userId?: string;
  status?: string;
  joinedAt?: string;
}

export interface CancelTripDto {
  tripId: number;
  userId: string;
  cancellationReason: string;
}

export interface PaginationParams {
  pageNumber: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
} 