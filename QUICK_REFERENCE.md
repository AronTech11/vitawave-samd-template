# Quick Reference Guide

## 🚀 Common Commands

### Root Level
```bash
# Install all dependencies
npm install

# Run all tests
npm test

# Run tests in CI mode with coverage
npm run test:ci

# Type check all workspaces
npm run type-check

# Lint all workspaces
npm run lint

# Build all workspaces
npm run build

# Clean all node_modules
npm run clean
```

### Mobile App
```bash
cd mobile

# Start Expo dev server
npm start

# Start for iOS simulator
npm run ios

# Start for Android emulator
npm run android

# Start for web
npm run web

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint

# Build for iOS (EAS)
npm run build:ios

# Build for Android (EAS)
npm run build:android
```

### Backend
```bash
cd backend

# Start development server (with hot reload)
npm run dev

# Start production server
npm start

# Build TypeScript
npm run build

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

## 📁 Key Files

### Configuration
- `.devcontainer/devcontainer.json` - DevContainer settings
- `tsconfig.json` - Root TypeScript config
- `.eslintrc.json` - ESLint rules
- `.prettierrc.json` - Prettier formatting
- `.github/workflows/ci.yml` - CI pipeline

### Mobile
- `mobile/app.json` - Expo configuration
- `mobile/eas.json` - EAS Build configuration
- `mobile/App.tsx` - Main app entry point
- `mobile/src/services/BLEService.ts` - BLE service

### Backend
- `backend/src/index.ts` - Server entry point
- `backend/src/routes/devices.ts` - Device API routes
- `backend/.env.example` - Environment variables template

## 🧪 Testing on Physical Devices (BLE)

### Prerequisites
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login
```

### Development Build
```bash
cd mobile

# Configure EAS (first time only)
eas build:configure

# Build for iOS
eas build --profile development --platform ios

# Build for Android
eas build --profile development --platform android
```

### Local Build (React Native CLI)
```bash
cd mobile

# iOS (requires Mac + Xcode)
npx expo run:ios

# Android (requires Android Studio)
npx expo run:android
```

## 🔧 Troubleshooting

### Clear Cache
```bash
# Clear npm cache
npm cache clean --force

# Clear Expo cache
cd mobile
npx expo start -c
```

### Reinstall Dependencies
```bash
# From root
npm run clean
npm install
```

### Fix Linting Issues Automatically
```bash
# Root
npm run lint -- --fix

# Mobile
cd mobile
npm run lint -- --fix

# Backend
cd backend
npm run lint -- --fix
```

## 🌐 API Endpoints

### Backend (default: http://localhost:3000)

- `GET /` - API info
- `GET /health` - Health check
- `GET /api/devices` - Get all device data
- `GET /api/devices/:id` - Get device data by ID
- `POST /api/devices` - Post new device data

## 📱 BLE Service Usage

```typescript
import { bleService } from '@/services/BLEService';

// Request permissions (Android)
await bleService.requestPermissions();

// Check Bluetooth state
const state = await bleService.checkBluetoothState();

// Start scanning
bleService.startScan(
  (device) => console.log('Found:', device.name),
  (error) => console.error('Error:', error)
);

// Stop scanning
bleService.stopScan();

// Connect to device
const device = await bleService.connectToDevice(deviceId);

// Disconnect
await bleService.disconnect();
```

## 🐳 DevContainer

### Open in Container
1. Open project in VS Code
2. Click "Reopen in Container" when prompted
3. Or use Command Palette: `Remote-Containers: Reopen in Container`

### Benefits
- Consistent Node.js 18 environment
- All extensions pre-installed
- Automatic dependency installation
- Port forwarding configured
- GitHub CLI included

## 📊 Project Status

Current Status: ✅ All systems operational
- TypeScript: ✅ No errors
- ESLint: ✅ Passing
- Tests: ✅ 3/3 passing
- Build: ✅ Successful
- CI/CD: ✅ Configured

## 🔗 Links

- **Repository**: https://github.com/AronTech11/vitawave-samd-template
- **Branch**: main
- **Documentation**: See README.md and SETUP_SUMMARY.md
