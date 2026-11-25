# Samundar Ke Sath — Mobile App Frontend

AI-powered coastal & travel management application built with **React Native 0.86**, **Expo SDK 57**, **JavaScript JSX**, **Expo Router**, **NativeWind**, **Zustand**, and React Native's built-in `fetch` API.

---

## 🛠 Tech Stack

- **Framework:** React Native `0.86.x` + Expo SDK `57`
- **Language:** JavaScript (JSX)
- **Navigation:** Expo Router (file-based routing)
- **Styling:** NativeWind v4 + Tailwind CSS v3 (ocean-inspired design tokens)
- **State Management:** Zustand v5 + `expo-secure-store` (with web fallback)
- **Networking:** Built-in `fetch` with `AbortController` timeouts (zero Axios)
- **Backend:** Samundar Ke Sath Node.js + Express + MongoDB + Google Gemini API

---

## 📁 Folder Structure

```
Frontend/
├── app/
│   ├── _layout.jsx             # Root SafeAreaProvider, NativeWind CSS, Auth hydration & Stack
│   ├── index.jsx               # Ocean-themed foundation showcase & backend health verifier
│   ├── (auth)/                 # Authentication route group (upcoming)
│   ├── (tabs)/                 # Bottom tab navigation group (upcoming)
│   ├── trips/                  # Trip CRUD, collaboration, itinerary & packing list screens
│   ├── expenses/               # Expense tracking, budget & settlements screens
│   ├── ai/                     # Google Gemini AI Travel Copilot screens
│   └── profile/                # Profile, preferences & notifications screens
├── components/
│   ├── ui/                     # Typography, Button, Badge, Divider, ScreenContainer, LoadingState, ErrorState, EmptyState
│   ├── cards/                  # Card, DestinationCard
│   ├── forms/                  # FormInput, FormSelect, FormSection
│   └── navigation/             # ScreenHeader
├── services/
│   ├── api.js                  # Fetch client (Bearer JWT, timeouts, 401 handler, envelope parsing)
│   ├── authService.js          # /api/auth/*
│   ├── tripService.js          # /api/trips/* (CRUD, members, invitations, itinerary, packing list)
│   ├── expenseService.js       # /api/trips/:tripId/expenses/* & /budget
│   ├── aiService.js            # /api/ai/* (50s timeout)
│   └── discoveryService.js     # /api/destinations/* & /api/notifications/*
├── store/
│   ├── useAuthStore.js         # Session persistence, hydrate, login, register, logout
│   ├── useTripStore.js         # Shared trip list, pagination & active trip state
│   └── useUiStore.js           # Global toast/notification banner state
├── hooks/
│   ├── useApiRequest.js        # Unified loading/error/data async hook
│   └── useResponsive.js        # Compact/phone/tablet responsive layout breakpoints
├── utils/
│   ├── storage.js              # Platform-safe SecureStore / localStorage wrapper
│   ├── formatters.js           # Currency, date range & title-case formatters
│   └── validators.js           # Email, password, date-range & positive-amount validators
├── constants/
│   ├── theme.js                # Ocean color palette, typography scale, spacing, shadows
│   └── config.js               # Platform-aware API URL & domain enums
├── assets/                     # Static app icons & splash imagery
├── app.json                    # Expo SDK 57 configuration
├── babel.config.js             # NativeWind v4 Babel preset
├── metro.config.js             # NativeWind Metro wrapper
├── tailwind.config.js          # Custom ocean, seafoam, sand, coral & ink theme tokens
├── global.css                  # Tailwind directives
└── .env.example                # Environment variable template
```

---

## 🚀 Setup & Running Locally

### 1. Install Dependencies
```bash
cd React-native-Diwali-Assignment/Frontend
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Web / iOS Simulator: http://localhost:5000/api
# Android Emulator:    http://10.0.2.2:5000/api
# Physical Device:     http://<YOUR_LAN_IP>:5000/api
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_APP_NAME=Samundar Ke Sath
```
> **Security Note:** Never place `GEMINI_API_KEY` or `JWT_SECRET` in frontend `.env` files. All AI requests flow securely through the Node.js backend.

### 3. Start the Backend API
In a separate terminal:
```bash
cd React-native-Diwali-Assignment/Backend
npm run dev
```

### 4. Launch Expo Dev Server
```bash
cd React-native-Diwali-Assignment/Frontend
npm run start:clear
```

- Press **`a`** for Android Emulator
- Press **`i`** for iOS Simulator
- Press **`w`** for Web preview
- Scan the QR code with **Expo Go** on a physical device

