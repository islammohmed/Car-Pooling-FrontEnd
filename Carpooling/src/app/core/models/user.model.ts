import { VerificationStatus } from './enums.model';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userRole: number;
  isVerified: boolean;
  isEmailConfirmed: boolean;
  avgRating: number;
}

export interface DocumentVerificationDto {
  id: number;
  userId: string;
  documentType: string;
  documentImage: string;
  status: VerificationStatus;
  submissionDate: Date;
}

export interface PassengerVerificationDto {
  nationalIdImage: File;
}

export interface DriverVerificationDto {
  nationalIdImage: File;
  drivingLicenseImage: File;
  carLicenseImage: File;
}

export interface UpdateDocumentDto {
  documentType: string;
  documentFile: File;
}

export interface DriverRegistrationDto {
  nationalIdImage: File;
  drivingLicenseImage: File;
  carLicenseImage: File;
  model: string;
  color: string;
  plateNumber: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
} 

export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  userRole: number;
  gender: number;
  avgRating: number;
  profileImage: string;
  hasLoggedIn: boolean;
  isVerified: boolean;
  isBlocked?: boolean;
} 