# Samundar Ke Sath - Backend API

Production-ready, modular REST API foundation for **Samundar Ke Sath**, a full-stack coastal and sea travel application. Built with Node.js, Express.js, MongoDB Atlas (Mongoose ODM), and designed with a Vercel-compatible serverless architecture.

---

## 🛠 Tech Stack

- **Runtime:** Node.js (>= 18.0.0, ES Modules)
- **Framework:** Express.js 4.x
- **Database:** MongoDB Atlas via Mongoose 8.x
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs
- **Environment Management:** dotenv
- **CORS Support:** cors (configured for React Native, Expo, and Web)
- **Development Tooling:** Nodemon
- **AI Integration (Roadmap):** Google Gemini API
- **Deployment Target:** Vercel / Cloud Container-compatible

---

## 📁 Project Architecture & Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection with connection pooling & serverless caching
│   ├── controllers/
│   │   └── health.controller.js  # System health check handler
│   ├── middleware/
│   │   ├── errorHandler.js       # Centralized error handling & status code mapping
│   │   └── notFound.js           # 404 Route Not Found middleware
│   ├── models/                   # Mongoose data models (User, Trip, Booking, etc.)
│   ├── routes/
│   │   ├── health.routes.js      # Health check router (/api/health)
│   │   └── index.js              # Central API route index
│   ├── services/                 # Business logic and external service integrations (Gemini AI, etc.)
│   ├── utils/
│   │   ├── ApiError.js           # Custom operational error class
│   │   ├── ApiResponse.js        # Standardized API response formatter
│   │   └── asyncHandler.js       # Higher-order async route wrapper
│   ├── validators/               # Request validation schemas and middleware
│   └── app.js                    # Express application setup and middleware pipeline
├── server.js                     # HTTP server entry point & graceful shutdown handling
├── .env                          # Local environment variables (git-ignored)
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git ignore file
├── package.json                  # Project manifest and scripts
└── README.md                     # Documentation and setup guide
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)
- **MongoDB Atlas** account or local MongoDB instance

### 2. Installation
Navigate to the backend directory and install dependencies:
```bash
cd React-native-Diwali-Assignment/Backend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root of the backend folder:
```bash
cp .env.example .env
```

Open `.env` and fill in your credentials:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Atlas URI
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/samundar_ke_sath?retryWrites=true&w=majority

# CORS Configuration (comma-separated allowed origins)
CLIENT_URL=http://localhost:3000,http://localhost:8081

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Running the Server

#### Development Mode (with hot-reload via Nodemon):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

---

## 🩺 Health Check Endpoint

Use this endpoint to verify that the API server is active and check the MongoDB connection status.

- **URL:** `/api/health`
- **Method:** `GET`
- **Access:** Public

### Example Request (cURL)
```bash
curl -X GET http://localhost:5000/api/health
```

### Example Successful Response (`200 OK`)
```json
{
  "statusCode": 200,
  "data": {
    "service": "Samundar Ke Sath API",
    "status": "healthy",
    "timestamp": "2026-11-13T08:30:00.000Z",
    "uptime": "42s",
    "environment": "development",
    "database": {
      "status": "connected",
      "readyState": 1
    }
  },
  "message": "System is healthy and operational",
  "success": true
}
```

---

## 🛡 Centralized Error Handling

All errors thrown in controllers or services are normalized by `src/middleware/errorHandler.js` into a predictable JSON structure:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Route not found: GET /api/unknown-endpoint"
}
```

- **Mongoose Validation Errors:** Automatically mapped to `400 Bad Request` with field details.
- **Invalid ObjectIds:** Mapped to `400 Bad Request`.
- **Duplicate Keys (`11000`):** Mapped to `409 Conflict`.
- **JWT Errors:** Mapped to `401 Unauthorized`.
- **Stack Traces:** Included only when `NODE_ENV === 'development'`.

---

## 🔐 Authentication Endpoints

