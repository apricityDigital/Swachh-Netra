<<<<<<< HEAD
# Swachh-Netra
=======
# SwatchSetu - Clean India Initiative

A comprehensive React Native application for managing waste collection operations with role-based authentication and Firebase integration.

## 🎯 Features

### **Role-Based Authentication System**
- **Vehicle Owner** (`vehicle@gmail.com`) → Fleet management and operations
- **Driver** (`driver@gmail.com`) → Route management and reporting
- **Swatch Admin** (`sadmin@gmail.com`) → Area oversight and compliance
- **All Admin** (`admin@gmail.com`) → System-wide administration

### **Key Capabilities**
- 🔥 **Firebase Authentication** - Secure user management with automatic account creation
- 📱 **Cross-Platform** - Works on Android, iOS, and Web
- 🎨 **Professional UI** - Clean, modern design with role-specific themes
- 🔒 **Secure Navigation** - Protected routes based on user roles
- 📊 **Dashboard Analytics** - Role-specific metrics and insights
- 🚀 **Production Ready** - Built with TypeScript and best practices

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- Firebase project (see Firebase Setup below)

### Installation

1. **Clone and Install**
   ```bash
   cd swatchsetu
   npm install
   ```

2. **Configure Firebase**
   - Update `src/config/firebase.ts` with your Firebase credentials
   - See [Firebase Setup Guide](#firebase-setup) below

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Test on Device**
   - Install Expo Go app on your mobile device
   - Scan the QR code displayed in terminal
   - Or press `w` to test in web browser

## 🔐 User Credentials

All users use the password: **`qwerty`**

| Email | Role | Dashboard Color | Description |
|-------|------|----------------|-------------|
| `vehicle@gmail.com` | Vehicle Owner | Green | Fleet management and operations |
| `driver@gmail.com` | Driver | Blue | Route management and reporting |
| `sadmin@gmail.com` | Swatch Admin | Orange | Area oversight and compliance |
| `admin@gmail.com` | All Admin | Purple | System-wide administration |

## 🏗️ Project Structure

```
swatchsetu/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── DashboardCard.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── LoadingSpinner.tsx
│   ├── config/
│   │   └── firebase.ts      # Firebase configuration
│   ├── context/
│   │   └── AuthContext.tsx  # Authentication state management
│   ├── navigation/
│   │   └── AppNavigator.tsx # Navigation setup
│   ├── screens/             # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── VehicleOwnerDashboard.tsx
│   │   ├── DriverDashboard.tsx
│   │   ├── SwatchAdminDashboard.tsx
│   │   └── AllAdminDashboard.tsx
│   ├── types/
│   │   └── auth.ts          # TypeScript type definitions
│   └── utils/
│       └── colors.ts        # Design system and colors
├── App.tsx                  # Main app component
├── package.json
└── README.md
```

## 🔥 Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project named "SwatchSetu"
3. Enable Google Analytics (optional)

### 2. Enable Authentication
1. Navigate to Authentication → Sign-in method
2. Enable "Email/Password" provider
3. Save changes

### 3. Get Configuration
1. Go to Project Settings → General
2. Add a Web app
3. Copy the Firebase configuration object

### 4. Update App Configuration
Replace the configuration in `src/config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 5. Enable Firestore (Optional)
1. Navigate to Firestore Database
2. Create database in test mode
3. Choose a location

## 📱 Building for Production

### Android APK
```bash
npm run build:android
```

### iOS App
```bash
npm run build:ios
```

### Web Build
```bash
npm run web
```

## 🎨 Design System

The app uses a comprehensive design system with:
- **Role-specific color schemes** for visual hierarchy
- **Consistent spacing and typography** for professional appearance
- **Responsive design** optimized for mobile devices
- **Accessibility features** for inclusive user experience

## 🔧 Development

### Available Scripts
- `npm start` - Start Expo development server
- `npm run android` - Open Android app
- `npm run ios` - Open iOS app
- `npm run web` - Open web version

### Code Quality
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting
- **Path aliases** for clean imports

## 🚀 Deployment

### Expo Application Services (EAS)
1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Configure: `eas build:configure`
4. Build: `eas build --platform all`

### Environment Variables
Update `eas.json` with your Firebase credentials for production builds.

## 📞 Support

For technical support or feature requests:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 📄 License

This project is part of the Clean India Initiative and is intended for governmental and educational use.

---

**Built with ❤️ for Clean India Initiative**
>>>>>>> master
