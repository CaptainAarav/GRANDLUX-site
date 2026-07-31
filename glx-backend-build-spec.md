# GrandLux (GLX) Backend — Build Specification

## Context

GrandLux (GLX) is a flight simulator virtual airline. Two pieces already exist and work end to end:

1. **A Python desktop client** pilots run locally. It reads live position data from X-Plane over UDP, and sends it to a backend API every 2 seconds while a pilot is tracking a flight.
2. **A React website** (Vite) with Firebase Authentication (email/password and Google sign-in). Pilots log in on the site; the desktop client also authenticates through the site via a browser-redirect flow, ending up with a genuine Firebase ID token.

**What's missing, and what this build is for:** a real backend (Express + a database) that receives the desktop client's flight data, persists it per-pilot, and exposes real statistics to the website's dashboard — replacing the fake/hardcoded numbers currently shown there.

---

## What already exists — do not rebuild these

**The desktop client already sends this, exactly, every ~2 seconds while tracking:**

```
POST http://<server>/api/flights/ping
Authorization: Bearer <firebase_id_token>
Content-Type: application/json

{
  "lat": 42.9434928894043,
  "lon": -71.4301528930664,
  "alt_msl": 236.88497924804688,
  "heading": 221.98207092285156,
  "speed": 0
}
```

**A partial Express server already exists and is confirmed working**, with this file structure — **keep this structure, don't restructure it:**

```
server/
├── src/
│   ├── index.js
│   ├── firebase.js
│   ├── middleware/
│   │   └── verifyToken.js
│   └── routes/
│       └── flights.js
├── serviceAccountKey.json   (gitignored — Firebase Admin service account)
├── .env
├── package.json
└── .gitignore
```

**`src/firebase.js`** (confirmed working, uses the modern modular firebase-admin API — do not revert to the old `admin.credential.cert()` pattern, it breaks on current firebase-admin versions):
```js
require('dotenv').config()
const { initializeApp, cert } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const serviceAccount = require('../serviceAccountKey.json')

const app = initializeApp({
	credential: cert(serviceAccount)
})

const auth = getAuth(app)

module.exports = { auth }
```

