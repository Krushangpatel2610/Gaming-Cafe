# GZ Gaming Platform — Complete API Reference (for Frontend Integration)

**Status:** Verified against the actual backend source (`gz_ideation`, branch `feat/test_agent`) as of this writing — every endpoint, payload, and enum below is taken directly from the real `model.ts`/`index.ts`/`service.ts` files, not inferred or guessed. Hand this whole file to your frontend engineer (or their AI assistant) as the single source of truth for what the backend can do and exactly how to call it.

Also in this repo, for deeper context if needed: `docs/api-overview.md` (module/table map), `docs/api-best-practices.md` (response conventions, error codes), `docs/requirements-api-mapping.md` (a narrower audit against the original 7 product requirements, with some known gaps flagged).

---

## Part 1 — What This System Is (plain-language overview)

GZ is software for running a **gaming center / cyber café** — think of it as the operating system for the business, not just for the PCs.

**The problem it solves:** a gaming center has physical PCs (or PS5s, VR rigs, etc.) that customers pay to use by the hour. Someone needs to track who's playing what, for how long, whether they've paid, and needs to be able to remotely lock a PC, see what's happening across the whole floor in real time, and run promotions/loyalty programs — without a human manually managing a spreadsheet.

**Three kinds of people use it, through three different pieces of software, all talking to one shared backend:**

1. **The Player** — a customer. They use a **mobile/web app** to: browse gaming centers, see what's available, book a PC in advance (and pay), check their booking history, manage a wallet/credit balance, and see promotions. When they physically arrive at a booked PC, they either scan a QR code shown on that PC's screen (with their phone) or type their login credentials directly into that PC — either way, it starts their session and unlocks the machine.

2. **The Admin / Staff** — the business owner or front-desk employee. They use an **admin web dashboard** to: see every PC's live status, check in walk-in customers, start/stop/extend sessions, manage pricing, run promotional campaigns, handle billing disputes, and view revenue analytics. "Admin" (business owner, full control) and "Staff" (front-desk, more limited — e.g. can't touch pricing) are two different permission levels on the same login system.

3. **The PC itself** — every gaming PC runs a small piece of native software (not a web app — see the "PC Client" section below) that: shows a login screen *before* the normal Windows desktop even loads, only lets the machine unlock once someone's authenticated through the backend, locks the PC the instant an admin says so (or automatically when paid time runs out), and only allows the specific games/apps the admin has approved to run — nothing else.

**Multi-tenant:** one backend serves many independent gaming centers ("stores") — a store in one city has zero visibility into another store's data. Every store-specific API call includes a `storeId` in the URL.

**The core loop, end to end:**
`Player books & pays a slot on their phone` → `arrives at the venue` → `scans QR (or logs in with creds) at the assigned PC` → `PC unlocks, session starts, only approved games are runnable` → `if their paid time runs out mid-session, the backend auto-extends by charging their wallet — or gives a 10-minute grace period if they can't afford it, before locking` → `admin can see and override any of this live from the dashboard` → `billing, loyalty credits, and revenue reports all update automatically`.

**Key vocabulary** (used throughout the API):

| Term | Meaning |
|---|---|
| **Store** | One gaming center location (multi-tenant root) |
| **System** | One physical PC/console/VR rig |
| **System Type** | A category of system with its own hourly rate (e.g. "Standard PC" vs "Premium PC" vs "PS5") |
| **Booking** | A reservation of a system for a time window, optionally paid in advance |
| **Session** | An actual play session on a system — created from a booking, a walk-in, or a QR/credential login |
| **Credits (wallet)** | A store-specific prepaid balance a player can spend on sessions |
| **Billing Ledger** | The immutable, official record of what a session cost — the source of truth for revenue |
| **Pricing Rule** | A rate override for specific times/days (peak hours, weekends, etc.) layered on top of a System Type's base rate |
| **Campaign** | A promotion (percent off, bonus credits, happy hour, etc.) |
| **PC Client / Agent** | The native software running on each physical gaming PC (separate from this web API, but talks to it) |

---

## Part 2 — Conventions (read this before anything else)

- **Base path:** everything below is relative to your API's base URL (e.g. `https://api.yourdomain.com`). Swagger/OpenAPI docs are auto-generated and live at `/docs` on a running instance.
- **Response envelope**, always one of:
  ```json
  { "success": true, "message": "...", "data": { ... } }
  { "success": true, "message": "...", "data": [ ... ], "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 } }
  { "success": false, "error": { "code": "NOT_FOUND", "message": "...", "details": [] } }
  ```
