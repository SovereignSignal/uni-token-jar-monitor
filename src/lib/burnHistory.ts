import { createPublicClient, http, parseAbiItem, formatUnits, type Address } from "viem";
import { mainnet } from "viem/chains";
import { FIREPIT_ADDRESS, UNI_TOKEN_ADDRESS, BURN_ADDRESS } from "./constants";
import { serverCache, CACHE_KEYS, CACHE_TTL } from "./cache";

// Use Alchemy if available, fallback to LlamaRPC
function getClient() {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  if (alchemyKey) {
    return createPublicClient({
      chain: mainnet,
      transport: http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`),
    });
  }
  return createPublicClient({
    chain: mainnet,
    transport: http("https://eth.llamarpc.com"),
  });
}

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
 * Fetch burn history by looking at Transfer events to the Firepit and 0xdead
 * The Firepit receives UNI tokens when burns are executed, then forwards to 0xdead
 * We check both destinations to catch all burn events
 */
export async function getBurnHistory(): Promise<BurnHistory> {
  // Check cache first
  const cached = serverCache.get<BurnHistory>(CACHE_KEYS.BURN_HISTORY);
  if (cached && !serverCache.isExpired(CACHE_KEYS.BURN_HISTORY)) {
    console.log("[BurnHistory] Returning cached data");
    return cached.data;
  }

  const client = getClient();

  try {
    const currentBlock = await client.getBlockNumber();
    console.log(`[BurnHistory] Current block: ${currentBlock}`);

    // Look back ~70 days - fee switch activated around Dec 27, 2025
    const lookbackBlocks = 500_000n;
    const fromBlock = currentBlock - lookbackBlocks;
    console.log(`[BurnHistory] Searching from block ${fromBlock} to ${currentBlock}`);

    const transferEvent = parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    );

    // Search for UNI transfers to Firepit
    console.log(`[BurnHistory] Searching for UNI transfers to Firepit: ${FIREPIT_ADDRESS}`);
    const firepitLogs = await client.getLogs({
      address: UNI_TOKEN_ADDRESS as Address,
      event: transferEvent,
      args: {
        to: FIREPIT_ADDRESS as Address,
      },
      fromBlock,
      toBlock: currentBlock,
    });
    console.log(`[BurnHistory] Found ${firepitLogs.length} transfers to Firepit`);

    // Also search for UNI transfers to 0xdead (the actual burn destination)
    console.log(`[BurnHistory] Searching for UNI transfers to dead address: ${BURN_ADDRESS}`);
    const deadLogs = await client.getLogs({
      address: UNI_TOKEN_ADDRESS as Address,
      event: transferEvent,
      args: {
        to: BURN_ADDRESS as Address,
      },
      fromBlock,
      toBlock: currentBlock,
    });
    console.log(`[BurnHistory] Found ${deadLogs.length} transfers to dead address`);

    // Combine logs - use transfers to 0xdead as the primary source (actual burns)
    // but also include Firepit transfers in case mechanism changes
    const seenTxHashes = new Set<string>();
    const logs = [...deadLogs, ...firepitLogs].filter(log => {
      if (seenTxHashes.has(log.transactionHash)) return false;
      seenTxHashes.add(log.transactionHash);
      return true;
    });
    console.log(`[BurnHistory] Total unique burn transactions: ${logs.length}`);

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
    console.error("[BurnHistory] Failed to fetch burn history:", error);

    // Return cached data if available, even if stale
    if (cached) {
      console.log("[BurnHistory] Returning stale cached data due to error");
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
