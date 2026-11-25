# Samundar Ke Sath — Production Backend Audit Report

**Audit Date:** 2026-11-18  
**Target:** `React-native-Diwali-Assignment/Backend` (Node.js ESM + Express 4 + Mongoose 8 + Google Gemini `@google/genai`)  
**Audit Scope:** Full 20-point architecture, security, RBAC, financial calculation, AI integration, validation, and runtime verification audit.

---

## 1. Executive Summary & Readiness Verdict

- **Critical Issues Identified:** 3 — **3 Fixed & Verified**
- **High-Priority Issues Identified:** 6 — **6 Fixed & Verified**
- **Medium-Priority Issues Identified:** 4 — **3 Fixed & Verified**, 1 Remaining Enhancement (distributed rate limiting for multi-node scale)
- **Automated Verification Executed:** 36/36 master audit assertions + 33/33 additional feature tests + 25/25 Gemini AI tests + live Gemini `gemini-3.8-flash` call passed.
- **Not Yet Live-Tested Against External Third-Party Credentials:** Google OAuth real token exchange (requires a real Google Cloud `GOOGLE_CLIENT_ID` and client-issued ID token; fail-closed `503` guard is verified).

**Verdict:** **READY FOR FRONTEND INTEGRATION** (React Native / Expo & Web) for development, staging, and initial production deployment, subject to setting production secrets (`MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GEMINI_API_KEY`) in the deployment host.

---

## 2. Detailed 20-Point Audit Matrix

| # | Audit Area | Status | Notes |
| :---: | :--- | :---: | :--- |
| 1 | Project Architecture | **PASS** | Clean separation across `config`, `models`, `validators`, `middleware`, `services`, `controllers`, `routes`, `utils`, plus `api/index.js` & `vercel.json` for serverless. |
| 2 | Database Models | **PASS** | 8 Mongoose models (`User`, `Trip`, `Itinerary`, `Expense`, `TripMember`, `PackingList`, `Notification`, `Destination`) with schema validations, enums, virtuals, and compound/text indexes. |
| 3 | Authentication | **PASS** | Register, Login, Google OAuth, `/me`, Profile update, Password change, Logout. Passwords hashed via `bcryptjs` (`select: false` + `toJSON` strip). |
| 4 | JWT Middleware | **PASS** | Validates Bearer token, handles expiry/malformed JWT (`401`), validates `ObjectId` payload, verifies user existence. |
| 5 | Google OAuth Verification | **PASS (Fixed)** | Fixed fail-open `audience: undefined` vulnerability (**AUD-02**); now fails closed (`503`) if `GOOGLE_CLIENT_ID` is unset/placeholder and supports multi-platform comma-separated client IDs. |
| 6 | Trip CRUD | **PASS (Fixed)** | Fixed mass assignment (**AUD-03**), ReDoS search (**AUD-06**), `NaN` pagination (**AUD-07**), and orphaned notification cleanup on delete (**AUD-09**). |
| 7 | Trip Ownership & Member Permissions | **PASS** | 4-tier RBAC (`owner`, `admin`, `editor`, `viewer`) enforced via `checkTripAccess`. Pending invitees blocked (`403`) until accepted. Only owner can delete trips or modify admin roles. |
| 8 | Itinerary APIs | **PASS (Fixed)** | Unique `(tripId, dayNumber)` index, RBAC (`editor+`), mass assignment fixed on `updateItinerary` (`tripId` locked), triggers member notifications. |
| 9 | Expense APIs | **PASS (Fixed)** | Full CRUD + filters + pagination. Fixed currency consistency, active member/payer validation, duplicate participant blocking, and ObjectId validation (**AUD-05**). |
| 10 | Budget Calculations | **PASS** | MongoDB aggregation calculates `totalSpent`, `budgetRemaining`, `percentageSpent`, `isOverBudget` accurately against trip currency. |
| 11 | Settlement Calculations | **PASS (Fixed)** | Multi-party net balance (`totalPaid - totalOwed`) + greedy two-pointer debt minimization. Does not assume anyone owes the owner. Fixed percentage rounding drift & N+1 user queries (**AUD-05**). |
| 12 | Gemini Integration | **PASS (Fixed)** | Official `@google/genai` SDK (`gemini-3.8-flash`), native `systemInstruction`, typed JSON schemas, prompt-injection screening, rate limiting, estimates-only metadata, no auto-save, live API verified, 404 model mapping added. |
| 13 | Packing List APIs | **PASS** | Single/batch create & add, category/packed/search filters, toggle packed, delete, real-time `completionPercentage` & category breakdown. |
| 14 | Notifications | **PASS** | Scalable single + bulk (`insertMany`) service, upcoming trip reminders, read/read-all, recipient isolation, honest `pushDeliveryStatus: 'not_configured'` (no fake push delivery). |
| 15 | Destination Discovery | **PASS** | 12 curated seeded destinations, text/compound indexes, category/budget/travelType filters, ReDoS-safe search, ObjectId & slug lookup. |
| 16 | Error Handling | **PASS (Fixed)** | Centralized `errorHandler.js` now handles malformed JSON (`400`), oversized body (`413`), CORS denial (`403`), Mongo network failures (`503`), CastError (`400`), ValidationError (`400`), 11000 (`409`), JWT (`401`), and masks raw 500s in production (**AUD-04**). |
| 17 | Validation | **PASS** | Dedicated validators for Auth, Trips, Expenses, AI, Packing List, Destinations, and Notifications. Updated email regex to support modern TLDs (`.travel`) and `+` tags (**AUD-10**). |
| 18 | Security | **PASS (Fixed)** | Disabled `X-Powered-By`, added `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` (**AUD-08**), closed mass assignment & OAuth audience bypass, ReDoS-escaped search queries. |
| 19 | Environment Variables | **PASS** | `.env` git-ignored; `.env.example` documents all required keys; `GEMINI_API_KEY` strictly server-side. |
| 20 | API Response Consistency | **PASS (Fixed)** | All endpoints including `GET /` now return `{ statusCode, data, message, success }` on success and `{ success: false, statusCode, message, errors? }` on error. |

