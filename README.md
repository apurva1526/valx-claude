# ValX

Closed-bidding MSME procurement app. See `valX.md` (project brief, not checked in here) for full product spec and build order.

## Repo layout

- `backend/` — Node.js + Express + TypeScript API, Prisma/PostgreSQL.
- `mobile/` — Expo (React Native) app.

## Local dev setup

1. Use the pinned Node version: `nvm use` (reads `.nvmrc`).
2. Start Postgres.app and create a `valx_dev` database.
3. Backend:
   ```
   cd backend
   cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET
   npm install
   npx prisma migrate dev
   npm run dev
   ```
4. Mobile:
   ```
   cd mobile
   npm install
   npx expo start
   ```
   Scan the QR code with Expo Go on your device.

## Build order

Implemented one step at a time per the project brief. Current status: **Step 1 — Foundation & Auth**.
