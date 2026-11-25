# Samundar Ke Sath — Backend Setup & Deployment Guide

Complete guide for running, configuring, testing, and deploying the **Samundar Ke Sath** Node.js backend locally or on Vercel, and connecting the React Native / Expo frontend.

---

## 1. Prerequisites

- **Node.js:** v18.0.0 or higher (tested on Node v22.20.0)
- **npm:** v9+
- **MongoDB:** MongoDB Atlas cluster (recommended for staging/prod) or local MongoDB (`mongodb://localhost:27017`)
- **Google Gemini API Key:** Obtained from [Google AI Studio](https://aistudio.google.com/apikey)
- **Google OAuth Client ID (optional until Google Sign-In is tested):** Obtained from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

---

## 2. Local Installation

```bash
cd React-native-Diwali-Assignment/Backend
npm install
```

---

## 3. Environment Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure the variables in `Backend/.env` (**never commit `.env` to Git**):

| Variable | Required | Example / Default | Purpose |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `5000` | Local HTTP listener port |
| `NODE_ENV` | No | `development` | `development` (includes error stacks) or `production` (hides internal 500 details) |
| `MONGODB_URI` | **Yes** | `mongodb+srv://<user>:<pass>@cluster0.mongodb.net/samundar_ke_sath?retryWrites=true&w=majority` | MongoDB Atlas or local connection string |
| `CLIENT_URL` | No | `http://localhost:3000,http://localhost:8081` | Comma-separated allowed CORS origins |
| `JWT_SECRET` | **Yes** | `<strong-random-64-char-secret>` | Secret key for signing/verifying JWT tokens |
| `JWT_EXPIRES_IN` | No | `7d` | JWT lifetime |
| `GOOGLE_CLIENT_ID` | For Google Auth | `<web-id>,<android-id>,<ios-id>` | Comma-separated Google OAuth Client ID(s) for strict audience verification |
| `GEMINI_API_KEY` | For AI Copilot | `<your-gemini-api-key>` | Server-side Google Gemini API key (never expose to frontend) |
| `GEMINI_MODEL` | No | `gemini-3.8-flash` | Gemini model ID used by `@google/genai` |
| `AI_RATE_LIMIT_WINDOW_MS` | No | `900000` | Sliding window for AI rate limiter (default 15 minutes) |
| `AI_RATE_LIMIT_MAX` | No | `20` | Max AI requests per user per window |

---

## 4. Running the Server

### Development Mode (Nodemon auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Verify health:
```bash
curl http://localhost:5000/api/health
```
Expected `database.status`: `"connected"` (`readyState: 1`).

---

## 5. Testing with Postman

1. Open Postman → click **Import** → select `Backend/POSTMAN_COLLECTION.json` (9 folders, 48 requests).
2. Confirm collection variable `baseUrl` is `http://localhost:5000`.
3. Recommended verification sequence:
   - `1. Authentication` → `Health Check`, `Register User` (auto-saves `{{authToken}}`), `Get Current User (/me)`.
   - `2. Trip Management` → `Create Trip` (auto-saves `{{tripId}}`), `Get All User Trips`, `Get Trip Details by ID`.
   - `3. Trip Members` & `9. Notifications & Collaboration` → Invite member → Accept invitation → Update role.
   - `4. Trip Itinerary & Activities` → Create/Get/Update Day 1.
   - `5. Expense Management & Budget Tracking` → Create expenses → Check `Budget`, `Analytics`, `Settlements`.
   - `6. AI Travel Copilot (Google Gemini)` → Test all 6 AI endpoints.
   - `7. Packing List Management` → Add items → Mark packed → Check progress %.
   - `8. Destination Discovery` → List, filter, search, get details by ID/slug.
   - `9. Notifications` → Get inbox → Mark read → Mark all read.

---

## 6. Connecting the React Native / Expo Frontend

1. **Base URL on Mobile Devices:**
   - Android Emulator: `http://10.0.2.2:5000/api`
   - iOS Simulator: `http://localhost:5000/api`
   - Physical Device (Expo Go): `http://<YOUR_LAN_IP>:5000/api` (ensure Windows Firewall allows TCP port `5000`) or deploy to Vercel and use the HTTPS URL.
2. **Auth Header:** Store the returned JWT securely (`expo-secure-store`) and send `Authorization: Bearer <token>` on all protected endpoints.
3. **Never Bundle Secrets:** Keep `GEMINI_API_KEY` and `JWT_SECRET` strictly on the backend — the mobile app only calls `/api/ai/*` through your Express server.
4. **AI Confirmation Flow:** AI responses always return `metadata.savedToDatabase: false`. Present generated plans to the user for review, then call `POST /api/trips` and `POST /api/trips/:tripId/itinerary` only after the user taps **Save**.

---

## 7. Deploying to Vercel

This backend includes `vercel.json` and `api/index.js` pre-wired to `src/app.js` with serverless MongoDB connection caching:

1. Push the repository to GitHub.
2. Create a new project in Vercel and set **Root Directory** to `Backend`.
3. Add all required environment variables (`MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `GOOGLE_CLIENT_ID`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `NODE_ENV=production`) in Vercel Project Settings.
4. Deploy — Vercel rewrites all routes to `/api/index.js` and invokes the Express app directly.
5. Verify `https://<your-project>.vercel.app/api/health`.

