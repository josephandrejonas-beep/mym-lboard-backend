# MYM LBOARD - Complete Getting Started & Deployment Guide

## 🚀 Quick Start (5 minutes)

### Backend
```bash
# Clone
git clone https://github.com/josephandrejonas-beep/mym-lboard-backend.git
cd mym-lboard-backend

# Install & Setup
npm install
cp .env.example .env
# Edit .env with your credentials

# Database
npm run migrate

# Run
npm run dev
# Server runs on http://localhost:3000
```

### Mobile App
```bash
# Clone
git clone https://github.com/josephandrejonas-beep/mym-lboard-mobile.git
cd mym-lboard-mobile

# Install
npm install
cd ios && pod install && cd ..

# Run
npm run ios      # iOS Simulator
npm run android  # Android Emulator
```

---

## 📋 Prerequisites & Setup

### System Requirements
- Node.js 16+ & npm 8+
- PostgreSQL 12+
- Git
- Xcode 14+ (for iOS)
- Android Studio (for Android)

### Third-Party Services

#### Twilio (SMS/OTP)
1. Create account at twilio.com
2. Get Account SID & Auth Token
3. Get Twilio phone number
4. Add to .env

#### Firebase (Push Notifications)
1. Create project at firebase.google.com
2. Enable Cloud Messaging
3. Download service account key
4. Add to .env

#### Google Maps API
1. Enable in Google Cloud Console
2. Create API key
3. Add to .env

#### PostgreSQL
```bash
brew install postgresql  # macOS
creatdb mym_lboard
```

---

## 📖 Full Documentation

See individual README files:
- `README.md` - API Overview
- `PROJECT_SETUP.md` - Project Structure
- `DEVELOPMENT_ROADMAP.md` - 27 GitHub Issues

---

**Status:** 🟢 Ready for Development
**Last Updated:** 2026-07-18
