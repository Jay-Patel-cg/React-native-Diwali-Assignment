# Samundar Ke Sath — REST API Documentation

## 1. Conventions & Envelopes

- **Base URL:** `http://localhost:5000` (local) / `https://<your-vercel-domain>` (deployed)
- **Content-Type:** `application/json` (max body size: `100kb`)
- **Authentication Header:** `Authorization: Bearer <JWT_TOKEN>`

### Standard Success Response
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Human-readable status message",
  "success": true
}
```

### Standard Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed: ...",
  "errors": ["Field-level error detail"]
}
```

### Common HTTP Status Codes
| Code | Meaning |
| :---: | :--- |
| `200` | OK |
| `201` | Resource created |
| `400` | Validation error, malformed JSON, invalid ObjectId, or business rule violation |
| `401` | Missing, expired, or invalid JWT / invalid login credentials |
| `403` | Authenticated but lacks trip membership or required RBAC role |
| `404` | Resource or route not found |
| `409` | Duplicate resource (duplicate email, existing member, duplicate itinerary dayNumber) |
| `413` | Payload exceeds `100kb` limit |
| `422` | AI response blocked by safety guidelines |
| `429` | Rate limit exceeded (`Retry-After` header included) |
| `502` | Upstream Gemini AI malformed response or provider authentication/model failure |
| `503` | Database unavailable or external provider (`GEMINI_API_KEY` / `GOOGLE_CLIENT_ID`) not configured |

---

## 2. Authentication (`/api/auth`)

### `POST /api/auth/register`
- **Body:**
  ```json
  {
    "name": "Aarav Patel",
    "email": "aarav@example.com",
    "password": "Password123!",
    "preferences": {
      "preferredCurrency": "INR",
      "travelStyle": ["coastal", "adventure"],
      "dietaryRestrictions": [],
      "language": "en",
      "notificationsEnabled": true
    }
  }
  ```
- **Response (`201`):** `{ user, token }` (password is never returned).

### `POST /api/auth/login`
- **Body:** `{ "email": "aarav@example.com", "password": "Password123!" }`
- **Response (`200`):** `{ user, token }`.

### `POST /api/auth/google`
- **Body:** `{ "idToken": "<GOOGLE_ID_TOKEN>" }` (also accepts `token` or `credential`).
- **Behavior:** Cryptographically verifies ID token via `google-auth-library` against `GOOGLE_CLIENT_ID`. Never trusts client-sent user fields.
- **Response (`200`):** `{ user, token }`.

### `GET /api/auth/me` *(Protected)*
- **Response (`200`):** Sanitized current user document.

### `PATCH /api/auth/profile` *(Protected)*
- **Body:** `{ "name"?, "profileImage"?, "preferences"?: { "preferredCurrency"?, "travelStyle"?, "dietaryRestrictions"?, "language"?, "notificationsEnabled"? } }`
- **Response (`200`):** Updated sanitized user document.

### `PATCH /api/auth/change-password` *(Protected)*
- **Body:** `{ "currentPassword": "Password123!", "newPassword": "NewPassword456!" }`
- **Response (`200`):** `data: null`, `"Password updated successfully"`.

### `POST /api/auth/logout` *(Protected)*
- **Response (`200`):** Stateless acknowledgment instructing client to clear stored JWT.

---

## 3. Trips & Collaboration (`/api/trips`)

All `/api/trips/*` endpoints require JWT authentication.

### `POST /api/trips`
- **Body:**
  ```json
  {
    "title": "Goa Coastal Escapade",
    "destination": "South Goa, India",
    "origin": "Mumbai",
    "startDate": "2026-12-15",
    "endDate": "2026-12-20",
    "travelers": 4,
    "budget": 35000,
    "currency": "INR",
    "status": "planning",
    "description": "Beaches, kayaking, and seafood."
  }
  ```
- **Response (`201`):** Created trip with virtual `durationInDays`. Automatically registers creator as `owner` in `TripMember` and initializes an empty `PackingList`.

### `GET /api/trips`
- **Query:** `page=1`, `limit=10`, `status=planning|active|completed|cancelled`, `search=goa`, `sort=asc|desc` (sorts by `startDate`).
- **Response (`200`):** `{ trips: [...], pagination: { total, page, limit, totalPages, hasNextPage, hasPrevPage } }`.

