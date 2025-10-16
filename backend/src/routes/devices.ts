import { Router, Request, Response } from 'express';

const router = Router();

interface DeviceData {
  id: string;
  name: string;
  data: Record<string, unknown>;
  timestamp: string;
}

// Mock data store
const deviceDataStore: DeviceData[] = [];

// Get all device data
router.get('/', (_req: Request, res: Response) => {
  res.json(deviceDataStore);
});

// Get device data by ID
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = deviceDataStore.filter(item => item.id === id);
  res.json(data);
});

// Post new device data
router.post('/', (req: Request, res: Response) => {
  const newData: DeviceData = {
    id: req.body.id,
    name: req.body.name,
    data: req.body.data,
    timestamp: new Date().toISOString(),
  };
  deviceDataStore.push(newData);
  res.status(201).json(newData);
});

export default router;