Base URL: `/api/auth`

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user with email, name & password |
| `POST` | `/api/auth/login` | Public | Login with email & password, returns JWT token |
| `POST` | `/api/auth/google` | Public | Exchange verified Google OAuth ID Token for JWT |
| `GET` | `/api/auth/me` | Protected | Fetch authenticated user's profile |
| `PATCH` | `/api/auth/profile` | Protected | Update user name, avatar, and preferences |
| `PATCH` | `/api/auth/change-password` | Protected | Change password with current password verification |
| `POST` | `/api/auth/logout` | Protected | Stateless logout acknowledgment |

Protected endpoints require the HTTP header:
```http
Authorization: Bearer <your_jwt_token>
```

---

## 🏖️ Trip Management Endpoints

Base URL: `/api/trips` (All endpoints require `Authorization: Bearer <token>`)

### Core Trip CRUD
| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/trips` | Authenticated | Create a new trip (creator assigned as `owner`) |
| `GET` | `/api/trips` | Authenticated | List user trips with pagination, status filter & departure sorting |
| `GET` | `/api/trips/:tripId` | Viewer / Editor / Admin / Owner | Get trip details by ID with populated owner and members |
| `PATCH` | `/api/trips/:tripId` | Admin / Owner | Update trip details, dates, budget, or status |
| `DELETE` | `/api/trips/:tripId` | Owner only | Delete trip with cascading cleanup of members, packing list, itineraries |

#### Query Parameters for `GET /api/trips`:
- `page`: Page number (default: `1`)
- `limit`: Items per page (default: `10`, max: `100`)
- `status`: Filter by status (`planning`, `active`, `completed`, `cancelled`)
- `search`: Search query matching `title`, `destination`, or `origin`
- `sort`: Sort by departure `startDate` (`asc` or `desc`, default: `asc`)

### Trip Members
| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/trips/:tripId/members` | Admin / Owner | Add a member by `email` or `userId` (role: `admin`, `editor`, `viewer`) |
| `GET` | `/api/trips/:tripId/members` | Viewer / Editor / Admin / Owner | List all members of a trip |
| `DELETE` | `/api/trips/:tripId/members/:memberId` | Admin / Owner / Self | Remove a member from the trip (or leave trip) |

### Trip Itinerary & Daily Activities
| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/trips/:tripId/itinerary` | Editor / Admin / Owner | Create daily itinerary with activities array |
| `GET` | `/api/trips/:tripId/itinerary` | Viewer / Editor / Admin / Owner | Get all itineraries for a trip sorted by day number |
| `PATCH` | `/api/trips/:tripId/itinerary/:itineraryId` | Editor / Admin / Owner | Update itinerary notes, date, or activities |
| `DELETE` | `/api/trips/:tripId/itinerary/:itineraryId` | Editor / Admin / Owner | Delete a daily itinerary day |

---

## 💰 Expense Management & Budget Tracking

Base URL: `/api/trips/:tripId` (Requires `Authorization: Bearer <token>`)

### Supported Categories:
`transport`, `accommodation` (or `stay`), `food`, `activities`, `shopping`, `fuel`, `tickets`, `miscellaneous`.

### Expense Endpoints:
| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/trips/:tripId/expenses` | Trip Member / Owner | Create expense with equal, exact, or percentage split |
| `GET` | `/api/trips/:tripId/expenses` | Trip Member / Owner | List expenses with category, payer, date range filters & pagination |
| `GET` | `/api/trips/:tripId/expenses/:expenseId` | Trip Member / Owner | Retrieve detailed expense record by ID |
| `PATCH` | `/api/trips/:tripId/expenses/:expenseId` | Payer / Admin / Owner | Update expense amount, title, split, or notes |
| `DELETE` | `/api/trips/:tripId/expenses/:expenseId` | Payer / Admin / Owner | Delete an expense record |
| `GET` | `/api/trips/:tripId/budget` | Trip Member / Owner | Real-time budget tracking (total spent, remaining, % used, over-budget flag) |
| `GET` | `/api/trips/:tripId/expenses/analytics` | Trip Member / Owner | Aggregated category breakdown & per-person contribution statistics |
| `GET` | `/api/trips/:tripId/expenses/settlements` | Trip Member / Owner | Multi-party debt simplification & minimal settlement transfer calculations |

