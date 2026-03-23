# TraseDNA

Wallet analytics dashboard for on-chain traders. Search any address to view PnL, win rate, trading activity, and token-level performance across supported networks.

## Screenshot

![Project Screenshot](docs/screenshots/app.png)

Replace the image above with your latest screenshot.

## Features

- Wallet search with live analytics
- PnL and win-rate calculations
- Recent trade activity feed
- Token-level performance table
- Network usage insights

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Ethers

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Configuration

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_COVALENT_API_KEY=your_covalent_key
NEXT_PUBLIC_DEXSCREENER_API_KEY=your_dexscreener_key
```

`NEXT_PUBLIC_DEXSCREENER_API_KEY` is optional. The app will still work without it, but you may hit rate limits.

## Project Structure

- `src/app` - App Router pages, API routes, and layout
- `src/components` - UI components and view composition
- `src/lib/apis` - External API clients (Covalent, Dexscreener)
- `src/lib/analytics` - PnL, win rate, and trader classification logic
- `src/lib/services` - Wallet analysis pipeline

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Notes

Analytics are derived from on-chain transactions and third-party data sources. Values are estimates and may differ from exchange or wallet UIs.
