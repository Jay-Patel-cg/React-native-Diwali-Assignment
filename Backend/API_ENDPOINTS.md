# Samundar Ke Sath — Master API Endpoints Registry

**Base URL (Local):** `http://localhost:5000`  
**Total Registered Endpoints:** 41

---

## 1. System & Health (2)

| Method | Endpoint | Auth | Role | Success | Description |
| :---: | :--- | :---: | :---: | :---: | :--- |
| `GET` | `/` | Public | Any | `200` | Root welcome metadata |
| `GET` | `/api/health` | Public | Any | `200` | API uptime, environment & MongoDB connection state |

---

## 2. Authentication (`/api/auth`) (7)

| Method | Endpoint | Auth | Role | Success | Description |
| :---: | :--- | :---: | :---: | :---: | :--- |
| `POST` | `/api/auth/register` | Public | Any | `201` | Register user (bcrypt hash + JWT) |
| `POST` | `/api/auth/login` | Public | Any | `200` | Login with email/password (returns JWT) |
| `POST` | `/api/auth/google` | Public | Any | `200` | Verify Google ID Token server-side & issue JWT |
| `GET` | `/api/auth/me` | JWT | Self | `200` | Fetch current authenticated user profile |
| `PATCH` | `/api/auth/profile` | JWT | Self | `200` | Update name, profileImage, preferences |
| `PATCH` | `/api/auth/change-password` | JWT | Self | `200` | Verify current password & set new password |
| `POST` | `/api/auth/logout` | JWT | Self | `200` | Stateless JWT logout acknowledgment |

---

## 3. Trip Management & Collaboration (`/api/trips`) (10)

| Method | Endpoint | Auth | Role | Success | Description |
| :---: | :--- | :---: | :---: | :---: | :--- |
| `POST` | `/api/trips` | JWT | Authenticated | `201` | Create trip, enroll owner in `TripMember`, init `PackingList` |
| `GET` | `/api/trips` | JWT | Authenticated | `200` | List owned/joined trips (`page`, `limit`, `status`, `search`, `sort`) |
| `GET` | `/api/trips/invitations` | JWT | Authenticated | `200` | List logged-in user's invitations (`status`, `page`, `limit`) |
| `GET` | `/api/trips/:tripId` | JWT | Viewer+ | `200` | Get trip details, populated owner, members, itinerary count |
| `PATCH` | `/api/trips/:tripId` | JWT | Admin / Owner | `200` | Update whitelisted trip details, dates, budget, or status |
| `DELETE` | `/api/trips/:tripId` | JWT | Owner only | `200` | Delete trip + cascade members, itineraries, packing list, expenses, notifications |
| `POST` | `/api/trips/:tripId/members` | JWT | Admin / Owner | `201` | Invite user by `email` or `userId` (`pending`) + send notification |
| `GET` | `/api/trips/:tripId/members` | JWT | Viewer+ | `200` | List trip members & invitations |
| `PATCH` | `/api/trips/:tripId/members/respond` | JWT | Invited User | `200` | Accept or reject pending invitation (`accepted` / `rejected`) |
| `PATCH` | `/api/trips/:tripId/members/:memberId/role` | JWT | Admin / Owner | `200` | Update member role (`admin`, `editor`, `viewer`) |
| `DELETE` | `/api/trips/:tripId/members/:memberId` | JWT | Admin / Owner / Self | `200` | Remove member, cancel invite, or leave trip (owner protected) |

*(11 trip & collaboration endpoints)*

---

## 4. Itinerary & Daily Activities (`/api/trips/:tripId/itinerary`) (4)

| Method | Endpoint | Auth | Role | Success | Description |
| :---: | :--- | :---: | :---: | :---: | :--- |
| `POST` | `/api/trips/:tripId/itinerary` | JWT | Editor+ | `201` | Create daily itinerary with activities + notify members |
| `GET` | `/api/trips/:tripId/itinerary` | JWT | Viewer+ | `200` | Get trip itineraries sorted chronologically by `dayNumber` |
| `PATCH` | `/api/trips/:tripId/itinerary/:itineraryId` | JWT | Editor+ | `200` | Update itinerary day notes/date/activities + notify members |
| `DELETE` | `/api/trips/:tripId/itinerary/:itineraryId` | JWT | Editor+ | `200` | Delete itinerary day |

---

## 5. Expense Management, Budget & Settlements (`/api/trips/:tripId`) (8)