### Multi-Party Settlement Logic:
The settlement calculation evaluates actual contributions (`totalPaid`) against actual consumption (`totalOwed`):
$$\text{netBalance}_i = \text{totalPaid}_i - \text{totalOwed}_i$$
- Creditors ($\text{netBalance} > 0$) paid more than their share and are owed money.
- Debtors ($\text{netBalance} < 0$) consumed more than they paid and owe money.
- A two-pointer debt minimization algorithm pairs the largest debtor with the largest creditor to resolve all debts in the minimal number of direct peer-to-peer transfers, **without assuming anyone owes the trip owner**.

---

## 🤖 AI Travel Copilot (Google Gemini API)

Powered by the official `@google/genai` SDK (`gemini-3.8-flash` by default). All AI routes require JWT authentication (`Authorization: Bearer <token>`), pass through per-user rate limiting, enforce prompt-injection screening, and return structured JSON draft responses that are **never auto-saved without user confirmation**.

### AI Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ai/plan-trip` | Full AI trip plan: title, summary, itinerary, food, tips, budget breakdown & alternatives |
| `POST` | `/api/ai/generate-itinerary` | Day-wise timed itinerary tailored to pace, budget & interests |
| `POST` | `/api/ai/recommend-destinations` | Personalized destination recommendations with estimated budget ranges |
| `POST` | `/api/ai/budget-suggestions` | Category-wise budget allocations aligned with the 8 Expense categories |
| `POST` | `/api/ai/chat` | Interactive AI Travel Copilot chat with optional conversation history & trip context |
| `POST` | `/api/ai/optimize-itinerary` | Reorders & refines an existing itinerary for better pacing, routing, or lower cost |

### Configuring `GEMINI_API_KEY`
1. Create an API key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Add it to `Backend/.env` (never commit `.env` or expose the key to the frontend):
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   GEMINI_MODEL=gemini-3.8-flash
   AI_RATE_LIMIT_WINDOW_MS=900000
   AI_RATE_LIMIT_MAX=20
   ```
3. Restart the backend (`npm run dev`).

---

## 🎒 Packing List Management

Base URL: `/api/trips/:tripId/packing-list` (Requires JWT + Trip Access)

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/trips/:tripId/packing-list` | Editor / Admin / Owner | Create packing list or add single/batch items |
| `GET` | `/api/trips/:tripId/packing-list` | Trip Member / Owner | Get packing list with filters (`category`, `isPacked`, `assignedTo`, `search`) & real-time packing progress |
| `PATCH` | `/api/trips/:tripId/packing-list/:itemId` | Editor / Admin / Owner | Edit item name, quantity, category, assignment, or toggle `isPacked` |
| `DELETE` | `/api/trips/:tripId/packing-list/:itemId` | Editor / Admin / Owner | Delete item & recalculate packing progress |

---

## 🌍 Destination Discovery

Base URL: `/api/destinations`

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/destinations` | Public | Paginated catalog with filters (`category`, `budgetTier`, `minBudget`, `maxBudget`, `travelType`, `featured`, `sort`) |
| `GET` | `/api/destinations/search` | Public | Keyword search (`?q=...`) with optional filters & pagination |
| `GET` | `/api/destinations/:destinationId` | Public | Destination details by MongoDB ObjectId or `slug` |

---

## 🔔 Notifications & Trip Collaboration

### Collaboration Endpoints
| Method | Endpoint | Access / Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/trips/invitations` | Authenticated | List user's trip invitations (`?status=pending\|accepted\|rejected`) |
| `POST` | `/api/trips/:tripId/members` | Admin / Owner | Invite member (`invitationStatus: 'pending'`) & emit invitation notification |
| `PATCH` | `/api/trips/:tripId/members/respond` | Invited User | Accept or reject a pending trip invitation (`{ "status": "accepted" \| "rejected" }`) |
| `PATCH` | `/api/trips/:tripId/members/:memberId/role` | Admin / Owner | Manage member role (`admin`, `editor`, `viewer`) |

