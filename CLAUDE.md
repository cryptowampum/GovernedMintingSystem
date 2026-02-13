# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GovernedMintingSystem is a two-phase NFT minting platform. Users submit photos and metadata via a wallet-connected frontend. Admins review, approve/deny, mint NFTs to selected collections, and share to social media. Built on patterns from SuperFantasticMinter.

## Architecture

```
GovernedMintingSystem/
├── frontend/    # User-facing Vite + React app (port 3000)
├── admin/       # Admin Vite + React app (port 3002)
└── backend/     # Express.js API + Prisma ORM (port 3001)
```

**Data flow:** User submits photo+comment → Backend uploads to IPFS (Pinata), stores in Prisma DB → Admin reviews → Admin approves + selects collection → Backend mints NFT via server-side wallet → Admin shares to social media.

**Wallet connection:** Both frontends use wagmi v2 + RainbowKit + @unicorn.eth/autoconnect for querystring-based gasless wallet connection (`?walletId=inApp`).

**Admin auth:** Wallet signature challenge/response. Admin signs a nonce, backend verifies via `ethers.verifyMessage()`, returns session token. Admin wallets configured in `ADMIN_WALLETS` env var.

**Minting:** Server-side via `MINTER_PRIVATE_KEY` calling `teamMint()` on target contracts (ethers.js v6).

## Common Commands

### Backend
```bash
cd backend
npm install
npm run dev                        # Start with nodemon on :3001
npm run db:migrate                 # Run Prisma migrations (npx prisma migrate dev)
npm run db:generate                # Regenerate Prisma client
npm run db:studio                  # Open Prisma Studio GUI
```

### Frontend (User App)
```bash
cd frontend
npm install
npm run dev                        # Vite dev server on :3000
npm run build                      # Production build
npm run lint                       # ESLint
```

### Admin App
```bash
cd admin
npm install
npm run dev                        # Vite dev server on :3002
npm run build                      # Production build
npm run lint                       # ESLint
```

### Run all three for development
```bash
# Terminal 1
cd backend && npm run dev
# Terminal 2
cd frontend && npm run dev
# Terminal 3
cd admin && npm run dev
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/prisma/schema.prisma` | Database schema (Submission, NftCollection) |
| `backend/server.js` | Express entry point, route registration |
| `backend/routes/admin.js` | Admin CRUD, approve/deny, mint, collections, share URLs |
| `backend/routes/submissions.js` | User submission creation with IPFS upload |
| `backend/middleware/adminAuth.js` | Wallet signature auth (challenge/verify/session) |
| `backend/lib/mint.js` | Server-side NFT minting via ethers.js |
| `backend/lib/pinata.js` | IPFS upload to Pinata |
| `frontend/src/App.jsx` | Provider tree (Wagmi/RainbowKit/Unicorn) + main app |
| `frontend/src/config/wagmi.js` | Wagmi config with unicornConnector |
| `frontend/src/components/SubmissionForm.jsx` | Photo + comment + handles form |
| `frontend/src/components/PhotoCapture.jsx` | Camera/file upload with compression |
| `admin/src/components/AdminGate.jsx` | Wallet auth gate |
| `admin/src/components/SubmissionDetail.jsx` | Review/edit/approve/deny view |
| `admin/src/components/MintAction.jsx` | Mint trigger + status |
| `admin/src/components/SocialShare.jsx` | X/Bluesky/Instagram share |

## Database

PostgreSQL via Prisma. Railway provides `DATABASE_URL` automatically when you attach a Postgres plugin.

```bash
cd backend
npm run db:migrate    # Dev: create/apply migrations
npm run db:deploy     # Prod: apply existing migrations (used in Procfile)
npm run db:studio     # Browse data in GUI
```

## Deployment

- **frontend/** and **admin/** → Vercel (static Vite builds)
- **backend/** → Railway (Express + PostgreSQL)
  - Railway runs `npm run build` (prisma generate) then the `Procfile` (migrate deploy + node server.js)
  - Add a PostgreSQL plugin in Railway — it auto-sets `DATABASE_URL`
  - Set all other env vars from `backend/.env.example` in Railway dashboard

## Styling

Tailwind CSS v4 via PostCSS (`@tailwindcss/postcss`). CSS custom properties in `src/index.css` define the color theme. Both frontend and admin share the same styling pattern.

## Environment Variables

All three apps need `.env` files. Copy from `.env.example` in each directory. Key variables:

- **ADMIN_WALLETS** (backend): Comma-separated checksummed addresses authorized as admins
- **MINTER_PRIVATE_KEY** (backend): Private key of wallet with `teamMint` permission on target contracts
- **PINATA_API_KEY/SECRET** (backend): For IPFS image uploads
- **VITE_THIRDWEB_CLIENT_ID** (frontend/admin): Required for Unicorn wallet connector
- **VITE_WALLETCONNECT_PROJECT_ID** (frontend/admin): Required for WalletConnect