- **Auth — three schemes, never mixed:**
  - **Player (gamer):** `Authorization: Bearer <userJWT>` — obtained from the `/auth/*` login endpoints.
  - **Admin/Staff:** `Authorization: Bearer <adminJWT>` — same header, different token, obtained from `/auth/admin/login`. The JWT payload carries `role: super_admin | admin | staff` and a fixed `storeId` — an admin token only ever works for their own store.
  - **PC Client (agent):** `X-Agent-Key: <per-system API key>` header — issued once when a system is registered (`POST /stores/:storeId/systems`), never a JWT.
- **WebSocket auth is always a query param**, never a header — browsers can't set custom headers on a WS upgrade. `?token=<jwt>` for user/admin channels, `?key=<apiKey>` for the agent channel.
- **Path convention:** almost everything is nested `/stores/:storeId/...` — always include the real store ID, there is no "current store" implied by the token alone (except that an admin token is only valid for its own store).
- **Pagination params:** `page` (default 1), `limit` (default 20 or 50 depending on endpoint, capped at 100–200) on any list endpoint.
- **HTTP status codes:** `200` OK, `201` Created, `400` bad request, `401` unauthorized, `403` forbidden (authenticated but not allowed), `404` not found, `409` conflict, `422` validation failed, `429` rate limited, `500` server error.

---

## Part 3 — Auth (`/auth`)

Handles both player and admin authentication from one module.

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | none | `{ name, email, password, phone? }` | Player signup. `phone` optional, E.164 format |
| POST | `/auth/login/email` | none | `{ email, password }` | Player login |
| POST | `/auth/login/otp` | none | `{ phone }` | Sends 6-digit OTP, rate-limited 3/10min |
| POST | `/auth/verify/otp` | none | `{ phone, code }` | Verifies OTP, logs in or auto-registers |
| POST | `/auth/login/oauth/:provider` | none | `{ code, state?, redirectUri? }` | `:provider` is `google` or `apple` |
| POST | `/auth/verify/email` | none | `{ token }` | From the email verification link |
| POST | `/auth/refresh` | none | `{ refreshToken }` | Rotates and returns a new access token |
| POST | `/auth/password/reset/request` | none | `{ email }` | Always returns success (no email enumeration) |
| POST | `/auth/password/reset/confirm` | none | `{ token, newPassword }` | Revokes all sessions on success |
| POST | `/auth/admin/login` | none | `{ email, password }` | Staff/admin login |
| POST | `/auth/admin/password-reset/request` | none | `{ email }` | |
| POST | `/auth/admin/password-reset/confirm` | none | `{ token, newPassword }` | |
| POST | `/auth/admin/logout` | admin | `{ refreshToken?, all? }` | `all: true` revokes every device |
| GET | `/auth/admin/me` | admin | — | |
| GET | `/auth/me` | user or admin | — | Accepts either token type, returns whichever profile matches |
| PATCH | `/auth/me` | user | `{ name? }` | |
| PATCH | `/auth/me/device` | user | `{ fcmToken, platform: "ios"\|"android"\|"web" }` | Registers push notification token |
| POST | `/auth/phone/change` | user | `{ newPhone }` | Sends OTP to new number |

**Login response shape** (email/otp/oauth all return the same shape):
```json
{ "success": true, "message": "Login successful",
  "data": { "accessToken": "eyJ...", "refreshToken": "eyJ...",
    "user": { "id": "uuid", "name": "Jane Doe", "phone": "+1555...", "email": "jane@x.com", "isVerified": true, "createdAt": "..." },
    "isNewUser": true } }
```

**Admin login response:**
```json
{ "success": true, "message": "Admin login successful",
  "data": { "accessToken": "eyJ...", "refreshToken": "eyJ...",
    "admin": { "id": "uuid", "name": "...", "email": "admin@x.com", "role": "super_admin", "storeId": "uuid", "permissions": { "manage_pricing": true }, "lastLoginAt": "...", "isActive": true } } }
```

---

## Part 4 — Stores (`/stores`)

