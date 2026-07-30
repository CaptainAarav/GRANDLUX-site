# GRANDLUX-site — agent guide

## Structure

Monorepo split into two independent packages (no workspace tool, no root `package.json`):

| Directory | Tech | Module system |
|-----------|------|---------------|
| `client/` | React 19 + Vite 8 + JSX | ESM |
| `server/` | Express 5 + Firebase Admin | CommonJS |

## Common commands

Run each from its own directory:

```sh
# Client (Vite dev server, default :5173)
cd client && npm run dev

# Server (nodemon, default :4000)
cd server && npm run dev

# Lint (client only)
cd client && npm run lint

# Build (client only — outputs to client/dist/)
cd client && npm run build
```

No test framework exists in either package.

## Firebase auth

- **Client**: Firebase Web SDK config is hardcoded in `client/src/firebase.js` (API key, project ID, etc.)
- **Server**: Firebase Admin SDK initialized via `server/serviceAccountKey.json` (gitignored). Must exist to run the server.
- **Token verification**: Express middleware (`server/src/middleware/verifyToken.js`) verifies Firebase ID tokens from `Authorization: Bearer <token>` header.
- **External auth redirect**: Login and GetStarted pages accept `?redirect_port=N` to redirect back to an external app (e.g. flight simulator) with `?token=` after auth completes.

## Quirks

- **Client uses Font Awesome via npm** (`@fortawesome/fontawesome-free`), imported as a CSS module in `client/src/main.jsx`. Icons use `fa-*` classes directly (e.g. `fa-solid fa-eye`). No CDN link in `index.html`.
- **Express 5** uses a different routing and middleware API than Express 4. Notably, Express 5 does not bundle `path-to-regexp` the same way, and route param behavior differs.
- **dotenv** is loaded inside `server/src/firebase.js` (not in `server/src/index.js`). Env vars like `PORT` are available only after requiring firebase.
- **No proxy** from Vite dev server to the Express backend. The client makes direct API calls to whichever origin/port the server runs on.
- **Google Fonts**: Inter (body) and Playfair Display (headings) loaded in `client/index.html`.
- **App.jsx line 47-48** has a duplicate `/myaccount` route — the unprotected one matches first, so `ProtectedRoute` wrapping is effectively dead.
- Server has only one endpoint: `POST /api/flights/ping` (auth-protected).

## Verification

The only automated check is client-side ESLint with flat config. Run `cd client && npm run lint` before committing.

No type checker (no TypeScript), no formatter config.
