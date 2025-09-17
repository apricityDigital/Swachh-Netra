#!/bin/bash

echo "🚀 Building Swachh-Netra APK..."

# Stop any running Expo processes
echo "📱 Stopping any running Expo processes..."
pkill -f "expo start" || true
pkill -f "Metro" || true

# Clean cache
echo "🧹 Cleaning cache..."
npx expo r -c

echo "📦 Creating production build..."

# Method 1: Try EAS Build (requires Expo account)
echo "🔧 Method 1: EAS Build (Cloud Build)"
echo "To use EAS Build:"
echo "1. Create an Expo account at https://expo.dev"
echo "2. Run: npx eas login"
echo "3. Run: npx eas build:configure"
echo "4. Run: npx eas build --platform android --profile preview"
echo ""

# Method 2: Local development build
echo "🔧 Method 2: Local Development Build"
echo "To create a local development build:"
echo "1. Install Android Studio and Android SDK"
echo "2. Run: npx expo run:android"
echo "3. This will create a development APK in android/app/build/outputs/apk/"
echo ""

# Method 3: Export for web (alternative)
echo "🔧 Method 3: Web Export (for testing)"
echo "Creating web export..."
npx expo export --platform web

echo ""
echo "✅ Build preparation completed!"
echo "📱 App name: Swachh-Netra"
echo "📦 Package: com.swachhnetra.app"
echo "🌐 Web build available in: dist/"
echo ""
echo "For APK generation, please use one of the methods above."
