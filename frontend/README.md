# ElectroPoint frontend

React 19 + Vite storefront and admin. Talks to `/api/v1` (proxied to `http://localhost:5000` in development).

## Run

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

Production build:

```bash
npm run build
npm run preview
```

The API must be running for catalog, cart, checkout, and admin. Unsplash placeholders appear only when a product has no images.

## Auth

Cookies (`ep_access`, `ep_refresh`, `ep_csrf`) are sent with `credentials: 'include'`. Mutating requests send `X-CSRF-Token` from the `ep_csrf` cookie. After login the server merges the guest cart.

No payment secrets, JWT secrets, or gateway keys are in this app.
