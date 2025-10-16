# VitaWave SAMD Template

A monorepo template for building mobile applications with BLE (Bluetooth Low Energy) support and backend services.

## 🏗️ Structure

```
vitawave-samd-template/
├── mobile/          # React Native/Expo mobile app with BLE
├── backend/         # Node.js/Express backend service
├── .devcontainer/   # DevContainer configuration for consistent development
└── ...config files
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (for mobile development)
- For DevContainer: Docker and VS Code Remote - Containers extension

### Installation

```bash
# Install all dependencies
npm install

# Run mobile app
npm run mobile

# Run backend service
npm run backend
```

## 📱 Mobile App

The mobile app is built with React Native and Expo, featuring:

- BLE (Bluetooth Low Energy) support
- TypeScript for type safety
- Expo for easier development and building

### Mobile Development

```bash
cd mobile
npm start
```

### Building for Device Testing

When BLE needs testing on a physical device:

#### Option 1: Expo Dev Build (Recommended)

```bash
cd mobile
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Configure the project
eas build:configure

# Create a development build
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

#### Option 2: React Native CLI

If you need more control or custom native modules:

```bash
cd mobile
# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

## 🔧 Backend

The backend service provides API endpoints and data management.

```bash
cd backend
npm run dev
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in CI mode
npm run test:ci
```

## 📝 Development Workflow

1. **Type checking**: `npm run type-check`
2. **Linting**: `npm run lint`
3. **Testing**: `npm test`
4. **Building**: `npm run build`

## 🐳 DevContainer / Codespaces

This project includes a DevContainer configuration for consistent development environments:

- Pre-configured with Node.js 18
- All necessary VS Code extensions
- GitHub CLI
- Automatic dependency installation

To use:
1. Open the project in VS Code
2. Click "Reopen in Container" when prompted
3. Or use Command Palette: "Remote-Containers: Reopen in Container"

## 🔄 CI/CD

CI pipeline runs on every push:
- Type checking
- Linting
- Unit tests
- Build verification

## 📄 License

MIT
