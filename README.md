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

## Contract Addresses (Ethereum Mainnet)

| Contract | Address |
|----------|---------|
| TokenJar | `0xf38521f130fcCF29dB1961597bc5d2B60F995f85` |
| Firepit | `0x0D5Cd355e2aBEB8fb1552F56c965B867346d6721` |

---

## Deploy to Railway (Recommended)

### Step 1: Get an Alchemy API Key

1. Go to [alchemy.com](https://www.alchemy.com/) and create a free account
2. Click **"Create new app"**
3. Configure:
   - Name: `tokenjar-monitor` (or anything)
   - Chain: **Ethereum**
   - Network: **Mainnet**
4. Click **"Create app"**
5. On the app dashboard, click **"API Key"** and copy the key

### Step 2: Push to GitHub

If you haven't already, push this repo to GitHub:

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/uni-token-jar-monitor.git
git push -u origin main
```

### Step 3: Deploy on Railway

1. Go to [railway.app](https://railway.app/) and sign in (GitHub auth recommended)

2. Click **"New Project"**

3. Select **"Deploy from GitHub repo"**

4. Choose the `uni-token-jar-monitor` repository

5. Railway will detect the project and start building. **Before it finishes**, add the environment variable:
   - Click on the service (the purple box)
   - Go to **"Variables"** tab
   - Click **"+ New Variable"**
   - Add:
     - **Name**: `ALCHEMY_API_KEY`
     - **Value**: (paste your Alchemy API key from Step 1)
   - Click **"Add"**

6. Railway will automatically redeploy with the new variable

7. Once deployed, click **"Settings"** → **"Networking"** → **"Generate Domain"** to get your public URL

### Step 4: Verify Deployment

1. Open your Railway-generated URL (e.g., `https://your-app.up.railway.app`)
2. You should see the TokenJar Monitor dashboard
3. If you see "ALCHEMY_API_KEY not configured", double-check your environment variable

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Alchemy API key (free tier works)

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/uni-token-jar-monitor.git
   cd uni-token-jar-monitor
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Alchemy API key:

   ```bash
   ALCHEMY_API_KEY=your_alchemy_api_key_here
   ```

4. Run the dev server:
   ```bash
   pnpm dev
   ```

5. Open http://localhost:3000

### Build for Production

```bash
pnpm build
pnpm start
```

---

## Environment Variables

| Variable          | Required | Description                                      |
|-------------------|----------|--------------------------------------------------|
| `ALCHEMY_API_KEY` | Yes      | Your Alchemy API key for Ethereum mainnet RPC    |
| `PORT`            | No       | Port to run on (Railway sets this automatically) |

---

## Technical Details

- **Framework**: Next.js 16 with App Router
- **Blockchain**: viem for Ethereum RPC calls
- **Pricing**: CoinGecko API (free tier, no key required)
- **Token Discovery**: Scans Transfer events to TokenJar (last ~30 days)
- **Caching**: 60s for prices, 10min for token list
- **Deployment**: Standalone output mode for Railway/Docker

### How Token Discovery Works

Instead of a hardcoded token list, the app:

1. Scans ERC-20 Transfer events to the TokenJar address
2. Caches discovered tokens for 10 minutes
3. Queries balances for all discovered tokens
4. Prices tokens via CoinGecko (known tokens have mapped IDs)
5. Displays tokens worth > $1,000, sums the rest as "Other"

---

## Limitations

- Only monitors Ethereum mainnet (Unichain not included in MVP)
- Gas estimate is a flat $50 (actual varies with network conditions)
- Some tokens may be unpriced if not on CoinGecko
- V2 LP tokens show raw LP balance, not underlying asset value
- CoinGecko free tier has rate limits (~10-30 calls/minute)

---

## Troubleshooting

### "ALCHEMY_API_KEY not configured"

- Make sure you added the `ALCHEMY_API_KEY` environment variable in Railway
- The variable name must be exactly `ALCHEMY_API_KEY` (case-sensitive)
- Redeploy after adding the variable

### "Network error" or no data loading

- Check that your Alchemy API key is valid
- Verify the key is for Ethereum Mainnet (not a testnet)
- Check Railway logs for detailed error messages

### Prices showing as "-" or $0

- CoinGecko may be rate-limiting requests
- Wait 60 seconds and refresh
- Unknown tokens won't have prices (counted as "unpriced")

---

## License

MIT
