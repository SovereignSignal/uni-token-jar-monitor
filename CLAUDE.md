# CLAUDE.md - AI Assistant Guide for UNI JAR Monitor

## Project Overview

**UNI JAR Monitor** is a retro 16-bit style dashboard for monitoring the profitability of claiming Uniswap's TokenJar contract on Ethereum mainnet. The core question it answers: "Is the value in the TokenJar worth more than the 4,000 UNI cost to claim it?"

**Key Contracts:**
- **TokenJar**: `0xf38521f130fcCF29dB1961597bc5d2B60F995f85` - Collects protocol fees
- **Firepit**: `0x0D5Cd355e2aBEB8fb1552F56c965B867346d6721` - Burn receiver for UNI
- **UNI Token**: `0x1f9840a85d5af5bf1d1762f925bdaddc4201f984`
- **Burn Address**: `0x000000000000000000000000000000000000dEaD`

**Technology Stack:**
- **Framework**: Next.js 16.1.1 with App Router
- **Runtime**: TypeScript 5 (strict mode)
- **UI**: React 19 with SWR 2.4 for data fetching
- **Blockchain**: viem 2.22.0 for Ethereum RPC
- **Pricing**: DeFiLlama (primary), CoinGecko (UNI fallback only)
- **Analytics**: Dune Analytics (optional, configurable query IDs)
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
│   │   ├── layout.tsx              # Root layout with metadata, skip link
│   │   ├── page.tsx                # Main dashboard (client component, SWR)
│   │   └── globals.css             # Global styles & animations
│   ├── components/
│   │   ├── PixelJar.tsx            # PixelJar, BurnPile, JarVisualization
│   │   └── TokenTabs.tsx           # Token listing tabbed interface
│   └── lib/
│       ├── constants.ts            # Contract addresses, configs, KNOWN_TOKENS
│       ├── ethereum.ts             # RPC client singleton & token balance fetching
│       ├── pricing.ts              # DeFiLlama/CoinGecko price fetching
│       ├── profitability.ts        # Profit calculations & token categorization
│       ├── burnHistory.ts          # UNI burn event tracking
│       ├── dune.ts                 # Dune Analytics integration (configurable queries)
│       └── cache.ts                # Server-side in-memory cache with TTL
├── public/
│   └── assets/                     # Pixel art sprites & images
├── tasks/
│   ├── todo.md                     # Improvement plan
│   └── qa-report.md               # QA review findings
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
| `constants.ts` | Contract addresses, burn threshold (4,000 UNI), KNOWN_TOKENS list (~73 tokens), ERC-20 ABI |
| `ethereum.ts` | `getClient()` singleton with env var change detection; `getTokenJarBalances()` via Alchemy or KNOWN_TOKENS fallback |
| `pricing.ts` | `priceTokenBalances()` - Adds USD values via DeFiLlama (batch queries, 100/request); CoinGecko fallback for UNI only |
| `profitability.ts` | `calculateProfitability()` - Core profit calculation, token categorization (priced/lp/unknown), LP detection via `isLPToken()` |
| `burnHistory.ts` | `getBurnHistory()` - Tracks UNI burns to Firepit/0xdead, enriches with tx metadata (initiator, gas, status) |
| `dune.ts` | `getDuneFeeSummary()` - Dune data via configurable query IDs (env vars or defaults 6430883/6430884) |
| `cache.ts` | `serverCache` singleton - In-memory cache with TTL, stale-while-revalidate pattern |

### API Endpoints (`src/app/api/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tokenjar` | GET | Main profitability data (jar value, burn cost, net profit, tokens). Params: `?refresh=true` |
| `/api/burns` | GET | UNI burn history (last 200 burns, total burned) |
| `/api/dune` | GET | Dune debug endpoint. Params: `?refresh=true`, `?debug=true`, `?debug_pools=true`, `?debug_summary=true` |
| `/api/health` | GET | Service health check (Alchemy, DeFiLlama, LlamaRPC, Dune status + latency) |

### Frontend Components (`src/components/`)

| Component | Purpose |
|-----------|---------|
| `PixelJar.tsx` | Contains 3 components: `PixelJar` (jar fill visualization), `BurnPile` (flame intensity), `JarVisualization` (combined layout with arrow) |
| `TokenTabs.tsx` | Tabbed interface with keyboard navigation (Arrow keys, Home, End), ARIA roles, showing tokens by category (Priced/LP/Unknown) |

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

# Debug Dune data
curl http://localhost:3000/api/dune?debug=true
curl http://localhost:3000/api/dune?debug_pools=true
curl http://localhost:3000/api/dune?debug_summary=true
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# REQUIRED for comprehensive token discovery
ALCHEMY_API_KEY=your_alchemy_api_key_here

# RECOMMENDED for accurate fee data from Dune dashboards
DUNE_API_KEY=your_dune_api_key_here