### Notification Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Authenticated | Paginated notification inbox + `unreadCount` + filters (`isRead`, `type`, `relatedTrip`) & upcoming trip reminders |
| `PATCH` | `/api/notifications/:notificationId/read` | Authenticated | Mark a single notification as read |
| `PATCH` | `/api/notifications/read-all` | Authenticated | Mark all unread notifications as read |

### Connecting Expo Push Notifications Later
Today, notifications are persisted in MongoDB (`channel: 'in_app'`) with `pushDeliveryStatus: 'not_configured'` — push delivery is never faked. To enable real push notifications from React Native / Expo:
1. **Client (React Native / Expo):** Install `expo-notifications`, request OS permission, obtain the device's `ExponentPushToken[...]`, and register it via a new `POST /api/auth/push-token` endpoint storing `expoPushTokens: [String]` on the `User` model.
2. **Backend (`notification.service.js`):** Install `expo-server-sdk`, replace `evaluatePushChannelStatus()` with an async dispatcher that validates tokens via `Expo.isExpoPushToken(token)`, chunks messages with `expo.chunkPushNotifications(...)`, sends them to Expo Push Service, and updates `pushDeliveryStatus` (`'sent'` or `'failed'`).
3. **Receipts & Cleanup:** Poll Expo push receipts asynchronously to prune invalid/uninstalled device tokens (`DeviceNotRegistered`).

---

## ⚡ Postman API Testing & Collection

A ready-to-import Postman collection is located in:
`postman/Samundar_Ke_Sath_API.postman_collection.json`

### Key features of the collection:
- **Automatic Token & Resource Chaining:** Registering/logging in automatically sets `{{authToken}}`. Creating a trip automatically sets `{{tripId}}`. Adding a member sets `{{memberId}}`. Creating an itinerary day sets `{{itineraryId}}`.
- **Pre-configured Tests:** Validates HTTP status codes (201, 200), schema structures, and role permissions.

### How to use:
1. Open Postman.
2. Click **Import** and select `postman/Samundar_Ke_Sath_API.postman_collection.json`.
3. Set your collection variable `baseUrl` (defaults to `http://localhost:5000`).
4. Execute in order:
   - `1. Authentication` -> `Register User` or `Login User` (stores `authToken`)
   - `2. Trip Management` -> `Create Trip` (stores `tripId`)
   - `2. Trip Management` -> `Get All User Trips` & `Get Trip Details by ID`
   - `3. Trip Members` -> `Add Member to Trip` (stores `memberId`)
   - `4. Trip Itinerary` -> `Create Daily Itinerary & Activities` (stores `itineraryId`)
   - `4. Trip Itinerary` -> `Get Trip Itineraries` & `Update Itinerary Day`
   - `5. Expense Management` -> `Create Expense (Equal Split)` (stores `expenseId`)
   - `5. Expense Management` -> `Get Trip Budget Tracking` & `Get Expense Analytics`
   - `5. Expense Management` -> `Get Multi-Party Settlement Suggestions`
   - `3. Trip Members` -> `Remove Trip Member`
   - `2. Trip Management` -> `Delete Trip`

---

## ☁️ Vercel Deployment Notes

The application structure separates the Express app configuration (`src/app.js`) from the HTTP server listener (`server.js`). This enables zero-configuration Vercel deployment:
- `src/app.js` exports the standard Express app instance (`export default app`).
- `src/config/db.js` caches MongoDB connection promises to reuse connection pools across serverless function warm starts.