Store creation is **public/self-service** — anyone can spin up a new gaming center.

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| GET | `/stores` | none | query: `page, limit, city?` | List active stores |
| GET | `/stores/:storeId` | none | — | `:storeId` here is actually the **slug**, not a UUID |
| POST | `/stores` | none | `{ name, slug?, address?, city?, country?, timezone?, currency?, adminName, adminEmail, adminPassword }` | Creates the store **and** its first `super_admin` account atomically. `country` defaults `"IN"`, `currency` defaults `"INR"`, `timezone` defaults `"Asia/Kolkata"` |
| PATCH | `/stores/:storeId` | admin (super_admin) | `{ name?, slug?, address?, city?, country?, timezone?, currency? }` | `:storeId` is the UUID here |
| GET | `/stores/:storeId/config` | admin | — | Booking config (see below) |
| PATCH | `/stores/:storeId/config` | admin (super_admin) | `{ bookingWindowMinutes?, paymentWindowMinutes?, noShowGraceMinutes?, checkInEarlyMinutes? }` | |

Booking config shape: `{ bookingWindowMinutes, paymentWindowMinutes, noShowGraceMinutes, checkInEarlyMinutes }` — all integers, minutes.

---

## Part 5 — Store Admins (`/stores/:storeId/admins`)

Managing staff/admin accounts. All require `adminAuth`; most actions super_admin-only.

