# UNI JAR

```
    _______________
   |  ___________  |
   | |   $$$$$   | |
   | |___________| |
   |   _______     |
   |  | BURN? |    |    "Is it profitable to claim
   |  |_______|    |     the TokenJar right now?"
   |_______________|
```

A retro 16-bit dashboard for monitoring Uniswap's TokenJar contract profitability on Ethereum mainnet.

## What Is This?

Uniswap's **TokenJar** contract collects protocol fees. Anyone can claim these fees, but it costs **4,000 UNI** (burned at the Firepit contract).

**The Question**: Is the value in the jar worth more than the 4,000 UNI burn cost?

This dashboard shows you:
- **JAR VALUE** - Total USD value of tokens in the TokenJar
- **BURN COST** - 4,000 UNI at current market price
- **GAS EST.** - Estimated transaction fee
- **NET REWARD** - Profit or loss if you claimed now
- **TOKENS** - Individual holdings worth > $1,000

Data refreshes every 30 seconds.

## Contracts

| Contract | Address |
|----------|---------|
| TokenJar | `0xf38521f130fcCF29dB1961597bc5d2B60F995f85` |
| Firepit | `0x0D5Cd355e2aBEB8fb1552F56c965B867346d6721` |

---

## Deploy to Railway

### Step 1: Get an Alchemy API Key

1. Go to [alchemy.com](https://www.alchemy.com/) and create a free account
2. Click **"Create new app"**
3. Configure:
   - Name: `uni-jar` (or any name)
   - Chain: **Ethereum**
   - Network: **Mainnet**
4. Click **"Create app"**
5. Copy your **API Key**

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/uni-token-jar-monitor.git
git push -u origin main
```

### Step 3: Deploy on Railway

1. Go to [railway.app](https://railway.app/) and sign in
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. **Add the API key**:
   - Click on the service
   - Go to **"Variables"** tab
   - Add: `ALCHEMY_API_KEY` = (your Alchemy key)
5. Railway will redeploy automatically
6. Go to **Settings** → **Networking** → **Generate Domain**
7. Done!

---

## Local Development

### Requirements

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Alchemy API key

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/uni-token-jar-monitor.git
cd uni-token-jar-monitor

pnpm install

cp .env.example .env
# Edit .env and add: ALCHEMY_API_KEY=your_key_here

pnpm dev

# Visit http://localhost:3000
```

### Production Build

```bash
pnpm build
pnpm start
```

---

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `ALCHEMY_API_KEY` | Yes | Alchemy API key for Ethereum mainnet |
| `PORT` | No | Server port (Railway sets automatically) |

---

## Technical Details

### Stack

- **Framework**: Next.js 16 with App Router
- **Blockchain**: viem for Ethereum RPC calls
- **Pricing**: CoinGecko API (free tier)
- **Deployment**: Standalone output for Railway/Docker

### How Token Discovery Works

Instead of a hardcoded token list, the app:

1. Scans ERC-20 Transfer events to the TokenJar (~30 days)
2. Caches discovered tokens for 10 minutes
3. Queries balances for all discovered tokens
4. Prices tokens via CoinGecko
5. Shows tokens worth > $1,000 individually
6. Sums smaller tokens as "other"
7. Counts unpriced tokens separately

### Visual Features

- 16-bit pixel art aesthetic (SNES/Genesis era)
- Uniswap pink (#FF007A) color scheme
- Animated pixel unicorn mascot
- Spinning UNI tokens
- Pink magic particles
- Health hearts showing profitability
- CRT scanlines effect

---

## Limitations

- Ethereum mainnet only
- Gas estimate is fixed at $50 (actual varies)
- Some tokens may be unpriced (not in CoinGecko)
- LP tokens show raw amounts, not underlying value
- CoinGecko has rate limits (~10-30 queries/minute)

---

## Troubleshooting

### "API key not configured"
Add `ALCHEMY_API_KEY` in Railway Variables.

### "Network error" or blank screen
- Verify your API key is valid
- Check it's configured for Ethereum Mainnet
- Check Railway logs

### Tokens showing "-" or $0
- CoinGecko may be rate limited
- Wait 60 seconds and refresh
- Some tokens aren't in CoinGecko

### Hearts are empty
The jar is currently **not profitable** to claim. The token value is less than the 4,000 UNI burn cost.

---

## License

MIT
