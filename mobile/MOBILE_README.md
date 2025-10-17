# VitaWave SAMD Mobile App

Complete React Native + Expo TypeScript mobile application with navigation, Redux state management, and BLE support.

## 🏗️ Architecture

### Navigation Structure
- **RootNavigator**: Main navigation container that routes based on authentication state
  - **AuthStack**: Login and registration screens (unauthenticated users)
  - **PatientStack**: Patient dashboard with bottom tabs (authenticated patients)
  - **AdminStack**: Admin dashboard with bottom tabs (authenticated admins)

### Redux Store
The app uses Redux Toolkit for state management with three slices:

1. **authSlice**: User authentication, tokens, login/logout state
2. **readingsSlice**: Blood pressure readings data
3. **deviceSlice**: BLE device connection state and discovered devices

### Screens

#### Auth Screens
- `LoginScreen`: User login with email/password
- `RegisterScreen`: New user registration

#### Patient Screens
- `HomeScreen`: Patient dashboard with latest reading and quick actions
- `HistoryScreen`: List of all blood pressure readings
- `DetailsScreen`: Detailed view of a single reading

#### Admin Screens
- `Dashboard`: Admin dashboard with system statistics
- `PatientView`: List and manage all patients

#### Device Screens
- `BLEPairingScreen`: Scan and connect to BLE blood pressure devices

### Components
- `Button`: Reusable button component with variants (primary, secondary, danger)
- `Input`: Styled text input component
- `Card`: Card container with shadow and rounded corners
- `Spinner`: Loading spinner component
- `ModalConfirm`: Confirmation modal dialog

## 🔌 BLE Integration

The app supports two BLE modes:

### Simulation Mode (Default)
- Runs in development without real BLE hardware
- Set by `__DEV_SIMULATE_BLE__` environment variable or `__DEV__` flag
- Allows testing the UI without physical devices

### Production Mode (Real BLE)
- Uses `react-native-ble-plx` for actual BLE communication
- **Requires Expo Development Build** (native module)

#### Creating an Expo Dev Build with BLE:

```bash
# 1. Install EAS CLI globally
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Configure EAS Build
eas build:configure

# 4. Build development client for iOS
eas build --profile development --platform ios

# 5. Build development client for Android
eas build --profile development --platform android

# 6. Install the built app on your device, then run:
npx expo start --dev-client
```

**Note**: Expo Go does NOT support native BLE modules. You must use a custom development build.

## 🚀 Running the App

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm start
```

### Run on iOS Simulator
```bash
npm run ios
```

### Run on Android Emulator
```bash
npm run android
```

### Run on Physical Device
1. Install Expo Go (for non-BLE testing)
2. Scan QR code from terminal
3. For BLE testing, use custom development build (see above)

## 🔐 Authentication

The app connects to the backend API for authentication:

### Default Credentials
- **Admin**: `admin@example.com` / `AdminPass123!`

### API Configuration
Update the API base URL in screen files:
```typescript
const API_BASE_URL = 'http://localhost:3000'; // Change for production
```

For physical devices, use your computer's local IP:
```typescript
const API_BASE_URL = 'http://192.168.1.X:3000'; // Replace with your IP
```

## 📱 Features

### Patient Features
- ✅ Login/logout
- ✅ View latest blood pressure reading
- ✅ Browse reading history
- ✅ View detailed reading analysis
- ✅ Scan and connect BLE devices
- ✅ Device connection status

### Admin Features
- ✅ System statistics dashboard
- ✅ View all patients
- ✅ User management
- ✅ Reading analytics

### BLE Features
- ✅ Scan for BLE devices
- ✅ Connect to blood pressure monitors
- ✅ Device connection management
- ✅ Simulation mode for testing
- ✅ Real BLE support via development build

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint

# Type checking
npm run type-check
```

## 📦 Key Dependencies

- **@react-navigation/native**: Navigation framework
- **@react-navigation/native-stack**: Stack navigator
- **@react-navigation/bottom-tabs**: Tab navigator
- **@reduxjs/toolkit**: Redux state management
- **react-redux**: React bindings for Redux
- **react-native-ble-plx**: BLE communication (requires dev build)
- **expo**: Expo SDK and tooling
- **react-native**: React Native framework
- **typescript**: Type safety

## 📂 Project Structure

```
mobile/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Spinner.tsx
│   │   └── ModalConfirm.tsx
│   ├── navigation/         # Navigation configuration
│   │   ├── RootNavigator.tsx
│   │   ├── AuthStack.tsx
│   │   ├── PatientStack.tsx
│   │   └── AdminStack.tsx
│   ├── screens/            # Screen components
│   │   ├── Auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── Patient/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── HistoryScreen.tsx
│   │   │   └── DetailsScreen.tsx
│   │   ├── Admin/
│   │   │   ├── Dashboard.tsx
│   │   │   └── PatientView.tsx
│   │   └── Device/
│   │       └── BLEPairingScreen.tsx
│   ├── services/           # Business logic services
│   │   └── BLEService.ts
│   └── store/              # Redux store
│       ├── index.ts
│       ├── authSlice.ts
│       ├── readingsSlice.ts
│       └── deviceSlice.ts
├── App.tsx                 # App entry point
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

## 🔧 Environment Variables

Create a `.env` file for configuration:

```env
API_BASE_URL=http://localhost:3000
__DEV_SIMULATE_BLE__=true
```

## 📝 Next Steps

1. **Connect to Backend**: Update API URLs to point to your backend server
2. **Add BLE Services**: Implement specific BLE service UUIDs for your blood pressure device
3. **Add Offline Support**: Implement local storage with AsyncStorage
4. **Add Push Notifications**: Set up Expo notifications
5. **Build Production App**: Create production builds with EAS Build
6. **Deploy**: Submit to App Store and Google Play

## 🤝 Contributing

See the main project README for contribution guidelines.

## 📄 License

See LICENSE file in project root.
