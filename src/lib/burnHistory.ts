import { createPublicClient, http, parseAbiItem, formatUnits, getAddress, type AbiEvent, type Address, type Log } from "viem";
import { mainnet } from "viem/chains";
import { FIREPIT_ADDRESS, UNI_TOKEN_ADDRESS, BURN_ADDRESS } from "./constants";
import { serverCache, CACHE_KEYS, CACHE_TTL } from "./cache";

// Type for ERC-20 Transfer event args
interface TransferEventArgs {
  from: Address;
  to: Address;
  value: bigint;
}

// Type for Transfer event logs
type TransferLog = Log<bigint, number, false> & {
  args: TransferEventArgs;
};

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

const MAX_BLOCKS_PER_QUERY = 50_000n;

async function fetchLogsInChunks({
  client,
  address,
  event,
  args,
  fromBlock,
  toBlock,
  label,
}: {
  client: ReturnType<typeof createPublicClient>;
  address: Address;
  event: AbiEvent;
  args: { to: Address };
  fromBlock: bigint;
  toBlock: bigint;
  label: string;
}): Promise<TransferLog[]> {
  const logs: TransferLog[] = [];
  for (let start = fromBlock; start <= toBlock; start += MAX_BLOCKS_PER_QUERY + 1n) {
    const end = start + MAX_BLOCKS_PER_QUERY > toBlock ? toBlock : start + MAX_BLOCKS_PER_QUERY;
    console.log(`[BurnHistory] Fetching ${label} logs from block ${start} to ${end}`);
    const chunk = await client.getLogs({
      address,
      event,
      args,
      fromBlock: start,
      toBlock: end,
    });
    // Cast to TransferLog since we know the event type
    logs.push(...(chunk as unknown as TransferLog[]));
  }
  return logs;
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

    // Look back ~2 years to ensure we capture early burns.
    const lookbackBlocks = 5_000_000n;
    const fromBlock = currentBlock > lookbackBlocks ? currentBlock - lookbackBlocks : 0n;
    console.log(`[BurnHistory] Searching from block ${fromBlock} to ${currentBlock}`);

    const transferEvent = parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ) as AbiEvent;

    // Normalize addresses to checksum format for reliable matching
    const uniTokenAddress = getAddress(UNI_TOKEN_ADDRESS);
    const firepitAddress = getAddress(FIREPIT_ADDRESS);
    const burnAddress = getAddress(BURN_ADDRESS);

    console.log(`[BurnHistory] Using addresses: UNI=${uniTokenAddress}, Firepit=${firepitAddress}, Burn=${burnAddress}`);

    // Search for UNI transfers to Firepit
    console.log(`[BurnHistory] Searching for UNI transfers to Firepit: ${firepitAddress}`);
    const firepitLogs = await fetchLogsInChunks({
      client,
      address: uniTokenAddress,
      event: transferEvent,
      args: { to: firepitAddress },
      fromBlock,
      toBlock: currentBlock,
      label: "Firepit",
    });
    console.log(`[BurnHistory] Found ${firepitLogs.length} transfers to Firepit`);

    // Also search for UNI transfers to 0xdead (the actual burn destination)
    console.log(`[BurnHistory] Searching for UNI transfers to dead address: ${burnAddress}`);
    const deadLogs = await fetchLogsInChunks({
      client,
      address: uniTokenAddress,
      event: transferEvent,
      args: { to: burnAddress },
      fromBlock,
      toBlock: currentBlock,
      label: "Burn",
    });
    console.log(`[BurnHistory] Found ${deadLogs.length} transfers to dead address`);

    // Combine logs - use transfers to 0xdead as the primary source (actual burns)
    // but also include Firepit transfers in case mechanism changes
    const seenTxHashes = new Set<string>();
    const allLogs: TransferLog[] = [...deadLogs, ...firepitLogs];
    const logs = allLogs.filter(log => {
      if (seenTxHashes.has(log.transactionHash)) return false;
      seenTxHashes.add(log.transactionHash);
      return true;
    });
    console.log(`[BurnHistory] Total unique burn transactions: ${logs.length}`);

    // Process logs into burn events
    const burns: BurnEvent[] = [];
    let totalBurnedWei = 0n;

    for (const log of logs) {
      // Only require value - from might be undefined in some edge cases
      if (!log.args.value) continue;

      const value = log.args.value;
      totalBurnedWei += value;

      // Use from address if available, otherwise use "Unknown"
      const burnerAddress = log.args.from || "0x0000000000000000000000000000000000000000";

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
        burner: burnerAddress,
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
