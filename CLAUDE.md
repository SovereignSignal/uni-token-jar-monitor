# CLAUDE.md - AI Assistant Guide for UNI JAR Monitor

## Project Overview

**UNI JAR Monitor** is a retro 16-bit style dashboard for monitoring the profitability of claiming Uniswap's TokenJar contract on Ethereum mainnet. The core question it answers: "Is the value in the TokenJar worth more than the 4,000 UNI cost to claim it?"

**Key Contracts:**
- **TokenJar**: `0xf38521f130fcCF29dB1961597bc5d2B60F995f85` - Collects protocol fees
- **Firepit**: `0x0D5Cd355e2aBEB8fb1552F56c965B867346d6721` - Burn receiver for UNI
- **UNI Token**: `0x1f9840a85d5af5bf1d1762f925bdaddc4201f984`

**Technology Stack:**
- **Framework**: Next.js 16.1.1 with App Router
- **Runtime**: TypeScript 5 (strict mode)
- **Blockchain**: viem 2.22.0 for Ethereum RPC
- **Pricing**: DeFiLlama (primary), CoinGecko (fallback)
- **Analytics**: Dune Analytics (optional)
- **Styling**: Tailwind CSS 3.4.1 + custom CSS
- **Deployment**: Next.js standalone output (Railway/Docker)

---

## Repository Structure

```
uni-token-jar-monitor/
├── src/
│   ├── app/
│   │   ├── api/                    # API routes (Next.js App Router)
│   │   │   ├── tokenjar/route.ts   # Main profitability data endpoint
│   │   │   ├── burns/route.ts      # UNI burn history endpoint
│   │   │   ├── dune/route.ts       # Dune analytics debug endpoint
│   │   │   └── health/route.ts     # Health check endpoint
│   │   ├── layout.tsx              # Root layout with metadata
│   │   ├── page.tsx                # Main dashboard (client component)
│   │   └── globals.css             # Global styles & animations
│   ├── components/
│   │   ├── PixelJar.tsx            # Jar fill visualization component
│   │   └── TokenTabs.tsx           # Token listing tabbed interface
│   └── lib/
│       ├── constants.ts            # Contract addresses, configs, KNOWN_TOKENS
│       ├── ethereum.ts             # RPC operations & token balance fetching
│       ├── pricing.ts              # DeFiLlama/CoinGecko price fetching
│       ├── profitability.ts        # Profit calculations & token categorization
│       ├── burnHistory.ts          # UNI burn event tracking
│       ├── dune.ts                 # Dune Analytics integration
│       └── cache.ts                # Server-side in-memory cache
├── public/
│   └── assets/                     # Pixel art sprites & images
├── package.json                    # Dependencies (uses pnpm)
├── tsconfig.json                   # TypeScript config (strict)
├── tailwind.config.ts              # Tailwind configuration
├── next.config.ts                  # Next.js config (standalone output)
└── .env.example                    # Environment variables template
```

---

## Key Files Reference

### Core Library Modules (`src/lib/`)

| File | Purpose |
|------|---------|
| `constants.ts` | Contract addresses, burn threshold (4,000 UNI), KNOWN_TOKENS list (~90 tokens), ERC-20 ABI |
| `ethereum.ts` | `getTokenJarBalances()` - Fetches all ERC-20 balances using Alchemy or fallback to KNOWN_TOKENS |
| `pricing.ts` | `priceTokenBalances()` - Adds USD values via DeFiLlama (batch queries, 100/request) |
| `profitability.ts` | `calculateProfitability()` - Core profit calculation, token categorization (priced/lp/unknown) |
| `burnHistory.ts` | `getBurnHistory()` - Tracks UNI burns to Firepit/0xdead, enriches with tx metadata |
| `dune.ts` | `getDuneFeeSummary()` - Official Uniswap data from Dune queries |
| `cache.ts` | `ServerCache` class - In-memory cache with TTL, stale-while-revalidate pattern |

### API Endpoints (`src/app/api/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tokenjar` | GET | Main profitability data (jar value, burn cost, net profit, tokens) |
| `/api/burns` | GET | UNI burn history (last 200 burns, total burned) |
| `/api/dune` | GET | Dune debug endpoint (`?refresh=true`, `?debug=true`) |
| `/api/health` | GET | Service health check (Alchemy, DeFiLlama, Dune status) |

### Frontend Components (`src/components/`)

| Component | Purpose |
|-----------|---------|
| `PixelJar.tsx` | Animated jar with fill levels (empty → quarter → half → 3/4 → full) |
| `TokenTabs.tsx` | Tabbed interface showing tokens by category (Priced/LP/Unknown) |

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Check health
curl http://localhost:3000/api/health

# Fetch profitability data
curl http://localhost:3000/api/tokenjar

# Fetch burn history
curl http://localhost:3000/api/burns
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# REQUIRED for comprehensive token discovery
ALCHEMY_API_KEY=your_alchemy_api_key_here

