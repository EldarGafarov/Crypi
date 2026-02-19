# Crypi 🪙

A real-time cryptocurrency dashboard with user authentication and a personal wallet tracker.

## Features

- **Live Price Dashboard** — Streams real-time prices for 10 cryptocurrencies via Binance WebSocket
- **Coin Detail Pages** — View live price graphs and historical data for each coin
- **User Authentication** — Register and log in with a secure JWT-based system
- **Personal Wallet** — Track how many coins you hold and see your total portfolio value update live
- **Dark / Light Mode** — Toggle between themes, applied globally across the app

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (Pages Router) |
| Frontend | React 19, Tailwind CSS |
| Database | MongoDB |
| Auth | JWT stored in httpOnly cookies |
| Live Prices | Binance WebSocket API |
| Charts | Recharts, Chart.js |
| Deployment | Vercel |

## Pages

| Route | Description |
|---|---|
| `/` | Home page |
| `/dashboard` | Live price cards for all 10 coins |
| `/coin/[symbol]` | Detailed view with live graph and historical data |
| `/wallet` | Personal wallet — requires login |
| `/login` | Login page |
| `/register` | Registration page |
| `/about` | About the team |

## Supported Coins

Bitcoin · Ethereum · Binance · Cardano · Solana · Ripple · Dogecoin · Litecoin · Stellar · Polkadot

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/goodpvp90/Crypi.git
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
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Security

- Passwords are hashed with **bcrypt** (cost factor 12) — never stored in plain text
- JWTs are stored in **httpOnly cookies** — not accessible to JavaScript (XSS protection)
- Cookies use **SameSite=Strict** — prevents cross-site request forgery (CSRF)
- Login uses a **constant-time dummy hash** to prevent timing attacks / email enumeration
- Wallet API validates coin symbols against a **server-side whitelist**
