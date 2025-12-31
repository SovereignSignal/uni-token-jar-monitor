import { createPublicClient, http, parseAbiItem, formatUnits, type Address } from "viem";
import { mainnet } from "viem/chains";
import { FIREPIT_ADDRESS, UNI_TOKEN_ADDRESS } from "./constants";
import { serverCache, CACHE_KEYS, CACHE_TTL } from "./cache";

// Free RPC for burn history queries
const client = createPublicClient({
  chain: mainnet,
  transport: http("https://eth.llamarpc.com"),
});

export interface BurnEvent {
  txHash: string;
  blockNumber: number;
  timestamp: number; // Unix timestamp
  uniAmount: string; // Formatted UNI amount
  uniAmountRaw: string;
  burner: string; // Address that triggered the burn
  valueUsdAtTime?: number; // Estimated value at time of burn (if available)
}

export interface BurnHistory {
  burns: BurnEvent[];
  totalBurned: string; // Total UNI burned
  lastUpdated: number;
}

/**
 * Fetch burn history by looking at Transfer events to the Firepit (burn address)
 * The Firepit receives UNI tokens when burns are executed
 */
export async function getBurnHistory(): Promise<BurnHistory> {
  // Check cache first
  const cached = serverCache.get<BurnHistory>(CACHE_KEYS.BURN_HISTORY);
  if (cached && !serverCache.isExpired(CACHE_KEYS.BURN_HISTORY)) {
    return cached.data;
  }

  try {
    // Look for Transfer events of UNI token to the Firepit address
    // This indicates a burn event
    const currentBlock = await client.getBlockNumber();
    const lookbackBlocks = 500_000n; // ~70 days
    const fromBlock = currentBlock - lookbackBlocks;

    // Get Transfer events where UNI is sent to Firepit
    const transferEvent = parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    );

    const logs = await client.getLogs({
      address: UNI_TOKEN_ADDRESS as Address,
      event: transferEvent,
      args: {
        to: FIREPIT_ADDRESS as Address,
      },
      fromBlock,
      toBlock: currentBlock,
    });

    // Process logs into burn events
    const burns: BurnEvent[] = [];
    let totalBurnedWei = 0n;

    for (const log of logs) {
      if (!log.args.value || !log.args.from) continue;

      const value = log.args.value;
      totalBurnedWei += value;

      // Get block timestamp
      let timestamp = Date.now() / 1000;
      try {
        const block = await client.getBlock({ blockNumber: log.blockNumber });
        timestamp = Number(block.timestamp);
      } catch {
        // Use approximate timestamp based on block number
        const blocksAgo = Number(currentBlock - log.blockNumber);
        timestamp = Math.floor(Date.now() / 1000) - blocksAgo * 12;
      }

      burns.push({
        txHash: log.transactionHash,
        blockNumber: Number(log.blockNumber),
        timestamp,
        uniAmount: formatUnits(value, 18),
        uniAmountRaw: value.toString(),
        burner: log.args.from,
      });
    }

    // Sort by timestamp descending (most recent first)
    burns.sort((a, b) => b.timestamp - a.timestamp);

    const result: BurnHistory = {
      burns,
      totalBurned: formatUnits(totalBurnedWei, 18),
      lastUpdated: Date.now(),
    };

    // Cache the result
    serverCache.set(CACHE_KEYS.BURN_HISTORY, result, CACHE_TTL.BURN_HISTORY);

    return result;
  } catch (error) {
    console.error("Failed to fetch burn history:", error);

    // Return cached data if available, even if stale
    if (cached) {
      return cached.data;
    }

    // Return empty history on error
    return {
      burns: [],
      totalBurned: "0",
      lastUpdated: Date.now(),
    };
  }
}

/**
 * Format a burn event for display
 */
export function formatBurnEvent(burn: BurnEvent): {
  date: string;
  amount: string;
  txLink: string;
  burnerShort: string;
} {
  const date = new Date(burn.timestamp * 1000);
  const amount = parseFloat(burn.uniAmount).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });

  return {
    date: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    amount: `${amount} UNI`,
    txLink: `https://etherscan.io/tx/${burn.txHash}`,
    burnerShort: `${burn.burner.slice(0, 6)}...${burn.burner.slice(-4)}`,
  };
}
