# DUNGEON TREASURY

```
    _______________
   |  ___________  |
   | |  DANGER!  | |
   | |___________| |
   |   _______     |
   |  | QUEST |    |    "Should I brave the dungeon
   |  |_______|    |     to claim the treasure?"
   |_______________|
```

A 16-bit retro dungeon-crawler themed dashboard for monitoring Uniswap's TokenJar contract profitability on Ethereum mainnet.

## The Quest

Deep within the Ethereum blockchain lies the **TokenJar Dungeon** - a vault where Uniswap protocol fees accumulate like treasure in a dragon's hoard. Any brave adventurer can claim this treasure... but at a cost.

**The Sacrifice**: You must burn 4,000 UNI tokens at the Firepit to unlock the vault.

**The Question**: Is the treasure worth the sacrifice?

This dashboard shows you:
- Current **VAULT GOLD** (total value in the TokenJar)
- **SACRIFICE COST** (4,000 UNI at current market price)
- **TOLL** (estimated gas fees)
- **NET REWARD** (profit or loss if you claimed now)
- **INVENTORY** of rare items (tokens worth > $1,000)

Data refreshes every 30 seconds. The dungeon never sleeps.

## Dungeon Map (Contract Addresses)

| Location | Address |
|----------|---------|
| Treasure Vault (TokenJar) | `0xf38521f130fcCF29dB1961597bc5d2B60F995f85` |
| Sacrificial Pit (Firepit) | `0x0D5Cd355e2aBEB8fb1552F56c965B867346d6721` |

---

## Begin Your Quest (Deploy to Railway)

### Step 1: Acquire the Oracle Key (Alchemy)

1. Journey to [alchemy.com](https://www.alchemy.com/) and create a free account
2. Click **"Create new app"**
3. Configure:
   - Name: `dungeon-treasury` (or any name you choose)
   - Chain: **Ethereum**
   - Network: **Mainnet**
4. Click **"Create app"**
5. Copy your **API Key** - this is your Oracle Key

### Step 2: Prepare Your Map (GitHub)

```bash
git add .
git commit -m "Prepare for the quest"
git remote add origin https://github.com/YOUR_USERNAME/uni-token-jar-monitor.git
git push -u origin main
```

### Step 3: Enter the Dungeon (Railway)

1. Go to [railway.app](https://railway.app/) and sign in
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select the `uni-token-jar-monitor` repository
4. **CRITICAL**: Add the Oracle Key before deployment completes:
   - Click on the service
   - Go to **"Variables"** tab
   - Add: `ALCHEMY_API_KEY` = (your Alchemy key)
5. Railway will redeploy automatically
6. Go to **Settings** → **Networking** → **Generate Domain**
7. Your dungeon awaits!

---

## Local Dungeon (Development)

### Requirements

- Node.js 20+ (the magic runtime)
- pnpm (`npm install -g pnpm`)
- Alchemy API key (your Oracle connection)

### Setup the Dungeon

```bash
# Clone the dungeon
git clone https://github.com/YOUR_USERNAME/uni-token-jar-monitor.git
cd uni-token-jar-monitor

# Gather supplies
pnpm install

# Configure your Oracle
cp .env.example .env
# Edit .env and add: ALCHEMY_API_KEY=your_key_here

# Enter the dungeon
pnpm dev

# Visit http://localhost:3000
```

### Forge Production Build

```bash
pnpm build
pnpm start
```

---

## Oracle Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `ALCHEMY_API_KEY` | Yes | Your Oracle Key for Ethereum mainnet |
| `PORT` | No | Dungeon entrance port (Railway sets automatically) |

---

## Dungeon Architecture

### Visual Features

- **16-bit pixel art aesthetic** - SNES/Genesis era visuals
- **Zelda-style pottery jar** - The iconic breakable pot
- **Mario-style spinning coins** - Classic gold coin animation
- **Falling rupees** - Zelda gem treasures
- **Twinkling stars** - Dungeon atmosphere
- **Health hearts** - Profitability indicator (Zelda-style)
- **Pixel skulls** - Danger warnings
- **CRT scanlines** - Authentic retro display
- **Glow effects** - Treasure and danger pulses

### Technical Spells

- **Framework**: Next.js 16 with App Router
- **Blockchain Scrying**: viem for Ethereum RPC calls
- **Price Oracle**: CoinGecko API (free tier)
- **Token Discovery**: Scans Transfer events (last ~30 days)
- **Caching**: 60s prices, 10min token list
- **Deployment**: Standalone output for Railway/Docker

### How the Treasure Hunt Works

Instead of a hardcoded list of treasures, the app:

1. Scans all ERC-20 Transfer events to the TokenJar
2. Caches discovered tokens for 10 minutes
3. Queries balances for all discovered tokens
4. Prices tokens via CoinGecko
5. **Rare Items**: Tokens worth > $1,000 (shown individually)
6. **Common Loot**: Smaller tokens (summed together)
7. **Mysterious Items**: Unpriced tokens (unknown value)

---

## Dungeon Perils (Limitations)

- Only explores Ethereum mainnet dungeon
- Toll (gas) is estimated at $50 (actual varies)
- Some treasures may be unpriced (not in CoinGecko's tome)
- V2 LP tokens show raw amounts, not underlying value
- Oracle has rate limits (~10-30 queries/minute)

---

## Troubleshooting

### "Oracle Key not configured"
The dungeon needs its Oracle! Add `ALCHEMY_API_KEY` in Railway Variables.

### "Network error" or blank dungeon
- Verify your Oracle Key is valid
- Ensure it's configured for Ethereum Mainnet
- Check Railway logs for clues

### Treasures showing "-" or $0
- The Oracle may be overwhelmed (rate limited)
- Wait 60 seconds and scout again
- Unknown items show as "mysterious" (unpriced)

### Hearts are empty!
That means the dungeon is currently **not profitable** to raid. The treasure value is less than the sacrifice cost. Wait for more fees to accumulate!

---

## The Legend

```
In the depths of the Ethereum realm,
Where protocol fees gather like gold,
Lies the TokenJar, ancient and wise,
Waiting for heroes brave and bold.

But beware! The Firepit demands its due,
Four thousand UNI must burn in flame,
Only then may you claim what's true,
And etch your deed in DeFi's fame.

Is the treasure worth the sacrifice?
That is the question this tome reveals,
Scout the dungeon, check the price,
And may fortune turn your wheels!
```

---

## License

MIT - Quest freely, adventurer.
