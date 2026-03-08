# Crypi

A real-time cryptocurrency dashboard with user authentication, a personal wallet tracker, and detailed coin analytics.

## Features

- **Live Price Dashboard** — Streams real-time prices via Binance WebSocket for each user's personal coin list
- **Dynamic Coin List** — Logged-in users can add or remove any coin; guests see the top 10 by 24h trading volume
- **Coin Detail Pages** — Rich market data per coin: live price, 24h stats, market cap, all-time high, circulating supply, and a candlestick chart with SMA indicators
- **Personal Wallet** — Track how many coins you hold and see your total portfolio value update live
- **Shared Coin List** — Adding or removing a coin in the dashboard or the wallet stays in sync
- **User Authentication** — Register with email verification (via Resend), log in with email or username, secured with JWT
- **Dark / Light Mode** — Toggle between themes, applied globally across the app

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (Pages Router) |
| Frontend | React, Tailwind CSS |
| Database | MongoDB |
| Auth | JWT stored in HttpOnly cookies |
| Email | Resend (transactional email for verification) |
| Live Prices | Binance WebSocket API |
| Market Data | Binance REST API + CoinGecko API |
| Charts | Recharts |
| Deployment | Vercel (Frankfurt region) |

## Pages

| Route | Description |
|---|---|
| `/` | Home page |
| `/dashboard` | Live price cards — personal list for logged-in users, top 10 for guests |
| `/coin/[symbol]` | Coin detail — live market stats, 24h ticker, candlestick chart |
| `/wallet` | Personal wallet — requires login |
| `/login` | Login page (email or username) |
| `/register` | Registration page |
| `/verify-email` | Email verification result (success / failure) |
| `/about` | About the team |

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/EldarGafarov/Crypi.git
cd Crypi
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root of the project:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_at_least_32_characters
RESEND_API_KEY=your_resend_api_key
BASE_URL=http://localhost:3000
```

> In production (Vercel), set `BASE_URL` to your deployed URL (e.g. `https://crypi-phi.vercel.app`).

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Security

- Passwords are hashed with **bcrypt** (cost factor 12) — never stored in plain text
- JWTs are stored in **HttpOnly cookies** — not accessible to JavaScript (XSS protection)
- Cookies use **SameSite=Strict** — prevents cross-site request forgery (CSRF)
- Login uses a **constant-time dummy hash** to prevent timing attacks and email enumeration
- **Email verification** required on register — accounts are inactive until the link is clicked (24-hour expiry)
- Login accepts email **or** username — both map to the same password-protected account
- Wallet API validates coin symbols against a **server-side regex** (`/^[A-Z0-9]+USDT$/`)
