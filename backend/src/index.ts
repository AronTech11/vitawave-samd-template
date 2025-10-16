import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import devicesRouter from './routes/devices';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'VitaWave SAMD Backend API',
    version: '1.0.0',
    status: 'running',
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

app.use('/api/devices', devicesRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