### `GET /api/trips/:tripId` *(Viewer+)*
- **Response (`200`):** Trip object + populated `owner`, `members`, and `totalItineraryDays`.

### `PATCH /api/trips/:tripId` *(Admin / Owner)*
- **Body:** Any whitelisted subset of `title`, `destination`, `origin`, `startDate`, `endDate`, `travelers`, `budget`, `currency`, `status`, `coverImage`, `description`. (`owner` cannot be overwritten.)

### `DELETE /api/trips/:tripId` *(Owner only)*
- **Behavior:** Deletes trip and cascades to `TripMember`, `Itinerary`, `PackingList`, `Expense`, and related `Notification` records.

### Collaboration Routes
- `POST /api/trips/:tripId/members` *(Admin / Owner)* — Body: `{ "email"?: "...", "userId"?: "...", "role"?: "admin"|"editor"|"viewer" }`. Creates a `pending` invitation and notifies invitee.
- `GET /api/trips/invitations` *(Authenticated)* — Query: `status=pending|accepted|rejected`, `page`, `limit`.
- `PATCH /api/trips/:tripId/members/respond` *(Invited User)* — Body: `{ "status": "accepted" | "rejected" }`. Notifies trip owner.
- `PATCH /api/trips/:tripId/members/:memberId/role` *(Admin / Owner)* — Body: `{ "role": "admin"|"editor"|"viewer" }` (only `owner` may assign/modify `admin`).
- `GET /api/trips/:tripId/members` *(Viewer+)* — Returns all trip members with populated `userId`.
- `DELETE /api/trips/:tripId/members/:memberId` *(Owner / Admin / Self)* — Removes member or leaves trip (owner cannot be removed).

---

## 4. Itinerary (`/api/trips/:tripId/itinerary`)

- `POST /api/trips/:tripId/itinerary` *(Editor+)* — Body:
  ```json
  {
    "date": "2026-12-15",
    "dayNumber": 1,
    "notes": "Arrival day",
    "activities": [
      {
        "title": "Sunset Kayaking at Palolem",
        "description": "Guided coastal kayak tour",
        "startTime": "04:30 PM",
        "endTime": "06:30 PM",
        "location": { "name": "Palolem Beach", "address": "South Goa" },
        "estimatedCost": 1200,
        "category": "water_sports",
        "notes": "Bring dry bag"
      }
    ]
  }
  ```
- `GET /api/trips/:tripId/itinerary` *(Viewer+)* — Sorted ascending by `dayNumber`.
- `PATCH /api/trips/:tripId/itinerary/:itineraryId` *(Editor+)* — Updates `date`, `dayNumber`, `notes`, or `activities`.
- `DELETE /api/trips/:tripId/itinerary/:itineraryId` *(Editor+)* — Deletes itinerary day.

---

## 5. Expenses, Budget & Settlements (`/api/trips/:tripId`)

**Categories:** `transport`, `accommodation`, `stay`, `food`, `activities`, `shopping`, `fuel`, `tickets`, `miscellaneous`.  
**Split Types:** `equal` (auto-splits across all accepted members if `participants` omitted), `exact` (`shareAmount` sum must match `amount`), `percentage` (`percentage` sum must equal `100`, remainder cent reconciled on last participant).

- `POST /api/trips/:tripId/expenses` *(Member)* — Enforces trip currency consistency, active trip membership for `paidBy`/`participants`, and no duplicate participants.
- `GET /api/trips/:tripId/expenses` *(Member)* — Query: `category`, `paidBy`, `startDate`, `endDate`, `search`, `sort=asc|desc`, `page`, `limit`. Returns `{ expenses, tripTotalExpenditure, pagination }`.
- `GET /api/trips/:tripId/expenses/:expenseId` *(Member)* — Single expense detail.
- `PATCH /api/trips/:tripId/expenses/:expenseId` *(Payer / Admin / Owner)* — Updates expense and recalculates shares if amount/split/participants change.
- `DELETE /api/trips/:tripId/expenses/:expenseId` *(Payer / Admin / Owner)* — Deletes expense.
- `GET /api/trips/:tripId/budget` *(Member)* — Returns `{ totalBudget, totalSpent, budgetRemaining, percentageSpent, isOverBudget, totalTransactions, currency }`.
- `GET /api/trips/:tripId/expenses/analytics` *(Member)* — Returns `{ totalExpenses, categoryBreakdown, payerStatistics }`.
- `GET /api/trips/:tripId/expenses/settlements` *(Member)* — Returns `{ totalExpenses, userBalances, settlements, isFullySettled }` using true multi-party net balances (`totalPaid - totalOwed`).

