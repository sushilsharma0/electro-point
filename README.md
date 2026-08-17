# ElectroPoint

Premium electronics e-commerce platform — storefront, admin, and API.

## Design

Visual language is documented in `design-system/electropoint/MASTER.md` (Swiss Modernism / precision electronics — not glassmorphism or luxury-fashion gold).

## Stack

- **Frontend:** React, Vite, Tailwind CSS, React Router, TanStack Query
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Payments:** eSewa ePay v2, Khalti KPG-2 (server-side verification)

## Quick start

1. Start MongoDB locally (`mongodb://127.0.0.1:27017`).
2. Backend:

```bash
cd backend
copy .env.example .env
npm install
npm run seed
npm run dev
```

3. Frontend:

```bash
cd frontend
npm install
npm run dev
```

Storefront: http://localhost:5173  
Customer login: http://localhost:5173/login  
Admin login: http://localhost:5173/admin/login (opens in a new tab from the storefront “Staff login” link)  
Admin console: http://localhost:5173/admin  
API: http://localhost:5000/api/v1

`npm run seed` creates **only** the Super Admin. Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` (min 8 characters) in `backend/.env` first — seed will not run with an empty or published default password. Categories, products, coupons, and customers are not seeded — add catalog in `/admin`, and customers sign up at `/register`.

Password reset requires SMTP (`SMTP_HOST` and `SMTP_USER`). If those are unset, `/auth/forgot-password` returns 503 instead of pretending the email was sent.

To wipe catalog and non-admin users (keeps the Super Admin): `npm run seed:reset`.

## Security

Order totals and payment status are computed and verified on the server. Gateway secrets never ship to the browser.
