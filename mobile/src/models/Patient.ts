import { User } from './User';

export interface Patient {
  id: number;
  userId: number;
  user?: User; // Embedded user object
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  contactNumber?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  // Medical info
  medicalHistory?: string[];
  currentMedications?: string[];
}
