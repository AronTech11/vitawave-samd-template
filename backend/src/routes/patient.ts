import { Router, Response } from 'express';
import db from '../db/database';
import { Patient, Reading } from '../types';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /patients - Get all patients
router.get('/', (_req: AuthRequest, res: Response, next) => {
  try {
    const stmt = db.prepare('SELECT * FROM patients ORDER BY lastName, firstName');
    const patients = stmt.all() as Patient[];

    res.json({ patients, count: patients.length });
  } catch (error) {
    next(error);
  }
});

// GET /patients/:id - Get single patient
router.get('/:id', (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM patients WHERE id = ?');
    const patient = stmt.get(id) as Patient | undefined;

    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    res.json({ patient });
  } catch (error) {
    next(error);
  }
});

// POST /patients - Create new patient (admin only)
router.post('/', (req: AuthRequest, res: Response, next) => {
  try {
    // Check admin role
    if (req.user?.role !== 'admin') {
      throw new AppError('Admin access required', 403);
    }

    const { firstName, lastName, dateOfBirth, email, phone } = req.body;

    if (!firstName || !lastName || !dateOfBirth || !email) {
      throw new AppError('Missing required fields', 400);
    }

    const stmt = db.prepare(
      'INSERT INTO patients (firstName, lastName, dateOfBirth, email, phone) VALUES (?, ?, ?, ?, ?)'
    );
    
    const result = stmt.run(firstName, lastName, dateOfBirth, email, phone || null);

    const newPatient = db.prepare('SELECT * FROM patients WHERE id = ?').get(result.lastInsertRowid) as Patient;

    res.status(201).json({ message: 'Patient created successfully', patient: newPatient });
  } catch (error) {
    next(error);
  }
});

// PUT /patients/:id - Update patient (admin only)
router.put('/:id', (req: AuthRequest, res: Response, next) => {
  try {
    // Check admin role
    if (req.user?.role !== 'admin') {
      throw new AppError('Admin access required', 403);
    }

    const { id } = req.params;
    const { firstName, lastName, dateOfBirth, email, phone } = req.body;

    // Check if patient exists
    const checkStmt = db.prepare('SELECT * FROM patients WHERE id = ?');
    const existingPatient = checkStmt.get(id);

    if (!existingPatient) {
      throw new AppError('Patient not found', 404);
    }

    const stmt = db.prepare(
      'UPDATE patients SET firstName = ?, lastName = ?, dateOfBirth = ?, email = ?, phone = ? WHERE id = ?'
    );
    
    stmt.run(firstName, lastName, dateOfBirth, email, phone || null, id);

    const updatedPatient = db.prepare('SELECT * FROM patients WHERE id = ?').get(id) as Patient;

    res.json({ message: 'Patient updated successfully', patient: updatedPatient });
  } catch (error) {
    next(error);
  }
});

// DELETE /patients/:id - Delete patient (admin only)
router.delete('/:id', (req: AuthRequest, res: Response, next) => {
  try {
    // Check admin role
    if (req.user?.role !== 'admin') {
      throw new AppError('Admin access required', 403);
    }

    const { id } = req.params;

    const stmt = db.prepare('DELETE FROM patients WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      throw new AppError('Patient not found', 404);
    }

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /patients/:id/readings - Get all readings for a patient
router.get('/:id/readings', (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;

    // Check if patient exists
    const patientStmt = db.prepare('SELECT * FROM patients WHERE id = ?');
    const patient = patientStmt.get(id);

    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    const stmt = db.prepare('SELECT * FROM readings WHERE patientId = ? ORDER BY timestamp DESC');
    const readings = stmt.all(id) as Reading[];

    res.json({ readings, count: readings.length });
  } catch (error) {
    next(error);
  }
});

// POST /patients/:id/readings - Add reading for a patient
router.post('/:id/readings', (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { timestamp, systolicBP, diastolicBP, heartRate, deviceId, notes } = req.body;

    if (!timestamp || !systolicBP || !diastolicBP || !heartRate || !deviceId) {
      throw new AppError('Missing required fields', 400);
    }

    // Check if patient exists
    const patientStmt = db.prepare('SELECT * FROM patients WHERE id = ?');
    const patient = patientStmt.get(id);

    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    const stmt = db.prepare(
      'INSERT INTO readings (patientId, timestamp, systolicBP, diastolicBP, heartRate, deviceId, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    
    const result = stmt.run(id, timestamp, systolicBP, diastolicBP, heartRate, deviceId, notes || null);

    const newReading = db.prepare('SELECT * FROM readings WHERE id = ?').get(result.lastInsertRowid) as Reading;

    res.status(201).json({ message: 'Reading added successfully', reading: newReading });
  } catch (error) {
    next(error);
  }
});

export default router;