# RECOMMENDED for accurate fee data from official Uniswap dashboards
DUNE_API_KEY=your_dune_api_key_here
```

**No API key needed for:**
- DeFiLlama (token pricing)
- LlamaRPC (fallback RPC)
- CoinGecko (UNI price fallback)

---

## Coding Conventions

### TypeScript
- **Strict mode** enabled - all types must be explicit
- Use `as const` for contract addresses and ABIs
- Discriminated unions for categorized data (e.g., `TokenCategory`)
- All API responses have typed interfaces (e.g., `TokenJarApiResponse`)

### Code Organization
- **`lib/`**: Pure business logic, no React dependencies
- **`components/`**: React UI components only
- **`api/`**: Next.js route handlers only
- **Separation of concerns**: Data fetching (ethereum.ts) → Pricing (pricing.ts) → Calculation (profitability.ts)

### Error Handling
- **Graceful degradation**: Fall back to less accurate data rather than failing
- **Stale-while-revalidate**: Return cached data while refreshing in background
- **Console logging**: Prefix with module name `[ModuleName]` for debugging
- **No throwing** in critical paths - return error states in response

### Caching Strategy
- Token Balances: 5 minutes TTL
- Profitability Data: 4 hours TTL
- Burn History: 10 minutes TTL
- Dune Data: 4 hours TTL (API limit)

### Styling
- **Retro 8-bit theme**: Uses "Press Start 2P" font
- **CSS variables** for colors: `--uni-pink`, `--background`, etc.
- **Tailwind + custom CSS** hybrid approach
- Custom animations in `globals.css`: `coin-float`, `emberFloat`, `treasure-glow`

---

## Architecture Patterns

### Data Flow
```
Browser (page.tsx) → API Routes → Library Modules → External APIs
                  ↓                               ↓
              30s polling                    Alchemy/DeFiLlama/Dune
```

### Token Discovery (ethereum.ts)
1. **Alchemy mode** (if API key): Single `alchemy_getTokenBalances` call discovers all ERC-20s
2. **Fallback mode**: Query balances only for ~90 hardcoded KNOWN_TOKENS

### Price Resolution (pricing.ts)
1. **DeFiLlama**: Batch queries (100 tokens/request), format `ethereum:0x{address}`
2. **CoinGecko fallback**: Only for UNI if DeFiLlama fails

### Token Categorization (profitability.ts)
- **Priced**: Has USD value from DeFiLlama
- **LP**: Uniswap V2/V3, Sushiswap SLP, Balancer BPT (detected by symbol patterns)
- **Unknown**: No price data available

---

## Common Modification Tasks

| Task | File(s) to Modify |
|------|-------------------|
| Add new token | `src/lib/constants.ts` - Add to `KNOWN_TOKENS` |
| Change refresh interval | `src/lib/constants.ts` - Update `REFRESH_INTERVAL_MS` |
| Change gas estimate | `src/lib/constants.ts` - Update `GAS_ESTIMATE_USD` |
| Change min display value | `src/lib/constants.ts` - Update `MIN_VALUE_DISPLAY_USD` |
| Add new metric | `src/lib/profitability.ts` - Extend `ProfitabilityData` interface |
| Change UI colors | `src/app/globals.css` - Update CSS variables |
| Add new API endpoint | Create new file in `src/app/api/` |
| Change cache TTL | `src/lib/cache.ts` - Update TTL constants |
| Modify token discovery | `src/lib/ethereum.ts` - Update `getTokenJarBalances()` |

---

## Important Constants

```typescript
// src/lib/constants.ts
BURN_THRESHOLD = 4000n              // UNI required to claim
MIN_VALUE_DISPLAY_USD = 1000        // Only show tokens worth > $1,000
REFRESH_INTERVAL_MS = 30_000        // 30 seconds
GAS_ESTIMATE_USD = 50               // Fixed gas estimate
TOKEN_DISCOVERY_LOOKBACK_BLOCKS = 500_000n  // ~70 days
```

---

## Known Limitations

1. Gas estimate is fixed at $50 USD (actual varies with network)
2. Some tokens are unpriced (not in DeFiLlama or CoinGecko)
3. LP token values shown as raw amounts (not underlying value)
4. CoinGecko rate limits (~10-30 queries/minute)
5. Dune API quota-limited (4-hour cache enforced)
6. Ethereum mainnet only

---

## Testing

**No automated test framework configured.** Testing is done via:
- Manual testing via local development (`pnpm dev`)
- Health check endpoint `/api/health` for smoke tests
- Console logging for debugging

---

## Deployment

**Target platforms:** Railway (recommended), Docker, Vercel

The app uses Next.js standalone output (`next.config.ts: output: "standalone"`) for containerized deployments.

**Required for deployment:**
1. Set `ALCHEMY_API_KEY` environment variable
2. Optionally set `DUNE_API_KEY` for enhanced accuracy

---

## API Response Shapes

### GET /api/tokenjar
```typescript
{
  success: boolean,
  data: {
    isProfitable: boolean,
    netProfitUsd: number,
    totalJarValueUsd: number,
    burnCostUsd: number,
    gasEstimateUsd: number,
    uniPriceUsd: number,
    burnThreshold: 4000,
    displayTokens: TokenWithValue[],
    categorizedTokens: { priced, lp, unknown },
    dataSource: "alchemy.com" | "dune.com",
    cacheStatus: "fresh" | "stale",
    duneData?: DuneDataResponse
  }
}
```

### GET /api/burns
```typescript
{
  success: boolean,
  data: {
    burns: BurnEvent[],
    totalBurned: string,
    lastUpdated: number
  }
}
```

---

## Quick Reference: File Purposes

- **Need to change business logic?** → `src/lib/profitability.ts`
- **Need to modify data fetching?** → `src/lib/ethereum.ts` or `src/lib/pricing.ts`
- **Need to change UI appearance?** → `src/app/globals.css` or `src/components/`
- **Need to add/modify an API endpoint?** → `src/app/api/`
- **Need to add a known token?** → `src/lib/constants.ts`
- **Need to change caching?** → `src/lib/cache.ts`
