# TokenJar Monitor

A real-time dashboard for monitoring Uniswap's TokenJar contract profitability on Ethereum mainnet.

## What is this?

This tool answers one question: **"Is it profitable to claim TokenJar fees right now, and by how much?"**

The TokenJar accumulates protocol fees from Uniswap trading. Anyone can claim these fees by burning 4,000 UNI tokens via the Firepit contract. This dashboard shows:

- Current total value of tokens in the TokenJar
- Cost to claim (4,000 UNI at current price + gas)
- Net profit/loss if you claimed right now
- Breakdown of all tokens worth > $1,000

Data refreshes every 30 seconds.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- Alchemy API key (free tier works)

### Local Development

1. Clone the repo:
   ```bash
   git clone https://github.com/yourusername/uni-token-jar-monitor.git
   cd uni-token-jar-monitor
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment:
   ```bash
   cp .env.example .env
   # Edit .env and add your ALCHEMY_API_KEY
   ```

4. Run the dev server:
   ```bash
   pnpm dev
   ```

5. Open http://localhost:3000

## Deploy to Railway

1. Push this repo to GitHub

2. Go to [Railway](https://railway.app) and create a new project

3. Select "Deploy from GitHub repo" and choose this repo

4. Add the environment variable:
   - `ALCHEMY_API_KEY` = your Alchemy API key

5. Railway will automatically build and deploy

## Contract Addresses (Ethereum Mainnet)

| Contract | Address |
|----------|---------|
| TokenJar | `0xf38521f130fcCF29dB1961597bc5d2B60F995f85` |
| Firepit | `0x0D5Cd355e2aBEB8fb1552F56c965B867346d6721` |

## Technical Details

- **Framework**: Next.js 15 with App Router
- **Blockchain**: viem for Ethereum RPC calls
- **Pricing**: CoinGecko API (free tier)
- **Token Discovery**: Scans Transfer events to TokenJar to find all tokens
- **Caching**: 60s for prices, 10min for token list

## Limitations

- Only monitors Ethereum mainnet (Unichain support not included)
- Gas estimate is a flat $50 (actual may vary)
- Some tokens may be unpriced if not on CoinGecko
- V2 LP tokens show raw LP balance, not underlying value

## License

MIT
