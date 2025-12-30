// Contract addresses (Ethereum Mainnet)
export const TOKENJAR_ADDRESS = "0xf38521f130fcCF29dB1961597bc5d2B60F995f85" as const;
export const FIREPIT_ADDRESS = "0x0D5Cd355e2aBEB8fb1552F56c965B867346d6721" as const;
export const UNI_TOKEN_ADDRESS = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984" as const;
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
// These are commonly seen in DeFi and likely to be in the TokenJar
export const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number; coingeckoId: string }> = {
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": { symbol: "WETH", decimals: 18, coingeckoId: "weth" },
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": { symbol: "USDC", decimals: 6, coingeckoId: "usd-coin" },
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": { symbol: "USDT", decimals: 6, coingeckoId: "tether" },
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": { symbol: "WBTC", decimals: 8, coingeckoId: "wrapped-bitcoin" },
  "0x6B175474E89094C44Da98b954EescdeCB5Fcd6f": { symbol: "DAI", decimals: 18, coingeckoId: "dai" },
  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984": { symbol: "UNI", decimals: 18, coingeckoId: "uniswap" },
  "0x514910771AF9Ca656af840dff83E8264EcF986CA": { symbol: "LINK", decimals: 18, coingeckoId: "chainlink" },
  "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9": { symbol: "AAVE", decimals: 18, coingeckoId: "aave" },
  "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2": { symbol: "MKR", decimals: 18, coingeckoId: "maker" },
  "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F": { symbol: "SNX", decimals: 18, coingeckoId: "havven" },
  "0xD533a949740bb3306d119CC777fa900bA034cd52": { symbol: "CRV", decimals: 18, coingeckoId: "curve-dao-token" },
  "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32": { symbol: "LDO", decimals: 18, coingeckoId: "lido-dao" },
  "0xD33526068D116cE69F19A9ee46F0bd304F21A51f": { symbol: "RPL", decimals: 18, coingeckoId: "rocket-pool" },
  "0xc00e94Cb662C3520282E6f5717214004A7f26888": { symbol: "COMP", decimals: 18, coingeckoId: "compound-governance-token" },
  "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72": { symbol: "ENS", decimals: 18, coingeckoId: "ethereum-name-service" },
  "0xc944E90C64B2c07662A292be6244BDf05Cda44a7": { symbol: "GRT", decimals: 18, coingeckoId: "the-graph" },
  "0x4d224452801ACEd8B2F0aebE155379bb5D594381": { symbol: "APE", decimals: 18, coingeckoId: "apecoin" },
  "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE": { symbol: "SHIB", decimals: 18, coingeckoId: "shiba-inu" },
  "0x6982508145454Ce325dDbE47a25d4ec3d2311933": { symbol: "PEPE", decimals: 18, coingeckoId: "pepe" },
  "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0": { symbol: "MATIC", decimals: 18, coingeckoId: "matic-network" },
  "0x45804880De22913dAFE09f4980848ECE6EcbAf78": { symbol: "PAXG", decimals: 18, coingeckoId: "pax-gold" },
  "0x853d955aCEf822Db058eb8505911ED77F175b99e": { symbol: "FRAX", decimals: 18, coingeckoId: "frax" },
  "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84": { symbol: "stETH", decimals: 18, coingeckoId: "staked-ether" },
  "0xBe9895146f7AF43049ca1c1AE358B0541Ea49704": { symbol: "cbETH", decimals: 18, coingeckoId: "coinbase-wrapped-staked-eth" },
  "0xae78736Cd615f374D3085123A210448E74Fc6393": { symbol: "rETH", decimals: 18, coingeckoId: "rocket-pool-eth" },
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
