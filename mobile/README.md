# Mobile App (React Native + Expo + TypeScript)

## Overview

This is the mobile application built with React Native, Expo, and TypeScript. It includes Bluetooth Low Energy (BLE) support for connecting to hardware devices.

## Tech Stack

- **React Native**: 0.76.5
- **Expo SDK**: 52
- **TypeScript**: 5.3.3
- **BLE**: react-native-ble-plx
- **Testing**: Jest + React Native Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac only) or Android Emulator

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

### Running on Simulators/Emulators

```bash
# iOS (requires Mac + Xcode)
npm run ios

# Android (requires Android Studio)
npm run android

# Web
npm run web
```

## Development Commands

```bash
# Start Expo dev server
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:ci

# Type checking
npm run type-check

# Linting
npm run lint
```

## Bluetooth Low Energy (BLE) Development

### Important: BLE Testing on Physical Devices

⚠️ **BLE functionality requires testing on physical devices** as it does not work in iOS Simulator or Android Emulator.

### Building for Physical Device Testing

You have two options for building development builds with BLE support:

#### Option 1: EAS Build (Recommended)

EAS Build provides a cloud-based build service that's easier to set up:

```bash
# Install EAS CLI globally (if not already installed)
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure EAS for your project (first time only)
eas build:configure

# Build development build for iOS
npm run build:ios
# or: eas build --profile development --platform ios

# Build development build for Android
npm run build:android
# or: eas build --profile development --platform android
```

**Benefits:**
- No need for local Xcode or Android Studio setup
- Builds in the cloud
- Easy sharing via QR code or download link
- Automatic provisioning for iOS

**Installation on Device:**
- iOS: Download from build link or scan QR code
- Android: Download APK and install

#### Option 2: Local Build with React Native CLI

For more control or when you need custom native modifications:

```bash
# iOS (requires Mac + Xcode)
npx expo run:ios --device

# Android (requires Android Studio + SDK)
npx expo run:android --device
```

**Requirements:**
- **iOS**: Mac with Xcode, Apple Developer account
- **Android**: Android Studio, Android SDK, USB debugging enabled

### BLE Permissions

The app requests the following BLE permissions:

**iOS:**
- `NSBluetoothAlwaysUsageDescription`
- `NSBluetoothPeripheralUsageDescription`

**Android:**
- `BLUETOOTH`
- `BLUETOOTH_ADMIN`
- `BLUETOOTH_CONNECT`
- `BLUETOOTH_SCAN`
- `ACCESS_FINE_LOCATION`

These are configured in `app.json`.

## BLE Service Usage

```typescript
import { bleService } from '@/services/BLEService';

// Request permissions (required on Android)
const hasPermissions = await bleService.requestPermissions();

// Check if Bluetooth is enabled
const state = await bleService.checkBluetoothState();

// Start scanning for devices
bleService.startScan(
  (device) => {
    console.log('Found device:', device.name, device.id);
  },
  (error) => {
    console.error('Scan error:', error);
  }
);

// Stop scanning
bleService.stopScan();

// Connect to a device
const device = await bleService.connectToDevice(deviceId);

// Disconnect from device
await bleService.disconnect();
```

## Project Structure

```
mobile/
├── src/
│   └── services/
│       ├── BLEService.ts           # BLE service implementation
│       └── __tests__/
│           └── BLEService.test.ts  # BLE tests
├── __tests__/
│   └── App.test.tsx                # App component tests
├── assets/                         # Images, fonts, etc.
├── App.tsx                         # Main app entry point
├── app.json                        # Expo configuration
├── eas.json                        # EAS Build configuration
├── babel.config.js                 # Babel configuration
├── package.json                    # Dependencies
└── tsconfig.json                   # TypeScript configuration
```

## Configuration Files

- **app.json**: Expo app configuration (bundle ID, permissions, splash screen, etc.)
- **eas.json**: EAS Build profiles (development, preview, production)
- **tsconfig.json**: TypeScript compiler options
- **babel.config.js**: Babel preset for Expo

## Testing

Tests are written using Jest and React Native Testing Library:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:ci
```

## Building for Production

### Using EAS Build

```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

### Using Local Build

```bash
# iOS
npx expo run:ios --configuration Release

# Android
npx expo run:android --variant release
```

## Troubleshooting

### Clear Cache

```bash
# Clear Expo cache
npx expo start -c

# Clear watchman (if installed)
watchman watch-del-all
```

### Reinstall Dependencies

```bash
rm -rf node_modules
npm install
```

### BLE Not Working

1. Ensure you're testing on a physical device (not simulator/emulator)
2. Check that Bluetooth is enabled on the device
3. Verify permissions are granted in device settings
4. For iOS, ensure you have a development build (not Expo Go)
5. For Android, ensure location services are enabled

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [react-native-ble-plx Documentation](https://github.com/dotintent/react-native-ble-plx)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

## License

MIT
