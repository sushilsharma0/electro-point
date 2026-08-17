# ElectroPoint API contract

Base: `/api/v1`  
JSON only. Auth: HTTP-only cookies.  
Customer session: `ep_access` + `ep_refresh`.  
Admin session: `ep_admin_access` + `ep_admin_refresh` (separate; does not sign in the storefront).  
CSRF: double-submit cookie `ep_csrf` required on mutating requests via header `X-CSRF-Token`.  
Money: integer **paisa** in API (`amountPaisa`). Display NPR with 2 decimals.  
IDs: Mongo ObjectId strings. Slugs: unique, URL-safe.

## Errors

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

## Auth

| Method | Path | Access |
|--------|------|--------|
| POST | `/auth/register` | public |
| POST | `/auth/login` | public (customers only; staff is rejected) |
| POST | `/auth/logout` | customer auth |
| POST | `/auth/refresh` | customer refresh cookie |
| POST | `/auth/forgot-password` | public |
| POST | `/auth/reset-password` | public |
| GET | `/auth/me` | customer auth |
| POST | `/auth/admin/login` | public (superadmin only) |
| POST | `/auth/admin/logout` | admin auth |
| POST | `/auth/admin/refresh` | admin refresh cookie |
| GET | `/auth/admin/me` | admin auth |

## Catalog (public)

| GET | `/categories` | tree, active only |
| GET | `/categories/:slug` | |
| GET | `/products` | query: q, category, brand, minPrice, maxPrice, inStock, sort, page, limit, filters[key]=value |
| GET | `/products/:slug` | |
| GET | `/products/:id/related` | |
| GET | `/search/suggest` | q |
| GET | `/brands` | |

## Cart / wishlist

Guest cart via `ep_cart` cookie (signed). Merge on login.

| GET/PUT/DELETE | `/cart` |
| POST | `/cart/items` | `{ productId, variantId, qty }` |
| PATCH | `/cart/items/:itemId` | `{ qty }` |
| DELETE | `/cart/items/:itemId` |
| POST | `/cart/coupon` | `{ code }` |
| DELETE | `/cart/coupon` |
| GET/POST/DELETE | `/wishlist` | auth |

## Checkout & orders

| POST | `/checkout/quote` | server-priced summary |
| POST | `/orders` | create pending order from cart (auth) |
| GET | `/orders` | mine |
| GET | `/orders/:id` | mine |
| POST | `/payments/esewa/initiate` | `{ orderId }` → form fields |
| GET | `/payments/esewa/return` | verify via status API then redirect frontend |
| POST | `/payments/khalti/initiate` | `{ orderId }` → `{ paymentUrl }` |
| GET | `/payments/khalti/return` | lookup then redirect |

Never accept client `total` or `status`.

## Reviews / compare / account

| GET | `/reviews/product/:productId` |
| POST | `/reviews` | verified purchase |
| GET | `/compare?ids=` |
| GET/PUT | `/account/profile` |
| CRUD | `/account/addresses` |

## Admin (`/admin/*`) — admin session cookie + role `superadmin`

Products, categories, orders, customers, inventory, coupons, reviews, payments, analytics, settings, uploads.

Uploads: `POST /admin/uploads/image` `POST /admin/uploads/model3d`
