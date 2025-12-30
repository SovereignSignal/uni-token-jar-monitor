// Contract addresses (Ethereum Mainnet)
export const TOKENJAR_ADDRESS = "0xf38521f130fcCF29dB1961597bc5d2B60F995f85" as const;
export const FIREPIT_ADDRESS = "0x0D5Cd355e2aBEB8fb1552F56c965B867346d6721" as const;
export const UNI_TOKEN_ADDRESS = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984" as const;
export const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD" as const;

// Burn threshold (4,000 UNI with 18 decimals)
export const BURN_THRESHOLD = 4000n;
export const BURN_THRESHOLD_WEI = 4000n * 10n ** 18n;

// Display settings
export const MIN_VALUE_DISPLAY_USD = 1000; // Only show tokens worth more than $1,000
export const REFRESH_INTERVAL_MS = 30_000; // 30 seconds
export const PRICE_CACHE_TTL_MS = 60_000; // 60 seconds

// Gas estimate (in USD) - conservative flat estimate for MVP
export const GAS_ESTIMATE_USD = 50;

// Token discovery - look back this many blocks for Transfer events
export const TOKEN_DISCOVERY_LOOKBACK_BLOCKS = 200_000n; // ~30 days at 12s/block

// Well-known tokens with CoinGecko IDs for reliable pricing
// All addresses MUST be lowercase for proper matching with discovered tokens
export const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number; coingeckoId: string }> = {
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": { symbol: "WETH", decimals: 18, coingeckoId: "weth" },
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": { symbol: "USDC", decimals: 6, coingeckoId: "usd-coin" },
  "0xdac17f958d2ee523a2206206994597c13d831ec7": { symbol: "USDT", decimals: 6, coingeckoId: "tether" },
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": { symbol: "WBTC", decimals: 8, coingeckoId: "wrapped-bitcoin" },
  "0x6b175474e89094c44da98b954eedeac495271d0f": { symbol: "DAI", decimals: 18, coingeckoId: "dai" },
  "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": { symbol: "UNI", decimals: 18, coingeckoId: "uniswap" },
  "0x514910771af9ca656af840dff83e8264ecf986ca": { symbol: "LINK", decimals: 18, coingeckoId: "chainlink" },
  "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": { symbol: "AAVE", decimals: 18, coingeckoId: "aave" },
  "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2": { symbol: "MKR", decimals: 18, coingeckoId: "maker" },
  "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f": { symbol: "SNX", decimals: 18, coingeckoId: "havven" },
  "0xd533a949740bb3306d119cc777fa900ba034cd52": { symbol: "CRV", decimals: 18, coingeckoId: "curve-dao-token" },
  "0x5a98fcbea516cf06857215779fd812ca3bef1b32": { symbol: "LDO", decimals: 18, coingeckoId: "lido-dao" },
  "0xd33526068d116ce69f19a9ee46f0bd304f21a51f": { symbol: "RPL", decimals: 18, coingeckoId: "rocket-pool" },
  "0xc00e94cb662c3520282e6f5717214004a7f26888": { symbol: "COMP", decimals: 18, coingeckoId: "compound-governance-token" },
  "0xc18360217d8f7ab5e7c516566761ea12ce7f9d72": { symbol: "ENS", decimals: 18, coingeckoId: "ethereum-name-service" },
  "0xc944e90c64b2c07662a292be6244bdf05cda44a7": { symbol: "GRT", decimals: 18, coingeckoId: "the-graph" },
  "0x4d224452801aced8b2f0aebe155379bb5d594381": { symbol: "APE", decimals: 18, coingeckoId: "apecoin" },
  "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce": { symbol: "SHIB", decimals: 18, coingeckoId: "shiba-inu" },
  "0x6982508145454ce325ddbe47a25d4ec3d2311933": { symbol: "PEPE", decimals: 18, coingeckoId: "pepe" },
  "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0": { symbol: "MATIC", decimals: 18, coingeckoId: "matic-network" },
  "0x45804880de22913dafe09f4980848ece6ecbaf78": { symbol: "PAXG", decimals: 18, coingeckoId: "pax-gold" },
  "0x853d955acef822db058eb8505911ed77f175b99e": { symbol: "FRAX", decimals: 18, coingeckoId: "frax" },
  "0xae7ab96520de3a18e5e111b5eaab095312d7fe84": { symbol: "stETH", decimals: 18, coingeckoId: "staked-ether" },
  "0xbe9895146f7af43049ca1c1ae358b0541ea49704": { symbol: "cbETH", decimals: 18, coingeckoId: "coinbase-wrapped-staked-eth" },
  "0xae78736cd615f374d3085123a210448e74fc6393": { symbol: "rETH", decimals: 18, coingeckoId: "rocket-pool-eth" },
};

// ERC-20 ABI (minimal, only what we need)
export const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "Transfer",
    type: "event",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;
