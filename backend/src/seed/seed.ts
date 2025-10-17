import bcrypt from 'bcrypt';
import db from '../db/database';

// Sample data generators
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa',
  'Edward', 'Deborah', 'Ronald', 'Stephanie'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts'
];

const deviceIds = [
  'SAMD-001', 'SAMD-002', 'SAMD-003', 'SAMD-004', 'SAMD-005',
  'SAMD-006', 'SAMD-007', 'SAMD-008', 'SAMD-009', 'SAMD-010'
];

const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomInt = (min: number, max: number): number => 
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const generateEmail = (firstName: string, lastName: string): string => {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
};

const generateDateOfBirth = (): string => {
  const start = new Date(1940, 0, 1);
  const end = new Date(2000, 11, 31);
  return randomDate(start, end).toISOString().split('T')[0];
};

export const seedDatabase = async (): Promise<void> => {
  console.log('Starting database seeding...');

  try {
    // Clear existing data
    db.prepare('DELETE FROM readings').run();
    db.prepare('DELETE FROM patients').run();
    db.prepare('DELETE FROM refresh_tokens').run();
    db.prepare('DELETE FROM users').run();

    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('AdminPass123!', 10);
    const adminStmt = db.prepare(
      'INSERT INTO users (email, password, role, firstName, lastName) VALUES (?, ?, ?, ?, ?)'
    );
    
    adminStmt.run('admin@example.com', adminPassword, 'admin', 'Admin', 'User');
    console.log('Created admin user: admin@example.com / AdminPass123!');

    // Create 50 mock patients
    const patientStmt = db.prepare(
      'INSERT INTO patients (firstName, lastName, dateOfBirth, email, phone) VALUES (?, ?, ?, ?, ?)'
    );

    const patientIds: number[] = [];

    for (let i = 0; i < 50; i++) {
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);
      const dateOfBirth = generateDateOfBirth();
      const email = generateEmail(firstName, lastName);
      const phone = `555-${String(randomInt(100, 999))}-${String(randomInt(1000, 9999))}`;

      const result = patientStmt.run(firstName, lastName, dateOfBirth, email, phone);
      patientIds.push(result.lastInsertRowid as number);
    }

    console.log(`Created ${patientIds.length} patients`);

    // Create readings for each patient (3-10 readings each)
    const readingStmt = db.prepare(
      'INSERT INTO readings (patientId, timestamp, systolicBP, diastolicBP, heartRate, deviceId, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    let totalReadings = 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (const patientId of patientIds) {
      const numReadings = randomInt(3, 10);

      for (let i = 0; i < numReadings; i++) {
        const timestamp = randomDate(thirtyDaysAgo, now).toISOString();
        const systolicBP = randomInt(90, 180);
        const diastolicBP = randomInt(60, 120);
        const heartRate = randomInt(50, 120);
        const deviceId = randomElement(deviceIds);
        
        // Add occasional notes
        const notes = Math.random() > 0.7 
          ? randomElement([
              'Patient feeling well',
              'Slight headache reported',
              'Post-exercise reading',
              'Morning reading',
              'Evening reading',
              'After medication'
            ])
          : null;

        readingStmt.run(patientId, timestamp, systolicBP, diastolicBP, heartRate, deviceId, notes);
        totalReadings++;
      }
    }

    console.log(`Created ${totalReadings} readings`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nLogin credentials:');
    console.log('  Email: admin@example.com');
    console.log('  Password: AdminPass123!');
    console.log(`\nStatistics:`);
    console.log(`  - Users: 1`);
    console.log(`  - Patients: ${patientIds.length}`);
    console.log(`  - Readings: ${totalReadings}`);

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

// Run seed if executed directly
if (require.main === module) {
  const { initDatabase } = require('../db/database');
  initDatabase();
  seedDatabase()
    .then(() => {
      console.log('\nSeeding complete. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