| Method | Path | Notes |
|---|---|---|
| GET | `/` | query: `page, limit, role?, isActive?`. Super admin only |
| POST | `/` | `{ name, email, password, role: "admin"\|"staff" }` (super_admin only) — sends invite email |
| PATCH | `/:id` | Update name/role/permissions (super_admin only, can't demote the only super_admin) |
| DELETE | `/:id` | Deactivate (soft delete), super_admin only |

---

## Part 6 — System Types (`/stores/:storeId/system-types`)

The pricing/spec category a System belongs to (e.g. "Standard PC," "Premium PC," "VR Station").

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | user | Active types only, for players browsing |
| GET | `/` | admin | All types incl. inactive |
| POST | `/` | admin (not staff) | `{ name, description?, hourlyBaseRate, specs?: {gpu?,cpu?,ram?,storage?,monitor?,peripherals?,extras?}, sortOrder? }` |
| PATCH | `/:id` | admin (not staff) | Same fields, all optional; `specs` merges |
| DELETE | `/:id` | admin (super_admin) | Fails if active systems still use this type |

---

## Part 7 — Systems (`/stores/:storeId/systems`) — the physical PCs

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/available` | user | query: `start?, end?, systemTypeId?` — systems free for booking in that window |
| GET | `/` | admin | All systems, incl. inactive |
| GET | `/live` | admin | Live grid — includes `isAgentOnline` (heartbeat < 2 min old) |
| GET | `/:id` | admin | Single system detail |
| POST | `/` | admin (not staff) | `{ name, stationNumber, platform?, systemTypeId?, ipAddress?, macAddress?, specs? }` → returns the **raw agent API key once** |
| POST | `/:id/regenerate-key` | admin (not staff) | Invalidates the old key immediately |
| PATCH | `/:id` | admin (not staff) | Any subset of create fields + `status` |
| DELETE | `/:id` | admin (super_admin) | Fails if system has an active session |
| **POST** | **`/:id/lock`** | admin | Force-locks the PC over WebSocket, independent of session state. Response: `{ commandSent, agentOnline }` — if `agentOnline: false`, the command wasn't delivered (no queuing) |
| **POST** | **`/:id/unlock`** | admin | Same, but unlock |
| POST | `/:id/heartbeat` | agent | `{ status: "available"\|"in_use"\|"offline", currentSessionId?, localTime? }` — called every 30–60s by the PC |
| POST | `/:id/qr-token` | agent | No body. Returns `{ token, expiresIn: 30 }` — rotating login QR shown on the PC's own screen |

`platform` enum: `pc | ps5 | ps4 | xbox | vr | other`. `status` enum: `available | in_use | maintenance | offline`.

---

## Part 8 — Login at the physical PC (two paths)

This is the flow that starts an actual play session on a specific machine — as opposed to `/auth/*` which is just "who are you."

### Path A — QR (phone-initiated)
1. PC calls `POST /stores/:storeId/systems/:id/qr-token` (agent auth) → gets a 30-second token, displays it as a QR code.
2. Player, **already logged into the app**, scans it → their app calls:

**`POST /stores/:storeId/sessions/qr-login`** (user auth)
```json
// Request
{ "token": "a1b2c3..." }
// 200 Response
{ "success": true, "message": "Session started via QR code",
  "data": { "session": { "id": "uuid", "storeId": "uuid", "bookingId": "uuid|null", "userId": "uuid", "systemId": "uuid", "status": "in_progress", "startedAt": "...", "endedAt": null, "durationMinutes": null, "isBilled": false, "walkInPhone": null, "notes": null, "createdAt": "...", "updatedAt": "..." } } }
```
400 if the token expired/invalid, or the system already has an active session.

### Path B — Credentials (typed directly at the PC)

**`POST /stores/:storeId/sessions/login`** (user auth — call `/auth/login/email` first to get the token)
```json
// Request
{ "systemId": "uuid" }
```
Same response shape as QR login. This is what a native login screen on the PC itself calls after the player types their email/password locally.

Both paths internally check for a matching **paid, confirmed booking** for that user/system within a ±15/30-minute window and attach the session to it if found; otherwise it's treated as a walk-in-style session on that system.

---

## Part 9 — Bookings (`/stores/:storeId/bookings`)

| Method | Path | Auth | Body / Notes |
|---|---|---|---|
| POST | `/` | user | `{ systemId, scheduledStart, scheduledEnd, notes? }` → 201, includes `expiresAt` (payment deadline) |
| GET | `/availability` | user | query: `systemId, start, end` → `{ available, conflictingBookingId? }` |
| GET | `/my` | user | query: `page, limit, status?` |
| GET | `/:id` | user | Own bookings only |
| POST | `/:id/pay` | user | No body — marks `isPaid: true`, `status: confirmed`, `bookingType: paid` |
| POST | `/:id/cancel` | user | No body |
| POST | `/:id/check-in` | user | No body — marks `checked_in` |
| GET | `/` | admin | query: `page, limit, date?, status?, systemId?` |
| POST | `/walk-in` | admin | `{ systemId, userId?, walkInPhone?, notes? }` → 201, immediate check-in + session start, 2hr default duration |
| PATCH | `/:id` | admin | `{ scheduledEnd }` — extend |
| GET | `/admin/:id` | admin | Distinct path from the user `GET /:id` to avoid route collision |

`bookingType` enum: `paid | reserved | walk_in`. `status` enum: `pending | confirmed | checked_in | cancelled | no_show`.

**Priority model:** paid booking > walk-in > reserved-unpaid. Unpaid bookings auto-cancel past the payment window (cron, every 1 min); unattended confirmed bookings auto-mark `no_show` after 15 min (cron, every 5 min).

---

## Part 10 — Sessions (`/stores/:storeId/sessions`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/qr-login` | user | See Part 8 |
| POST | `/login` | user | See Part 8 |
| GET | `/my` | user | query: `page, limit, status?` |
| GET | `/:id` | user | Own sessions only |
| GET | `/` | admin | query: `page, limit, status?, systemId?, date?` |
| GET | `/active` | admin | All in-progress sessions, cached 30s |
| GET | `/:id` | admin | |
| POST | `/` | admin (not staff) | `{ systemId, userId?, walkInPhone?, notes? }` — manual walk-in start |
| POST | `/:id/end` | admin/staff | `{ endedAt? }` — ends + pushes `lock` WS command. Does **not** generate billing |
| POST | `/:id/extend` | admin | `{ additionalMinutes: 1-480 }` — logs an extension event |
| POST | `/:id/pause` / `/:id/resume` | admin | No body |
| GET | `/:id/logs` | admin | Full session event log |
| POST | `/agent/:id/end` | agent | Agent-initiated end (its own system only) |
| POST | `/sync` | agent | `{ logs: [{ sessionId, eventType, localTime?, durationSeconds?, metadata? }] }` (max 500) — offline log batch sync. `eventType: "end"` reconciles the session as completed if still `in_progress` |

`status` enum: `in_progress | completed | cancelled | disputed`.

### Auto-extend / grace billing (new, automatic — no frontend action needed, but worth surfacing in UI)

For **booking-backed** sessions only: when the booked time runs out, a backend job (every 1 min) automatically tries to charge the player's wallet for another 30 minutes. If they have enough balance, the session silently continues and a WS `session_extended` event fires. If not, a **10-minute free grace period** starts (no charge, no cutoff) — a WS `session_grace` event fires — and if they still haven't topped up when grace expires, the session force-ends and the PC locks. Frontend implication: **there's currently no REST endpoint exposing "this session is in grace / about to expire"** to the player app — that state only exists in `session.metadata` (`paidUntil`, `graceUntil` — not currently exposed on `SessionResponse`) and over the PC-side WebSocket. If the player app needs to show "your session ends soon, top up now," this needs a small backend addition (exposing those fields, or a push notification hook) — flag to backend if you need it for v1.

---

## Part 11 — Games (`/stores/:storeId/games` and `/stores/:storeId/systems/:systemId/games`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/stores/:storeId/systems/:systemId/games` | user | Games installed on **that specific PC** |
| GET | `/stores/:storeId/systems/:systemId/games/agent` | agent | Same data, agent-scoped (no gamer JWT available on the PC's always-on service) |
| GET | `/stores/:storeId/games` | admin | Master catalog |
| POST | `/stores/:storeId/games` | admin | `{ name, genre?, executablePath? }` |
| PATCH | `/stores/:storeId/games/:id` | admin | `{ name?, genre?, executablePath?, isActive? }` |
| POST | `/stores/:storeId/games/install` | admin | `{ systemId, gameId, isInstalled? }` — maps a game onto a system + notifies the agent |
| DELETE | `/stores/:storeId/games/uninstall?systemId=&gameId=` | admin | Removes the mapping + notifies the agent |
| POST | `/stores/:storeId/games/play/start` | agent | `{ sessionId, systemId, gameId, localTime? }` — logs a game launch |
| POST | `/stores/:storeId/games/play/end` | agent | Same shape — logs a game close |

**Known gap (product-level, not a bug):** `install`/`uninstall` only manage a DB mapping + notify the PC that it *should* install/uninstall — there's no `installerPackageRef` field anywhere, so the PC Client has nothing to actually download/run yet. Real game installers are 20–100+ GB; where they'd be hosted (cloud vs. local network share) hasn't been decided. Not blocking for frontend — the admin UI can build the "install this game on this PC" action against the real endpoint today, it just won't (yet) result in the game actually appearing.

---

## Part 12 — Pricing (`/stores/:storeId/pricing`)

| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/rules` | admin | query: none (returns all, cached) |
| POST | `/rules` | admin (not staff) | `{ name, ruleType?, systemTypeId?, dayOfWeek?: number[0-6], startTime?, endTime?, multiplier?: 0.1-10, fixedRate?, minTier?: 0-10, priority?: 0-100, validFrom?, validUntil? }` |
| PATCH | `/rules/:id` | admin (not staff) | Same fields, all optional, + `isActive?` |
| DELETE | `/rules/:id` | admin (not staff) | Soft delete |
| POST | `/calculate` | admin | `{ systemTypeId, startTime, endTime, userTier? }` → price preview |

`ruleType` enum: `base | peak | off_peak | weekend | custom`. Highest-priority matching rule wins; `fixedRate` overrides base×multiplier entirely if set.

**Price calculation logic** (used everywhere billing happens): base rate comes from the System Type's `hourlyBaseRate`; duration is rounded **up** to the nearest minute; the highest-priority active rule matching the day/time/tier is applied; gross amount = `effectiveRate × (durationMinutes / 60)`.

---

## Part 13 — Billing (`/stores/:storeId/billing`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/ledger` | admin | query: `page, limit, dateFrom?, dateTo?, sessionId?` |
| GET | `/ledger/:id` | admin | Includes any admin overrides applied |
| GET | `/my` | user | Own billing history |
| POST | `/:sessionId/bill` | admin | Generates the official bill for a **completed, not-yet-billed** session using `PricingService.calculatePrice`. One-time — errors `ALREADY_BILLED` on a second call |
| POST | `/:billingId/override` | admin (super_admin) | `{ overrideType: "price"\|"duration"\|"both", reason (min 10 chars), newAmount?, newMinutes? }` — creates a correction ledger entry, doesn't mutate the original |
| GET | `/revenue/summary` | admin | query: `dateFrom?, dateTo?, groupBy?: "day"\|"hour"` |

**Important:** revenue always sums from `billing_ledger`, never from `payments` — they're different concepts (billing = what was owed, payments = what was actually collected).

---

## Part 14 — Payments (`/stores/:storeId/payments`)

All admin-only.

| Method | Path | Body / Notes |
|---|---|---|
| POST | `/` | `{ billingId?, userId?, amount, method: "cash"\|"card"\|"upi"\|"wallet"\|"credits", transactionRef?, idempotencyKey?, gatewayId?, gatewayResponse?, notes? }` — idempotent via `idempotencyKey`, returns 200 (not 201) on duplicate |
| POST | `/:id/refund` | `{ amount?, reason (min 5 chars) }` — super_admin only, partial if `amount` given |
| GET | `/reconciliation` | query: `dateFrom?, dateTo?` — super_admin only, grouped report by method+status |
| GET | `/` | query: `page, limit, status?, method?, billingId?, dateFrom?, dateTo?` |
| GET | `/:id` | Includes raw `gatewayResponse` |

---

## Part 15 — Credits / Wallet (`/stores/:storeId/credits`)

Append-only ledger — balance is always `SUM(ledger entries)`, never a mutable field.

| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/balance` | user | Own balance: `{ currentBalance, availableBalance }` |
| GET | `/balance/:userId` | admin | Any user's balance |
| GET | `/transactions` | user | query: `page, limit` — own history |
| GET | `/transactions/:userId` | admin | Any user's history |
| POST | `/redeem` | user | `{ amount, billingId?, description? }` — errors `INSUFFICIENT_CREDITS` if balance too low |
| POST | `/adjust` | admin (not staff) | `{ userId, amount, type: "credit"\|"debit", description (min 5 chars) }` |

`transactionType` enum on ledger rows: `earned | redeemed | bonus | admin_adjust | expired | refund`. **Credits are store-specific — a balance from Store A cannot be spent at Store B.**

---

## Part 16 — Campaigns / Promotions (`/stores/:storeId/campaigns`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/active` | user | Currently-active campaigns, sorted soonest-expiring first |
| POST | `/:id/redeem` | user | `{ sessionId?, billingId? }` → `{ redemption, discountAmount }` |
| GET | `/` | admin | query: `page, limit, status?` — includes draft/cancelled |
| POST | `/` | admin | `{ name, campaignType, value, validFrom, validUntil, minTier?, maxRedemptions?, maxPerUser?, applicableSystemTypes?: uuid[], description?, terms? }` — starts as `draft` |
| GET | `/:id` | admin | Includes `redemptionsCount` |
| PATCH | `/:id` | admin | Any create field + `status` |
| POST | `/:id/pause` / `/:id/resume` | admin | No body |
| GET | `/:id/redemptions` | admin | query: `page, limit` |

`campaignType` enum: `percentage_off | fixed_off | bonus_minutes | bonus_credits | happy_hour | first_visit`. `status` enum: `draft | scheduled | active | paused | expired | cancelled`.

---

## Part 17 — Notifications (`/notifications` for players, `/stores/:storeId/notifications` for admin sends)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/notifications` | user | query: `page, limit, channel?` — across all stores, includes `unreadCount` |
| GET | `/notifications/preferences` | user | Empty array = all channels enabled by default |
| PATCH | `/notifications/preferences` | user | `{ channel, notificationGroup, isEnabled, storeId? }` — upsert |
| POST | `/notifications/read-all` | user | No body |
| GET | `/notifications/:id` | user | Own only |
| PATCH | `/notifications/:id/read` | user | Idempotent |
| POST | `/stores/:storeId/notifications/admin/send` | admin | `{ userIds: uuid[1-100], channel, title, body, referenceType?, referenceId?, scheduledAt? }` — checks per-user preferences first |
| POST | `/stores/:storeId/notifications/admin/send/topic` | admin | `{ topic, title, body, data? }` — FCM topic broadcast, no per-user records |

`channel` enum: `push | sms | email | in_app`. `notificationGroup` enum: `booking | session | promo | system | billing`.

---

## Part 18 — Disputes (`/stores/:storeId/disputes`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/` | user | `{ billingId, reason (min 20 chars), disputeAmount }` — one active dispute per billing record |
| GET | `/my` | user | query: `page, limit` |
| GET | `/:id` | user | Own only |
| POST | `/:id/withdraw` | user | Only while `open` |
| GET | `/` | admin | query: `page, limit, status?` |
| GET | `/admin/:id` | admin | |
| POST | `/:id/review` | admin | `open` → `under_review` |
| POST | `/:id/resolve` | admin | `{ resolution: "upheld"\|"partial_refund"\|"full_refund"\|"credit_issued", resolutionAmount?, resolutionNotes? }` — `credit_issued` auto-credits the wallet |

---

## Part 19 — Analytics (`/stores/:storeId/analytics`) — admin only

| Method | Path | Notes |
|---|---|---|
| GET | `/dashboard` | query: `date?` (defaults today) — overview metrics |
| GET | `/revenue` | Breakdown, cached 5 min |
| GET | `/utilization` | Hourly heatmap data |
| GET | `/sessions/stats` | Completion rates, walk-in vs booking split |
| GET | `/players` | Unique/new/returning counts |
| GET | `/systems/performance` | Per-PC usage + revenue |

All response bodies here are `t.Unknown()` in the schema (not strictly typed) — parse defensively.

---

## Part 20 — WebSocket Channels

All auth via `?token=` (JWT) or `?key=` (agent), never headers.

| Channel | Path | Who | Direction |
|---|---|---|---|
| Store Live Feed | `/ws/stores/:storeId/live?token=` | Admin | Server → Client. Events: `session.started`, `session.ended`, `system.status_change`, `booking.created`, `booking.cancelled` |
| Agent Link | `/ws/stores/:storeId/agent/:systemId?key=` | PC Client | Bidirectional. Server → Agent commands: `lock`, `unlock`, `sync_request`, `session_extended`, `session_grace`. Agent → Server: `ping` |
| Player Notify | `/ws/users/:userId/notify?token=` | Player | Server → Client push events |
| Store Chat | `/ws/stores/:storeId/chat?token=` | Player or Staff | Bidirectional live chat, 100-message Redis-backed history per store, 24h TTL. Send `{ text }`, receive `{ event: "message", data: {...} }` or `{ event: "history", data: { messages: [...] } }` |

---

## Part 21 — Error Code Reference

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Input failed schema validation |
| `NOT_FOUND` | Resource not found |
| `UNAUTHORIZED` | Missing/invalid token |
| `FORBIDDEN` | Authenticated but not allowed |
| `CONFLICT` | Duplicate or conflicting state |
| `INTERNAL_ERROR` | Unexpected server failure |
| `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`, `REFRESH_TOKEN_INVALID`, `OTP_INVALID`, `OTP_EXPIRED`, `OTP_MAX_ATTEMPTS`, `EMAIL_NOT_VERIFIED`, `OAUTH_FAILED`, `SESSION_REVOKED` | Auth-specific |
| `BOOKING_OVERLAP`, `BOOKING_OUTSIDE_WINDOW`, `BOOKING_EXPIRED`, `BOOKING_ALREADY_PAID`, `BOOKING_CANNOT_CANCEL`, `PAYMENT_WINDOW_NOT_OPEN` | Bookings |
| `SESSION_CONFLICT`, `SESSION_NOT_ACTIVE`, `SYSTEM_UNAVAILABLE` | Sessions |
| `BILLING_IMMUTABLE`, `ALREADY_BILLED`, `OVERRIDE_REQUIRES_REASON` | Billing |
| `PAYMENT_FAILED`, `DUPLICATE_PAYMENT`, `PAYMENT_NOT_REFUNDABLE` | Payments |
| `INSUFFICIENT_CREDITS`, `CREDITS_EXPIRED` | Credits |
| `CAMPAIGN_NOT_ACTIVE`, `CAMPAIGN_MAX_REDEMPTIONS`, `CAMPAIGN_USER_LIMIT`, `CAMPAIGN_TIER_MISMATCH` | Campaigns |
| `FCM_TOKEN_INVALID`, `NOTIFICATION_SEND_FAILED` | Notifications |
| `DISPUTE_ALREADY_RESOLVED`, `DISPUTE_NOT_OWNER` | Disputes |

---

## Part 22 — What's Real vs. What's Still Native-Software Work

For context so the frontend team doesn't build UI against things that don't exist yet:

- **Everything in Parts 3–21 is real, working backend code today.** Build against it directly.
- The **PC Client** (the software running on each gaming PC) is separate native Windows code, not part of this web API — it's what calls the agent-scoped endpoints above (`X-Agent-Key` rows). It exists as source code but is unbuilt/untested as of this writing — don't assume a PC is actually enforcing locks/allowlists yet just because the API supports commanding it to.
- There's currently no REST-visible way for the **player app** to know a session is in its auto-extend grace period (Part 10) — that's a real gap if you want to surface it in the player UI.
- Game **install/uninstall** (Part 11) updates records and notifies the PC, but nothing downloads/runs an actual installer yet — package hosting is an undecided product question.
