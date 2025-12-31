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
  // Major tokens
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": { symbol: "WETH", decimals: 18, coingeckoId: "weth" },
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": { symbol: "USDC", decimals: 6, coingeckoId: "usd-coin" },
  "0xdac17f958d2ee523a2206206994597c13d831ec7": { symbol: "USDT", decimals: 6, coingeckoId: "tether" },
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": { symbol: "WBTC", decimals: 8, coingeckoId: "wrapped-bitcoin" },
  "0x6b175474e89094c44da98b954eedeac495271d0f": { symbol: "DAI", decimals: 18, coingeckoId: "dai" },
  "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": { symbol: "UNI", decimals: 18, coingeckoId: "uniswap" },
  
  // DeFi tokens
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
  "0xba100000625a3754423978a60c9317c58a424e3d": { symbol: "BAL", decimals: 18, coingeckoId: "balancer" },
  "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2": { symbol: "SUSHI", decimals: 18, coingeckoId: "sushi" },
  "0x111111111117dc0aa78b770fa6a738034120c302": { symbol: "1INCH", decimals: 18, coingeckoId: "1inch" },
  "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e": { symbol: "YFI", decimals: 18, coingeckoId: "yearn-finance" },
  
  // Meme tokens
  "0x4d224452801aced8b2f0aebe155379bb5d594381": { symbol: "APE", decimals: 18, coingeckoId: "apecoin" },
  "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce": { symbol: "SHIB", decimals: 18, coingeckoId: "shiba-inu" },
  "0x6982508145454ce325ddbe47a25d4ec3d2311933": { symbol: "PEPE", decimals: 18, coingeckoId: "pepe" },
  "0xb131f4a55907b10d1f0a50d8ab8fa09ec342cd74": { symbol: "MEME", decimals: 18, coingeckoId: "memecoin" },
  "0x761d38e5ddf6ccf6cf7c55759d5210750b5d60f3": { symbol: "ELON", decimals: 18, coingeckoId: "dogelon-mars" },
  "0xaaaaaa20d9e0e2461697782ef11675f668207961": { symbol: "AURORA", decimals: 18, coingeckoId: "aurora-near" },
  
  // L2 & Scaling
  "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0": { symbol: "MATIC", decimals: 18, coingeckoId: "matic-network" },
  "0x4200000000000000000000000000000000000042": { symbol: "OP", decimals: 18, coingeckoId: "optimism" },
  "0x912ce59144191c1204e64559fe8253a0e49e6548": { symbol: "ARB", decimals: 18, coingeckoId: "arbitrum" },
  "0x9e32b13ce7f2e80a01932b42553652e053d6ed8e": { symbol: "METIS", decimals: 18, coingeckoId: "metis-token" },
  
  // Stablecoins
  "0x45804880de22913dafe09f4980848ece6ecbaf78": { symbol: "PAXG", decimals: 18, coingeckoId: "pax-gold" },
  "0x853d955acef822db058eb8505911ed77f175b99e": { symbol: "FRAX", decimals: 18, coingeckoId: "frax" },
  "0x8e870d67f660d95d5be530380d0ec0bd388289e1": { symbol: "USDP", decimals: 18, coingeckoId: "paxos-standard" },
  "0x4fabb145d64652a948d72533023f6e7a623c7c53": { symbol: "BUSD", decimals: 18, coingeckoId: "binance-usd" },
  "0x0000000000085d4780b73119b644ae5ecd22b376": { symbol: "TUSD", decimals: 18, coingeckoId: "true-usd" },
  "0x5f98805a4e8be255a32880fdec7f6728c6568ba0": { symbol: "LUSD", decimals: 18, coingeckoId: "liquity-usd" },
  "0x57ab1ec28d129707052df4df418d58a2d46d5f51": { symbol: "sUSD", decimals: 18, coingeckoId: "susd" },
  "0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3": { symbol: "MIM", decimals: 18, coingeckoId: "magic-internet-money" },
  "0x956f47f50a910163d8bf957cf5846d573e7f87ca": { symbol: "FEI", decimals: 18, coingeckoId: "fei-usd" },
  "0x674c6ad92fd080e4004b2312b45f796a192d27a0": { symbol: "USDN", decimals: 18, coingeckoId: "neutrino" },
  
  // Liquid staking
  "0xae7ab96520de3a18e5e111b5eaab095312d7fe84": { symbol: "stETH", decimals: 18, coingeckoId: "staked-ether" },
  "0xbe9895146f7af43049ca1c1ae358b0541ea49704": { symbol: "cbETH", decimals: 18, coingeckoId: "coinbase-wrapped-staked-eth" },
  "0xae78736cd615f374d3085123a210448e74fc6393": { symbol: "rETH", decimals: 18, coingeckoId: "rocket-pool-eth" },
  "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0": { symbol: "wstETH", decimals: 18, coingeckoId: "wrapped-steth" },
  "0xac3e018457b222d93114458476f3e3416abbe38f": { symbol: "sfrxETH", decimals: 18, coingeckoId: "staked-frax-ether" },
  "0xa35b1b31ce002fbf2058d22f30f95d405200a15b": { symbol: "ETHx", decimals: 18, coingeckoId: "stader-ethx" },
  "0xf1c9acdc66974dfb6decb12aa385b9cd01190e38": { symbol: "osETH", decimals: 18, coingeckoId: "stakewise-staked-eth" },
  "0xa2e3356610840701bdf5611a53974510ae27e2e1": { symbol: "wBETH", decimals: 18, coingeckoId: "wrapped-beacon-eth" },
  
  // Gaming & Metaverse
  "0x3845badade8e6dff049820680d1f14bd3903a5d0": { symbol: "SAND", decimals: 18, coingeckoId: "the-sandbox" },
  "0x0f5d2fb29fb7d3cfee444a200298f468908cc942": { symbol: "MANA", decimals: 18, coingeckoId: "decentraland" },
  "0xbb0e17ef65f82ab018d8edd776e8dd940327b28b": { symbol: "AXS", decimals: 18, coingeckoId: "axie-infinity" },
  "0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c": { symbol: "ENJ", decimals: 18, coingeckoId: "enjincoin" },
  "0x15d4c048f83bd7e37d49ea4c83a07267ec4203da": { symbol: "GALA", decimals: 8, coingeckoId: "gala" },
  "0x31c8eacbffdd875c74b94b077895bd78cf1e64a3": { symbol: "RAD", decimals: 18, coingeckoId: "radicle" },
  
  // Infrastructure
  "0x0d8775f648430679a709e98d2b0cb6250d2887ef": { symbol: "BAT", decimals: 18, coingeckoId: "basic-attention-token" },
  "0x4a220e6096b25eadb88358cb44068a3248254675": { symbol: "QNT", decimals: 18, coingeckoId: "quant-network" },
  "0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0": { symbol: "FXS", decimals: 18, coingeckoId: "frax-share" },
  "0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b": { symbol: "CVX", decimals: 18, coingeckoId: "convex-finance" },
  "0xdbdb4d16eda451d0503b854cf79d55697f90c8df": { symbol: "ALCX", decimals: 18, coingeckoId: "alchemix" },
  "0x6810e776880c02933d47db1b9fc05908e5386b96": { symbol: "GNO", decimals: 18, coingeckoId: "gnosis" },
  "0xc221b7e65ffc80de234bbb6667abdd46593d34f0": { symbol: "wCFG", decimals: 18, coingeckoId: "wrapped-centrifuge" },
  "0xf57e7e7c23978c3caec3c3548e3d615c346e79ff": { symbol: "IMX", decimals: 18, coingeckoId: "immutable-x" },
  
  // More DeFi
  "0x0391d2021f89dc339f60fff84546ea23e337750f": { symbol: "BOND", decimals: 18, coingeckoId: "barnbridge" },
  "0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b": { symbol: "DPI", decimals: 18, coingeckoId: "defipulse-index" },
  "0x0954906da0bf32d5479e25f46056d22f08464cab": { symbol: "INDEX", decimals: 18, coingeckoId: "index-cooperative" },
  "0x6f40d4a6237c257fff2db00fa0510deeecd303eb": { symbol: "INST", decimals: 18, coingeckoId: "instadapp" },
  "0x090185f2135308bad17527004364ebcc2d37e5f6": { symbol: "SPELL", decimals: 18, coingeckoId: "spell-token" },
  "0x04fa0d235c4abf4bcf4787af4cf447de572ef828": { symbol: "UMA", decimals: 18, coingeckoId: "uma" },
  "0xba11d00c5f74255f56a5e366f4f77f5a186d7f55": { symbol: "BAND", decimals: 18, coingeckoId: "band-protocol" },
  "0x8207c1ffc5b6804f6024322ccf34f29c3541ae26": { symbol: "OGN", decimals: 18, coingeckoId: "origin-protocol" },
  "0x6de037ef9ad2725eb40118bb1702ebb27e4aeb24": { symbol: "RNDR", decimals: 18, coingeckoId: "render-token" },
  "0xfb7b4564402e5500db5bb6d63ae671302777c75a": { symbol: "DEXT", decimals: 18, coingeckoId: "dextools" },
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
