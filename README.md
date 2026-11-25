# Samundar Ke Sath

**Samundar Ke Sath** is a full-stack, AI-powered coastal and group travel management application built with **React Native (Expo SDK 58)** and a **Node.js + Express + MongoDB** REST API powered by **Google Gemini AI**.

---

## Features

- **Authentication & Profile Management**
  - Email/password registration and login with JWT (`bcryptjs` + `jsonwebtoken`) and Google OAuth ID-token verification.
  - Persistent encrypted session storage via `expo-secure-store` (with `localStorage` fallback on web).
  - Profile editing with custom profile photo selection/capture (`expo-image-picker` + `expo-image-manipulator`), compression, and MongoDB persistence.
- **Trip Planning & Collaboration**
  - Create, edit, and manage trips with role-based access control (`owner`, `admin`, `editor`, `viewer`).
  - Invite members, accept/decline invitations, update roles, and manage trip crew.
  - Day-by-day itineraries, daily activity scheduling, and collaborative trip packing lists.
- **Expense Splitting & Budget Tracking**
  - Log trip expenses across categories (`transport`, `accommodation`, `food`, `activities`, `shopping`, `fuel`, `tickets`, `miscellaneous`).
  - Real-time budget health tracking, category/payer analytics, and multi-party settlement calculations.
- **AI Travel Copilot (Google Gemini)**
  - Server-side Gemini integration for full trip planning, day-wise itinerary generation, destination recommendations, budget tier suggestions, itinerary optimization, and interactive travel chat.
  - Protected by JWT authentication, per-user AI rate limiting, and prompt-injection guards.
- **Coastal Destination Discovery & Notifications**
  - Browse and search curated coastal destinations and receive trip/expense notifications.

---

## Tech Stack

### Frontend (`Frontend/`)
- **Framework:** React Native `0.88.1` + Expo SDK `58` + Expo Router (`~58.0.32`)
- **Styling:** NativeWind `^4.2.7` + Tailwind CSS `^3.4.17`
- **State Management:** Zustand `^5.0.3`
- **Media & Storage:** `expo-image-picker`, `expo-image-manipulator`, `expo-secure-store`, `expo-constants`
- **Networking:** Native `fetch` API client with `AbortController` timeouts and automatic LAN/emulator/web API URL resolution

### Backend (`Backend/`)
- **Runtime & Framework:** Node.js (`>= 18.0.0`, ES Modules) + Express `^4.21.2`
- **Database:** MongoDB / MongoDB Atlas via Mongoose `^8.9.5`
- **AI SDK:** `@google/genai` (`^3.5.0`)
- **Auth & Security:** `jsonwebtoken`, `bcryptjs`, `google-auth-library`, `cors`, auth & AI rate limiters
- **Deployment Ready:** `server.js` for standard Node hosting + `api/index.js` & `vercel.json` for Vercel serverless

---

## Repository Structure

