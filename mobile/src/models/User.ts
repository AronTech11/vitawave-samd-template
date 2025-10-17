export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends Omit<User, 'role'> {
  patientId?: number; // For patient users
  // Add any other profile-specific fields here
}