---

## 3. Confirmed Critical & High-Priority Issues Fixed

### Critical Fixes
1. **AUD-01 — Vercel Serverless Cold-Start DB Connection Failure (`src/app.js`, `src/config/db.js`, `vercel.json`, `api/index.js`)**
   - *Cause:* `connectDB()` was only called in `server.js`, which Vercel skips when invoking `app` directly, and `cached.conn` stayed truthy after disconnects.
   - *Fix:* Added `readyState === 1` check and listener deduplication in `db.js`, added serverless DB connection guard middleware on `/api` (excluding `/api/health`) returning `503` if unreachable, and added `api/index.js` + `vercel.json`.
2. **AUD-02 — Google OAuth Audience Bypass (`src/services/auth.service.js`)**
   - *Cause:* Passing `audience: undefined` when `GOOGLE_CLIENT_ID` was unset/placeholder would allow ID tokens issued for unrelated Google OAuth apps.
   - *Fix:* Fail closed with `503 Service Unavailable` unless a valid `GOOGLE_CLIENT_ID` is configured; added support for comma-separated Android/iOS/Web client IDs.
3. **AUD-03 — Mass Assignment / Ownership Hijacking (`src/services/trip.service.js`)**
   - *Cause:* `Object.assign(trip, updateData)` and `Object.assign(itinerary, updateData)` allowed an Admin to overwrite `trip.owner` or move an itinerary to another `tripId`.
   - *Fix:* Implemented strict field whitelists (`ALLOWED_TRIP_FIELDS`, `ALLOWED_ITINERARY_FIELDS`) on create and update operations.

### High-Priority Fixes
4. **AUD-04 — Incomplete Error Status Mapping (`src/middleware/errorHandler.js`, `src/app.js`)**
   - *Fix:* Mapped malformed JSON (`400`), oversized payload (`413`), CORS rejection (`403`), and MongoDB connection failures (`503`), and masked unexpected 500 messages in production.
5. **AUD-05 — Expense Calculation Integrity & N+1 Queries (`src/services/expense.service.js`)**
   - *Fix:* Enforced currency consistency against `trip.currency`, validated `paidBy` and `participants` are active trip members with no duplicates, reconciled remainder cents on `percentage` splits so sums always equal `amount`, and replaced N+1 `User.findById` loops in analytics and settlements with single `$in` batch queries.
6. **AUD-06 & AUD-07 — ReDoS Search & `NaN` Pagination + Duplicate Code (`src/utils/queryHelpers.js`)**
   - *Fix:* Extracted shared `escapeRegex`, `parsePagination`, and `buildPaginationMeta` helpers and applied them across Trips, Expenses, Destinations, Packing List, and Notifications.
7. **AUD-08 — Missing Security Headers (`src/app.js`)**
   - *Fix:* Disabled `x-powered-by` and added `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`.
8. **AUD-09 — Orphaned Notifications on Trip Deletion (`src/services/trip.service.js`)**
   - *Fix:* Added `Notification.deleteMany({ relatedTrip: tripId })` to cascading `deleteTrip`.

---

## 4. Remaining Non-Blocking Production Recommendations

These items do not block frontend integration but are recommended before high-traffic public launch:
1. **Distributed Rate Limiting (Redis / Upstash):** `aiRateLimiter.js` uses in-memory storage (resets across serverless cold starts). Move to Redis/Upstash for multi-instance production quotas, and add rate limiting to `/api/auth/login` and `/api/auth/register`.
2. **JWT Refresh Tokens / Token Revocation:** Current auth uses stateless JWTs (`7d` expiry). Consider short-lived access tokens + HttpOnly/secure refresh token rotation or a token version counter on `User` to invalidate sessions after password change.
3. **Real Google OAuth Testing:** Configure real Android/iOS/Web `GOOGLE_CLIENT_ID` values from Google Cloud Console and run an end-to-end token test from the React Native client.
4. **Expo Push Notifications:** Connect `expo-server-sdk` into `notification.service.js` once the React Native app registers device Expo Push Tokens.
5. **Rotate Development `GEMINI_API_KEY`:** Replace the key in production hosting secrets before public launch.