# OPTIONAL: Override default Dune query IDs (defaults to Marcov's public dashboard)
DUNE_QUERY_FEES_BY_TOKEN=6430883    # Fees by token breakdown
DUNE_QUERY_FEES_BY_POOL=0           # Fees by pool (set to valid ID to enable)
DUNE_QUERY_SUMMARY=6430884          # Summary / aggregate totals
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
- **Separation of concerns**: Data fetching (ethereum.ts) -> Pricing (pricing.ts) -> Calculation (profitability.ts)

### Error Handling
- **Graceful degradation**: Fall back to less accurate data rather than failing
- **Stale-while-revalidate**: Return cached data while refreshing in background
- **Console logging**: Prefix with module name `[ModuleName]` for debugging
- **No throwing** in critical paths - return error states in response

### Caching Strategy
- Price Cache: 60 seconds TTL (in pricing.ts)
- Token Balances: 5 minutes TTL (in ethereum.ts)
- Profitability Data: 4 hours TTL (in cache.ts)
- Burn History: 10 minutes TTL (in cache.ts)
- Dune Data: 4 hours TTL (in cache.ts, per API quota limits)

### Styling
- **Retro 8-bit theme**: Uses "Press Start 2P" font via `next/font/google` (CSS variable `--font-press-start`)
- **CSS variables** for colors: `--uni-pink`, `--background`, `--retro-green`, `--retro-red`, etc.
- **Tailwind + custom CSS** hybrid approach
- Custom animations in `globals.css`: `coin-float`, `pulse-glow`, `text-pulse`, `emberFloat`, `danger-pulse`, `treasure-glow`
- Content-visibility optimization on burn-row-item and token-row-item for performance

---

## Architecture Patterns

### Data Flow
```
Browser (page.tsx)  --->  API Routes  --->  Library Modules  --->  External APIs
       |                     |                                        |
   SWR polling          Background              Alchemy / DeFiLlama / Dune
  (30s tokenjar,        refresh w/
   5min burns)          60s mutex timeout
```

### Client Singleton (ethereum.ts)
- `getClient()` creates a viem `PublicClient` once and re-uses it
- Detects ALCHEMY_API_KEY changes at runtime (env var rotation) and recreates client
- Prefers Alchemy RPC; falls back to `eth.llamarpc.com`

### Token Discovery (ethereum.ts)
1. **Alchemy mode** (if API key): Single `alchemy_getTokenBalances` call discovers all ERC-20s
2. **Fallback mode**: Query balances only for ~73 hardcoded KNOWN_TOKENS in batches of 20

### Price Resolution (pricing.ts)
1. **DeFiLlama**: Batch queries (100 tokens/request), format `ethereum:0x{address}`
2. **CoinGecko fallback**: Only for UNI price if DeFiLlama fails

### Token Categorization (profitability.ts)
- **Priced**: Has USD value from DeFiLlama
- **LP**: Detected by `isLPToken()` - exact matches (UNI-V2, UNI-V3, CAKE-LP, SPIRIT-LP), prefix matches (SLP, BPT, PGL, JLP), and pattern matches (-LP, LP-)
- **Unknown**: No price data available

### Background Refresh (tokenjar/route.ts)
- Mutex flag (`isRefreshing`) prevents concurrent refreshes
- 60-second timeout auto-clears stuck flag with console warning
- Stale data returned immediately while refresh runs in background

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
| Change cache TTL | `src/lib/cache.ts` - Update `CACHE_TTL` constants |
| Modify token discovery | `src/lib/ethereum.ts` - Update `getTokenJarBalances()` |
| Change Dune queries | Set `DUNE_QUERY_*` env vars, or edit defaults in `src/lib/dune.ts` |
| Modify LP detection | `src/lib/profitability.ts` - Update `isLPToken()` |

---

## Important Constants

```typescript
// src/lib/constants.ts
BURN_THRESHOLD = 4000n              // UNI required to claim
MIN_VALUE_DISPLAY_USD = 1000        // Only show tokens worth > $1,000
REFRESH_INTERVAL_MS = 30_000        // 30 seconds (SWR polling interval)
GAS_ESTIMATE_USD = 50               // Fixed gas estimate
TOKEN_DISCOVERY_LOOKBACK_BLOCKS = 500_000n  // ~70 days

// src/lib/cache.ts
CACHE_TTL.TOKEN_BALANCES = 5 min
CACHE_TTL.PROFITABILITY_DATA = 4 hours
CACHE_TTL.BURN_HISTORY = 10 min
CACHE_TTL.DUNE_DATA = 4 hours
```

---

## Known Limitations

1. Gas estimate is fixed at $50 USD (actual varies with network)
2. Some tokens are unpriced (not in DeFiLlama or CoinGecko)
3. LP token values shown as raw amounts (not underlying value)
4. CoinGecko rate limits (~10-30 queries/minute) - only used as UNI fallback
5. Dune API quota-limited (4-hour cache enforced)
6. Ethereum mainnet only
7. Dune queries may become invalid if the referenced dashboard changes (configurable via env vars)
8. LP tokens (e.g., UNI-V2) all share the same symbol - differentiated by showing contract address