---

## 6. Packing List (`/api/trips/:tripId/packing-list`)

**Categories:** `clothing`, `beachwear`, `toiletries`, `electronics`, `documents`, `medication`, `accessories`, `other`.

- `POST /api/trips/:tripId/packing-list` *(Editor+)* — Accepts `{ items: [...] }` or single `{ itemName, quantity, category, isPacked, assignedTo }`.
- `GET /api/trips/:tripId/packing-list` *(Viewer+)* — Query: `category`, `isPacked`, `assignedTo`, `search`, `page`, `limit`. Returns `{ items, progress: { totalItems, packedItems, unpackedItems, totalQuantity, packedQuantity, completionPercentage, categoryBreakdown } }`.
- `PATCH /api/trips/:tripId/packing-list/:itemId` *(Editor+)* — Edit item or toggle `isPacked`.
- `DELETE /api/trips/:tripId/packing-list/:itemId` *(Editor+)* — Delete item.

---

## 7. Destination Discovery (`/api/destinations`)

- `GET /api/destinations` *(Public)* — Query: `category`, `budgetTier` (`budget|moderate|luxury`), `minBudget`, `maxBudget`, `travelType`, `featured=true|false`, `sort=featured|rating|budget_asc|budget_desc|name`, `page`, `limit`.
- `GET /api/destinations/search` *(Public)* — Query: `q` (required), plus all filter & pagination params above.
- `GET /api/destinations/:destinationId` *(Public)* — Supports MongoDB ObjectId or slug (e.g., `south-goa-palolem-agonda`).

---

## 8. Notifications (`/api/notifications`)

- `GET /api/notifications` *(Protected)* — Query: `isRead=true|false`, `type`, `relatedTrip`, `includeReminders=true|false`, `page`, `limit`. Returns `{ notifications, unreadCount, pagination }`.
- `PATCH /api/notifications/:notificationId/read` *(Protected)* — Marks notification read (`readAt` set).
- `PATCH /api/notifications/read-all` *(Protected)* — Bulk-marks all unread notifications read.

---

## 9. Google Gemini AI Travel Copilot (`/api/ai`)

All AI endpoints require JWT auth, enforce per-user rate limiting (`20` req / `15m` default, `X-RateLimit-*` headers), screen for prompt injection, and return structured draft JSON with `metadata: { aiGenerated: true, savedToDatabase: false, requiresUserConfirmation: true, estimatesOnly: true, disclaimer }`.

- `POST /api/ai/plan-trip` — Input: `destination`, `origin`, `startDate`, `endDate`, `travelers`, `budget`, `currency`, `travelStyle`, `interests`, `accommodationPreferences`, `transportPreferences`.
- `POST /api/ai/generate-itinerary` — Input: `destination`, (`startDate` + `endDate` or `days`), `travelers`, `budget`, `currency`, `pace` (`relaxed|moderate|packed`), `travelStyle`, `interests`, `notes`.
- `POST /api/ai/recommend-destinations` — Input: `origin`, `region`, `budget`, `currency`, `durationDays`, `travelers`, `season`, `travelStyle`, `interests`, `count` (`1–10`).
- `POST /api/ai/budget-suggestions` — Input: `destination`, `origin`, `durationDays` (or dates), `travelers`, `totalBudget`, `currency`, `travelStyle`, `accommodationPreferences`, `transportPreferences`.
- `POST /api/ai/chat` — Input: `message` (max `1500` chars), `history` (max `20` turns), `tripContext`.
- `POST /api/ai/optimize-itinerary` — Input: `destination`, `itinerary` (`1–30` days), `goals`, `budget`, `currency`, `travelStyle`, `constraints`.