```text
React-native-Diwali-Assignment/
├── Backend/
│   ├── api/
│   │   └── index.js                 # Vercel serverless entry point
│   ├── postman/                     # Postman API collections
│   ├── src/
│   │   ├── config/db.js             # Cached MongoDB connection helper
│   │   ├── controllers/             # Route handlers (auth, trip, expense, ai, destination, packingList, notification, health)
│   │   ├── middleware/              # JWT auth, trip RBAC, rate limiters, error & 404 handlers
│   │   ├── models/                  # Mongoose schemas (User, Trip, TripMember, Itinerary, Expense, PackingList, Destination, Notification)
│   │   ├── routes/                  # Express routers mounted under /api
│   │   ├── services/                # Business logic & Gemini AI service
│   │   ├── utils/                   # ApiError, ApiResponse, asyncHandler, seed data, query helpers
│   │   ├── validators/              # Request validation & prompt-injection checks
│   │   └── app.js                   # Express app configuration & middleware pipeline
│   ├── tests/                       # Integration & AI verification scripts
│   ├── .env.example                 # Backend environment variable template
│   ├── package.json
│   ├── server.js                    # Local HTTP server (0.0.0.0:5000)
│   └── vercel.json
│
├── Frontend/
│   ├── app/
│   │   ├── (auth)/                  # Welcome, login, register, forgot-password screens
│   │   ├── (tabs)/                  # Home dashboard, Trips, AI Copilot, Expenses, Profile tabs
│   │   ├── ai/                      # AI chat, itinerary, budget suggestions, recommendations, preferences
│   │   ├── destinations/            # Destination catalog & detail views
│   │   ├── expenses/                # Create, edit, detail, history, budget, analytics, settlements
│   │   ├── profile/                 # Edit profile (with photo upload) & app settings
│   │   ├── trips/                   # Create trip, trip details, edit, itinerary, activities, members, expenses, packing list
│   │   ├── _layout.jsx              # Root layout & auth redirect guard
│   │   ├── index.jsx                # Splash & session hydration screen
│   │   └── notifications.jsx        # Notification inbox
│   ├── components/                  # Reusable UI, form, card, dashboard, AI, and navigation components
│   ├── constants/                   # API base URL resolver & ocean theme tokens
│   ├── hooks/                       # API request & responsive layout hooks
│   ├── services/                    # Modular fetch-based API clients
│   ├── store/                       # Zustand stores (auth, trip, dashboard, AI, UI)
│   ├── utils/                       # Currency/date formatters, validators, secure storage wrapper
│   ├── .env.example                 # Frontend environment variable template
│   ├── app.json
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js** `>= 18.0.0` and **npm**
- **MongoDB** (local instance or MongoDB Atlas cluster)
- **Expo Go** app (SDK 58) for physical device testing, or Android Emulator / iOS Simulator / Web browser

---

### 1. Backend Setup

```bash
cd Backend
npm install
```

Create `Backend/.env` from the template:
```bash
cp .env.example .env
```

Update `Backend/.env` with your values:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/samundar_ke_sath
CLIENT_URL=http://localhost:3000,http://localhost:8081
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
AI_RATE_LIMIT_WINDOW_MS=900000
AI_RATE_LIMIT_MAX=20
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=60
```

Start the backend server:
```bash
npm start
# or for hot-reload development:
npm run dev
```

The API listens on `http://0.0.0.0:5000/api` (health check at `GET /api/health`).

---

### 2. Frontend Setup

```bash
cd Frontend
npm install
```

Create `Frontend/.env` from the template:
```bash
cp .env.example .env
```

Configure `Frontend/.env`:
```env
# Web / iOS Simulator: http://localhost:5000/api
# Android Emulator:    http://10.0.2.2:5000/api
# Physical Device:     http://<YOUR_LAN_IP>:5000/api
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_APP_NAME=Samundar Ke Sath
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
```

> **Note:** In development, `Frontend/constants/config.js` automatically detects your Metro host LAN IP via `expo-constants` when running in Expo Go, uses `10.0.2.2` on Android Emulator, and matches `window.location.hostname` on Web.

Start Expo with a clean cache:
```bash
npm run start:clear
```

- Press **`w`** to open on Web
- Press **`a`** to open on Android Emulator
- Press **`i`** to open on iOS Simulator
- Scan the QR code with **Expo Go** on a physical device connected to the same Wi-Fi network

---

## API Routes Overview

All routes are mounted under `/api`:

| Prefix | Description |
| --- | --- |
| `/api/health` | Service and database health check |
| `/api/auth` | Register, login, Google OAuth, current user, profile update, password change, logout |
| `/api/trips` | Trip CRUD, invitations, members & roles, daily itineraries, budget, expenses, packing lists |
| `/api/destinations` | Destination listing, search, and destination details |
| `/api/notifications` | User notification inbox and read-status updates |
| `/api/ai` | Gemini AI trip planner, itinerary generator, destination recommender, budget suggestions, chat, optimizer |

---

## Security Notes

- Never commit `.env` files (`Backend/.env` and `Frontend/.env` are excluded via `.gitignore`).
- `GEMINI_API_KEY` and `JWT_SECRET` live strictly on the backend and are never exposed to the mobile client.