---

## Testing

**No automated test framework configured.** Testing is done via:
- Manual testing via local development (`pnpm dev`)
- Production build verification (`pnpm build`)
- Health check endpoint `/api/health` for smoke tests
- Console logging for debugging
- Production URL: https://uni-token-jar-monitor-production.up.railway.app/

---

## Deployment

**Target platforms:** Railway (recommended), Docker, Vercel

The app uses Next.js standalone output (`next.config.ts: output: "standalone"`) for containerized deployments.

**Required for deployment:**
1. Set `ALCHEMY_API_KEY` environment variable
2. Optionally set `DUNE_API_KEY` for enhanced accuracy
3. Optionally set `DUNE_QUERY_*` env vars to override default query IDs

---

## API Response Shapes

### GET /api/tokenjar
```typescript
interface TokenJarApiResponse {
  success: boolean;
  data?: ProfitabilityData & {
    dataSource: string;           // e.g. "dune.com (live)", "alchemy.com (cached)"
    dataSourceType?: "dune" | "alchemy" | "fallback";
    cacheStatus: "fresh" | "stale" | "miss";
    dataAge: number;              // seconds since data was fetched
    duneData?: {
      tokenJarBalanceUsd: number;
      unclaimedValueUsd: number;
      collectibleUsd: number;
      tokenJarBalanceUni: number;
      unclaimedValueUni: number;
      collectibleUni: number;
      uniToThreshold: number;     // UNI needed until 4000 burn threshold
      tokenCount: number;
      poolCount: number;
      topPools: TopPool[];
    };
  };
  error?: string;
}

// ProfitabilityData includes:
interface ProfitabilityData {
  isProfitable: boolean;
  netProfitUsd: number;
  totalJarValueUsd: number;
  burnCostUsd: number;
  gasEstimateUsd: number;
  uniPriceUsd: number;
  burnThreshold: number;          // 4000
  displayTokens: TokenWithValue[];
  otherTokensCount: number;
  otherTokensValueUsd: number;
  categorizedTokens: {
    priced: TokenCategory;
    lp: TokenCategory;
    unknown: TokenCategory;
  };
  unpricedTokensCount: number;
  unpricedTokens: { address: string; symbol: string; balanceFormatted: string }[];
  timestamp: number;
  lastUpdated: string;            // ISO 8601
}
```

### GET /api/burns
```typescript
interface BurnHistoryApiResponse {
  success: boolean;
  data?: {
    burns: BurnEvent[];         // Up to 200, sorted by timestamp desc
    totalBurned: string;        // Formatted UNI amount
    lastUpdated: number;        // Unix timestamp ms
  };
  error?: string;
}

interface BurnEvent {
  txHash: string;
  blockNumber: number;
  timestamp: number;            // Unix timestamp seconds
  uniAmount: string;
  uniAmountRaw: string;
  burner: string;
  initiator?: string;           // tx.from (may differ for contract calls)
  gasUsed?: string;
  gasPriceWei?: string;
  status?: "success" | "reverted";
  destinations?: Array<"firepit" | "dead">;
}
```

### GET /api/health
```typescript
interface HealthCheck {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  env: {
    hasAlchemyKey: boolean;
    alchemyKeyValid: boolean;   // key length >= 20
    hasDuneKey: boolean;
    nodeEnv: string;
  };
  checks: {
    alchemy: { status: string; latencyMs?: number; error?: string };
    defiLlama: { status: string; latencyMs?: number; error?: string };
    llamaRpc: { status: string; latencyMs?: number; error?: string };
    dune: { status: string; latencyMs?: number; error?: string };
  };
}
```

---

## Accessibility Features

- **Skip link**: "Skip to main content" link in layout.tsx
- **Screen reader h1**: Visually hidden heading for page identification
- **ARIA tabs**: Token Explorer uses `role="tablist"` / `role="tab"` / `role="tabpanel"` with keyboard navigation
- **ARIA labels**: All external links include "(opens in new tab)" in aria-label
- **Burn filter buttons**: `aria-pressed` for toggle state
- **Tooltips**: `role="tooltip"` with `aria-describedby` linkage
- **Focus management**: `:focus-visible` pink outline, mouse users get no outline
- **Expandable content**: `aria-expanded` on Show More/Less buttons

---

## Quick Reference: File Purposes

- **Need to change business logic?** -> `src/lib/profitability.ts`
- **Need to modify data fetching?** -> `src/lib/ethereum.ts` or `src/lib/pricing.ts`
- **Need to change UI appearance?** -> `src/app/globals.css` or `src/components/`
- **Need to add/modify an API endpoint?** -> `src/app/api/`
- **Need to add a known token?** -> `src/lib/constants.ts`
- **Need to change caching?** -> `src/lib/cache.ts`
- **Need to change Dune queries?** -> `src/lib/dune.ts` or `DUNE_QUERY_*` env vars
