import { Patient } from '../models/Patient';
import { Reading } from '../models/Reading';
import { User } from '../models/User';

// Mock names for generating patients
const firstNames = ['John', 'Jane', 'Peter', 'Mary', 'David', 'Susan', 'Michael', 'Linda', 'William', 'Patricia'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

/**
 * Generates a random integer between min and max (inclusive).
 */
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generates a random date of birth string.
 */
const getRandomDob = (): string => {
  const year = getRandomInt(1950, 2005);
  const month = getRandomInt(1, 12).toString().padStart(2, '0');
  const day = getRandomInt(1, 28).toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generates a single mock patient.
 * @param id - The patient ID.
 * @returns A mock Patient object.
 */
export const generateMockPatient = (id: number): Patient => {
  const firstName = firstNames[getRandomInt(0, firstNames.length - 1)];
  const lastName = lastNames[getRandomInt(0, lastNames.length - 1)];
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${id}@example.com`;

  const user: User = {
    id: id,
    email: email,
    firstName: firstName,
    lastName: lastName,
    role: 'patient',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    id: id,
    userId: id,
    user: user,
    dateOfBirth: getRandomDob(),
    gender: getRandomInt(0, 1) === 0 ? 'Male' : 'Female',
    contactNumber: `555-01${id.toString().padStart(2, '0')}`,
    address: `${id} Mockingbird Lane`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    medicalHistory: ['Hypertension'],
    currentMedications: ['Lisinopril'],
  };
};

/**
 * Generates a list of mock patients.
 * @param count - The number of patients to generate.
 * @returns An array of mock Patient objects.
 */
export const generateMockPatients = (count: number): Patient[] => {
  return Array.from({ length: count }, (_, i) => generateMockPatient(i + 1));
};

/**
 * Generates a single mock blood pressure reading.
 * @param patientId - The ID of the patient for this reading.
 * @param daysAgo - How many days in the past the reading should be.
 * @returns A mock Reading object.
 */
export const generateMockReading = (patientId: number, daysAgo: number): Reading => {
  const timestamp = new Date();
  timestamp.setDate(timestamp.getDate() - daysAgo);
  timestamp.setHours(getRandomInt(8, 20));
  timestamp.setMinutes(getRandomInt(0, 59));

  return {
    localId: `uuid-${patientId}-${Date.now()}-${getRandomInt(1000, 9999)}`,
    patientId: patientId,
    timestamp: timestamp.toISOString(),
    systolicBP: getRandomInt(110, 160),
    diastolicBP: getRandomInt(70, 100),
    heartRate: getRandomInt(60, 90),
    deviceId: 'MockDevice-123',
    synced: Math.random() > 0.5, // Randomly synced or not
    createdAt: timestamp.toISOString(),
    updatedAt: timestamp.toISOString(),
  };
};

/**
 * Generates a series of mock readings for a single patient.
 * @param patientId - The ID of the patient.
 * @param count - The number of readings to generate.
 * @returns An array of mock Reading objects.
 */
export const generateMockReadingsForPatient = (patientId: number, count: number): Reading[] => {
  return Array.from({ length: count }, (_, i) => generateMockReading(patientId, i));
};

/**
 * Generates a full dataset of mock patients and their readings.
 * @param patientCount - The number of patients to create.
 * @param readingsPerPatient - The number of readings for each patient.
 * @returns An object with patients and readings.
 */
export const generateFullMockData = (
  patientCount: number = 10,
  readingsPerPatient: number = 20
): { patients: Patient[]; readings: Reading[] } => {
  const patients = generateMockPatients(patientCount);
  const readings = patients.flatMap(patient =>
    generateMockReadingsForPatient(patient.id, readingsPerPatient)
  );
  return { patients, readings };
};
