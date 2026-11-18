# PolyBonds

A one-page screener for near-certain Polymarket “bonds”: open binary markets priced between 95¢ and 99.5¢ that resolve on or before Dec 31 (UTC) of the current year.

Data comes from Polymarket’s public [Gamma API](https://gamma-api.polymarket.com). No database, login, or API keys.

## Run locally

```bash
npm i
npm run snapshot   # pulls Polymarket into data/bonds.json (needs network)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The UI reads `data/bonds.json` first (static snapshot). If Gamma is reachable it refreshes that file; if not, the snapshot still loads.

## Tests

```bash
npm test
```

## Deploy on Vercel

1. Push this repo to GitHub (or connect the folder in the Vercel dashboard).
2. Import the project in [Vercel](https://vercel.com/new).
3. Use the defaults (Next.js). No environment variables are required.
4. Deploy. The `/api/bonds` route and Open Graph image revalidate every 5 minutes.

Or from the CLI:

```bash
npx vercel
```

## Notes

- The site is **static**: Polymarket data is snapshotted at build time. Rebuild (`npm run build` / redeploy) to refresh.
- Markets are pulled via several Gamma sort orders (API offset caps at ~2100 per query) so year-end bonds aren’t missed just for lower liquidity.
- Year-end window includes Polymarket’s Dec 31 ET close stamps (often `Jan 1 ~05:00 UTC`).
- Sports, esports, weather, and crypto price / up-down / range markets are excluded. Category tabs: All, Politics, Crypto, Economy, Other.
- Filters live in the URL (`?range=month&min=0.95&amt=500&sort=return&cat=Crypto&q=fed`) so shared links keep the view. Default sort is liquidity; markets ending within 24 hours are hidden.
- Prices are before fees. “Ends” is when trading closes; payout follows resolution.