**`src/middleware/verifyToken.js`** (confirmed working — verifies a real Firebase ID token and attaches the pilot's UID to the request):
```js
const { auth } = require('../firebase')

async function verifyToken(req, res, next) {
	const authHeader = req.headers.authorization
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'No token provided' })
	}
	const token = authHeader.split('Bearer ')[1]
	try {
		const decoded = await auth.verifyIdToken(token)
		req.pilotId = decoded.uid
		next()
	} catch (err) {
		res.status(401).json({ error: 'Invalid token' })
	}
}

module.exports = verifyToken
```

**`src/routes/flights.js`** currently just logs pings — this is what needs to be extended (see endpoints below).

**Important architecture decision already made:** Firebase Authentication owns login credentials entirely (email, password, Google identity). **This backend's database must never store email or password.** The only link between Firebase and this database is the Firebase UID (`req.pilotId`, available on every authenticated request via `verifyToken`).

---

## Tech stack — fixed, do not substitute

- **Node.js + Express** (already set up, keep it)
- **PostgreSQL, self-hosted** — running in Docker on the existing home server (Raspberry Pi), alongside the other services already running there (Nginx reverse proxy, other Dockerized apps). Not a hosted provider — this project runs its own infrastructure.
- **`pg`** (node-postgres) as the database client — plain, no ORM, keeping this consistent with the rest of the codebase's minimal-dependency style. Connect using a `DATABASE_URL` read from `.env`.
- **firebase-admin** (already integrated, don't change the auth approach)
- CommonJS modules (`require`/`module.exports`), matching the existing files — not ES modules, to stay consistent with what's already there.

### Self-hosted Postgres — hard security rules, non-negotiable

This server is expected to receive real traffic from a genuine user base, not just personal testing. These rules exist because this is now public-facing infrastructure on a home network, not a local side project:

- **Postgres's own port (5432) must never be exposed to the public internet.** It should only be reachable on `localhost` or the internal Docker network — bind it there explicitly, don't rely on a firewall rule alone as the only protection.
- **Only the Express API is public-facing, and only through the existing Nginx reverse proxy, over real HTTPS** — never plain HTTP for anything handling real user data or auth tokens.
- **Enable basic rate-limiting in Nginx** for the API routes, to blunt abuse or accidental request storms from a real (not toy-scale) user base.
- **A real backup strategy for the database must exist before real user data lands in it** — a single point of failure (one disk, no backup) losing data means losing other people's flight history, not just a personal project's test data. A simple scheduled `pg_dump` to a separate location is a reasonable minimum.
- **`DATABASE_URL` and any Postgres credentials belong in `.env`, gitignored, same as every other secret in this project — never hardcoded, never committed.**

---

## Engineering rules — please follow exactly, learned the hard way during earlier development

- **Before creating any new file, check whether it already exists.** This project has previously suffered badly from duplicate/misnamed folders (e.g. a stray `middlewhere` folder sitting next to the real `middleware` one) causing silent, hard-to-diagnose bugs where edits were made to files nothing actually loads. Do not leave old/unused files lying around "just in case" — delete anything superseded.
- **Every new route file must be explicitly `require()`'d from `index.js`, and that require path must be verified correct** — a typo'd or misplaced require is the single most common failure mode seen in this project so far.
- **After writing code, actually run the server and show real terminal output proving it starts without error**, before considering any piece done. Don't assume a file saved or a change took effect — confirm it.
- Keep one file per resource/concern (one route file per feature, e.g. `routes/flights.js`, `routes/pilots.js` — don't merge unrelated endpoints into one file).

---

## Database schema

```sql
CREATE TABLE pilots (
    firebase_uid TEXT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    callsign TEXT,
    pfp_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE flights (
    id SERIAL PRIMARY KEY,
    pilot_uid TEXT NOT NULL REFERENCES pilots(firebase_uid),
    departure_icao TEXT,
    arrival_icao TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    distance_nm REAL NOT NULL DEFAULT 0,
    last_lat REAL,
    last_lon REAL,
    last_alt_agl REAL,
    landing_rate_fpm REAL
);

-- Distinct countries a pilot has departed from or arrived in, across all flights.
-- A join table, not a single column, so a pilot visiting the same country twice
-- doesn't need de-duplication logic scattered elsewhere.
CREATE TABLE pilot_countries (
    pilot_uid TEXT NOT NULL REFERENCES pilots(firebase_uid),
    country_code TEXT NOT NULL,
    PRIMARY KEY (pilot_uid, country_code)
);
```

`distance_nm` accumulates incrementally as pings arrive (see `/api/flights/ping` below) — it is **not** computed after the fact from stored points, to avoid needing to store every single ping permanently. `TIMESTAMPTZ` (timestamp with time zone) is Postgres's correct type for real datetimes — don't use plain `TIMESTAMP`, which silently drops timezone information.

`last_alt_agl` and `landing_rate_fpm` support touchdown detection — see the "Landing rate" section below for the mechanism.

---

## Database setup step (do this first)

1. Add a Postgres service to the existing Docker Compose setup on the home server, alongside the other running services — a standard `postgres:16` image is fine, with a named Docker volume for data persistence.
2. Bind Postgres only to `localhost`/the internal Docker network — confirm it is genuinely not reachable from outside before proceeding (test from a separate machine that connecting to the Pi's public IP on port 5432 fails).
3. Set `DATABASE_URL` in `server/.env` pointing at that container (this `.env` file is already gitignored — never commit this value).
4. Run the schema below against that database once.
5. In `src/db.js` (new file), export a configured `pg` `Pool` reading from `process.env.DATABASE_URL`, for the route files to import and query against.
6. Confirm the Nginx reverse proxy is the only public path to the Express API, over HTTPS, before this goes live for real users.

---

## API endpoints to build

All endpoints below require `verifyToken` middleware (already built) — every handler can trust `req.pilotId` is a genuine, verified Firebase UID.

### `POST /api/flights/start`
- Body includes `departure_icao` and `arrival_icao` (the pilot's selected departure/arrival airport codes).
- Creates a new row in `flights` for `req.pilotId`, storing those two codes, with `started_at = now`.
- Returns `{ flight_id: <the new row's id> }`.
- The desktop client will call this once, when a pilot presses "Start Tracking" — this means the client's UI needs a small addition to actually collect these two codes from the pilot first.

### `POST /api/flights/ping`
- Body now includes `flight_id` alongside the existing `lat`/`lon`/`alt_msl`/`heading`/`speed` fields, plus two new fields the client will be updated to send: `alt_agl` and `vvi_fpm` (vertical speed) — see "Landing rate" below for where these come from.
- Look up the flight row by `flight_id` (and confirm `pilot_uid` matches `req.pilotId`, to prevent a pilot updating someone else's flight).
- If `last_lat`/`last_lon` are already set on that row, compute the great-circle distance in nautical miles between the last point and this new point (haversine formula), and add it to `distance_nm`.
- **Touchdown detection for landing rate:** if `last_alt_agl` was above a small threshold (e.g. 10 feet) on the *previous* ping, and the *current* `alt_agl` has dropped to at or near zero, that transition is the moment of touchdown — record the current `vvi_fpm` value into `landing_rate_fpm` on this flight row. This only needs to happen once per flight; don't overwrite it on subsequent pings after landing.
- Update `last_lat`/`last_lon`/`last_alt_agl` to the new position.
- Respond `{ status: 'ok' }`.

### Landing rate — what the client needs to add

Vertical speed is not currently sent by the desktop client. It comes from **X-Plane's classic Data Output row 4** ("Mach, VVI, g-load") — specifically `floats[1]` in that row, which is VVI in feet per minute. This needs enabling as a new row in the client's `XPlaneListener`, the same pattern already used for rows 3, 17, and 20.

Altitude AGL is a smaller addition: it's **already present in row 20**, the same row already being parsed for lat/lon/altitude MSL — specifically `floats[3]`, just never extracted before now. No new X-Plane row needed for this one, only a one-line addition to the existing row-20 parsing logic.

The touchdown-detection logic itself (comparing the previous ping's `alt_agl` to the current one to spot the moment of landing) can live either client-side (in the Python listener, sending a computed `landing_rate_fpm` directly) or server-side (as described in the `/ping` endpoint above, comparing `last_alt_agl` between requests). Server-side is preferable — it keeps the detection logic in one place rather than duplicated in both languages, and the client can just keep sending raw `alt_agl` and `vvi_fpm` every ping without needing its own state-tracking logic.

### Countries visited — via airport codes, not geocoding

Simpler than reverse geocoding a coordinate: if a flight already has a known departure and arrival airport (ICAO code, e.g. `EGLL`, `LUXL`), the country is just a lookup, not a computation.

- **Requires a small, minimal addition upstream of this backend: the pilot must select/enter a departure and arrival airport code before starting tracking.** This is *not* the full route-planning/booking system (still out of scope, see above) — just two airport codes attached to a flight, nothing more. The desktop client's tracking UI needs a small addition for this (e.g. two text fields on the "Start Tracking" screen), and `POST /api/flights/start` needs to accept `departure_icao` and `arrival_icao` in its body, stored on the flight row.
- **Use a static ICAO-code-to-country reference table**, not a live API — this is public, unchanging reference data (airport code → country), a good fit for a small bundled dataset (e.g. from ourairports.com's free, commonly-used open data) loaded into a lookup table in this same database, or even just a JSON file loaded at server startup. No network dependency, no rate limit, fully self-hosted.
- On `/api/flights/end`, look up both `departure_icao` and `arrival_icao` against that reference table, and `INSERT ... ON CONFLICT DO NOTHING` both resulting countries into `pilot_countries` (a flight can add one or two countries, depending on whether departure and arrival are in the same country).
- "Countries Visited" for the dashboard is then simply `COUNT(*)` from `pilot_countries` for that pilot.
- **Worth knowing as a side benefit, not a reason to scope-creep further right now:** once flights have real departure/arrival codes attached, the dashboard's "Route" column (e.g. `EGLL → LUXL`) becomes real data too, not something needing separate work later.

### `POST /api/flights/end`
- Body includes `flight_id`.
- Set `ended_at = now` on that flight row (again, confirming `pilot_uid` matches `req.pilotId`).
- Called once, when a pilot presses "Stop Tracking."

### `GET /api/pilots/me`
- Look up the pilot row for `req.pilotId`. **If none exists yet, create one** (first-login upsert) — a bare row is fine, profile details can be filled in later by a separate endpoint not built in this pass.
- Also compute and return aggregate stats from the `flights` and `pilot_countries` tables:
  - `total_hours` — sum of `(ended_at - started_at)` across all completed flights (flights with `ended_at IS NOT NULL`)
  - `total_flights` — count of completed flights
  - `total_distance_nm` — sum of `distance_nm` across completed flights
  - `total_countries_visited` — count of rows in `pilot_countries` for this pilot
  - `average_landing_rate_fpm` — average of `landing_rate_fpm` across completed flights where it's not null (a flight where touchdown detection never fired — e.g. tracking was stopped mid-flight — should not count as a zero)
- Response shape:
```json
{
  "firebase_uid": "...",
  "first_name": "...",
  "last_name": "...",
  "callsign": "...",
  "pfp_url": "...",
  "total_hours": 12.4,
  "total_flights": 8,
  "total_distance_nm": 3120.5,
  "total_countries_visited": 5,
  "average_landing_rate_fpm": -180.3
}
```

### `GET /api/pilots/me/flights`
- Returns a list of the pilot's completed flights (id, started_at, ended_at, distance_nm), most recent first — for a "Recent Flights" list on the dashboard.
- Keep this simple: no pagination needed yet at this scale.

---

## Explicitly out of scope for this build — do not invent these

The website's dashboard mockup shows more than this backend should build right now. **Do not build fake or placeholder logic for any of the following** — leave them out entirely rather than guessing:

- Rank / points system
- "Countries visited"
- Bookings, NOTAMs, Documents, Resources pages/data
- Named routes, callsigns, PAX counts, or aircraft-per-flight (these imply a route/flight-schedule system that doesn't exist yet)
- SimBrief integration
- Any form of admin panel

These are real, wanted future features — just not part of this pass. If something in the dashboard UI depends on one of these, leave that specific piece of UI on its existing fake data for now rather than backing it with invented backend logic.

---

## Client-side changes also needed (flagging, not required to build here)

The Python desktop client (`sender.py`, `gui.py`) will need corresponding updates to actually call the new `/start` and `/end` endpoints, and include `flight_id` in each `/ping` call. This is a separate, already-understood piece of work on the Python side — not part of this backend build, just noting the backend's endpoint design needs to match what the client will actually send.

---

## Known outstanding issue, unrelated to this build

The desktop client currently saves only a short-lived Firebase ID token (~1 hour), not a real refresh token — so long tracking sessions can hit `401 Unauthorized` partway through once the token expires. This is a separate, already-identified problem on the client side, not something this backend build needs to solve.