| Method | Endpoint | Auth | Role | Success | Description |
| :---: | :--- | :---: | :---: | :---: | :--- |
| `POST` | `/api/trips/:tripId/expenses` | JWT | Viewer+ (Member) | `201` | Create expense (`equal` / `exact` / `percentage` split) + notify members |
| `GET` | `/api/trips/:tripId/expenses` | JWT | Viewer+ | `200` | List expenses (`category`, `paidBy`, `startDate`, `endDate`, `search`, `sort`, `page`, `limit`) |
| `GET` | `/api/trips/:tripId/expenses/analytics` | JWT | Viewer+ | `200` | Category-wise breakdown & per-person payer statistics |
| `GET` | `/api/trips/:tripId/expenses/settlements` | JWT | Viewer+ | `200` | Multi-party net balances & minimal settlement transfers |
| `GET` | `/api/trips/:tripId/expenses/:expenseId` | JWT | Viewer+ | `200` | Get single expense details |
| `PATCH` | `/api/trips/:tripId/expenses/:expenseId` | JWT | Payer / Admin / Owner | `200` | Update expense details or recalculate splits + notify members |
| `DELETE` | `/api/trips/:tripId/expenses/:expenseId` | JWT | Payer / Admin / Owner | `200` | Delete expense |
| `GET` | `/api/trips/:tripId/budget` | JWT | Viewer+ | `200` | Real-time budget tracking (`totalBudget`, `totalSpent`, `budgetRemaining`, `percentageSpent`, `isOverBudget`) |

---

## 6. Packing List Management (`/api/trips/:tripId/packing-list`) (4)

| Method | Endpoint | Auth | Role | Success | Description |
| :---: | :--- | :---: | :---: | :---: | :--- |
| `POST` | `/api/trips/:tripId/packing-list` | JWT | Editor+ | `201` | Create packing list or add single/batch items |
| `GET` | `/api/trips/:tripId/packing-list` | JWT | Viewer+ | `200` | List items (`category`, `isPacked`, `assignedTo`, `search`, `page`, `limit`) + packing progress |
| `PATCH` | `/api/trips/:tripId/packing-list/:itemId` | JWT | Editor+ | `200` | Edit item or toggle `isPacked` + return refreshed progress |
| `DELETE` | `/api/trips/:tripId/packing-list/:itemId` | JWT | Editor+ | `200` | Delete item + return refreshed progress |

---

## 7. Destination Discovery (`/api/destinations`) (3)

| Method | Endpoint | Auth | Role | Success | Description |
| :---: | :--- | :---: | :---: | :---: | :--- |
| `GET` | `/api/destinations` | Public | Any | `200` | Paginated catalog (`category`, `budgetTier`, `minBudget`, `maxBudget`, `travelType`, `featured`, `sort`) |
| `GET` | `/api/destinations/search` | Public | Any | `200` | Keyword search (`?q=...`) + filters & pagination |
| `GET` | `/api/destinations/:destinationId` | Public | Any | `200` | Get destination details by MongoDB ObjectId or URL `slug` |

---

## 8. Notifications (`/api/notifications`) (3)

| Method | Endpoint | Auth | Role | Success | Description |
| :---: | :--- | :---: | :---: | :---: | :--- |
| `GET` | `/api/notifications` | JWT | Self | `200` | Paginated inbox + `unreadCount` + filters (`isRead`, `type`, `relatedTrip`) + upcoming trip reminders |
| `PATCH` | `/api/notifications/read-all` | JWT | Self | `200` | Mark all unread notifications as read |
| `PATCH` | `/api/notifications/:notificationId/read` | JWT | Self | `200` | Mark single notification as read (recipient-only) |

---

## 9. Google Gemini AI Travel Copilot (`/api/ai`) (6)

| Method | Endpoint | Auth | Rate Limit | Success | Description |
| :---: | :--- | :---: | :---: | :---: | :--- |
| `POST` | `/api/ai/plan-trip` | JWT | 20 / 15m | `200` | Full structured AI trip plan (draft estimates only) |
| `POST` | `/api/ai/generate-itinerary` | JWT | 20 / 15m | `200` | Day-wise AI itinerary generator (draft estimates only) |
| `POST` | `/api/ai/recommend-destinations` | JWT | 20 / 15m | `200` | Personalized AI destination recommendations |
| `POST` | `/api/ai/budget-suggestions` | JWT | 20 / 15m | `200` | Category-wise travel budget breakdown (8 expense categories) |
| `POST` | `/api/ai/chat` | JWT | 20 / 15m | `200` | Interactive AI travel chat with history & `tripContext` |
| `POST` | `/api/ai/optimize-itinerary` | JWT | 20 / 15m | `200` | Optimize existing itinerary for routing, pacing, or cost |

