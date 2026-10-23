# SmartCart Authentication Upgrade

This ZIP is an **overlay**, not a fresh application. Copy its `server/` and `client/` source files into your existing SmartCart project; do not replace your existing `server/.env`, database, or Git repository.

1. Install: `npm install --prefix server` and `npm install --prefix client`.
2. Add a random `JWT_SECRET` (32+ characters) to `server/.env`.
3. From `server`: `npx prisma migrate dev --name add_user_auth` then `npx prisma generate`.
4. From root: `npm run dev`.
5. Register, log in, checkout, and visit My Orders.

`User` is a new table. `Order.userId` is nullable to preserve existing orders. Old orders are not automatically assigned to users.

Security notes: password hashes use bcryptjs; JWT sessions are stored in HTTP-only SameSite=Lax cookies. For public deployment add rate limiting, email verification, CSRF protection appropriate to your deployment, and stricter production CORS/cookie settings. This is a local hackathon implementation, not a production identity platform.
