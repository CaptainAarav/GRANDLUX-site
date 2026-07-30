# GRANDLUX-site — agent guide

## Structure

Monorepo split into two independent packages:

| Directory | Tech | Module system |
|-----------|------|---------------|
| `client/` | React 19 + Vite 8 + JSX | ESM |
| `server/` | Express 5 + Firebase Admin | CommonJS |

## Common commands

```sh
cd client && npm run dev
cd server && npm run dev
cd client && npm run lint
cd client && npm run build
```

## Firebase auth

Firebase Auth is used on both client and server sides with token verification.

## Quirks

- **Client uses Font Awesome 7 via npm** — Icons use `fa-*` classes directly.
- **Express 5** uses a different routing and middleware API than Express 4.
- **No proxy** from Vite dev server to the Express backend — direct API calls.
- **Google Fonts**: Inter (body) and Playfair Display (headings) loaded in `client/index.html`.

## Verification

Run `cd client && npm run lint` before committing.
