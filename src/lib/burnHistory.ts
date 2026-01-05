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
  initiator?: string; // tx.from (can differ from burner for contract-based txs)
  gasUsed?: string;
  gasPriceWei?: string;
  status?: "success" | "reverted";
  destinations?: Array<"firepit" | "dead">;
  valueUsdAtTime?: number; // Estimated value at time of burn (if available)
}

export interface BurnHistory {
  burns: BurnEvent[];
  totalBurned: string; // Total UNI burned
  lastUpdated: number;
}

<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
const UNI_DECIMALS = 18;
const MAX_BURNS_RETURNED = 200;
const MAX_TX_ENRICH = 75;
>>>>>>> Stashed changes
=======
const UNI_DECIMALS = 18;
const MAX_BURNS_RETURNED = 200;
const MAX_TX_ENRICH = 75;
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
=======
>>>>>>> Stashed changes
    // Build per-tx view. Prefer Firepit transfer for burner attribution (log.from is the user)
    // and use dead address as a signal that a real burn to 0xdead occurred.
    const byTxHash = new Map<
      string,
      {
        firepitLog?: (typeof firepitLogs)[number];
        deadLog?: (typeof deadLogs)[number];
      }
    >();
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

    for (const log of firepitLogs) {
      const entry = byTxHash.get(log.transactionHash) || {};
      entry.firepitLog = log;
      byTxHash.set(log.transactionHash, entry);
    }
    for (const log of deadLogs) {
      const entry = byTxHash.get(log.transactionHash) || {};
      entry.deadLog = log;
      byTxHash.set(log.transactionHash, entry);
    }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
    for (const log of logs) {
      // Only require value - from might be undefined in some edge cases
      if (!log.args.value) continue;
=======
    console.log(`[BurnHistory] Total unique burn transactions: ${byTxHash.size}`);
>>>>>>> Stashed changes
=======
    console.log(`[BurnHistory] Total unique burn transactions: ${byTxHash.size}`);
>>>>>>> Stashed changes

    const blockTimestampCache = new Map<bigint, number>();
    async function getBlockTimestamp(blockNumber: bigint): Promise<number> {
      const cachedTs = blockTimestampCache.get(blockNumber);
      if (cachedTs !== undefined) return cachedTs;
<<<<<<< Updated upstream

<<<<<<< Updated upstream
      // Use from address if available, otherwise use "Unknown"
      const burnerAddress = log.args.from || "0x0000000000000000000000000000000000000000";

      // Get block timestamp
      let timestamp = Date.now() / 1000;
=======
>>>>>>> Stashed changes
=======

>>>>>>> Stashed changes
      try {
        const block = await client.getBlock({ blockNumber });
        const ts = Number(block.timestamp);
        blockTimestampCache.set(blockNumber, ts);
        return ts;
      } catch {
        // Use approximate timestamp based on block number
        const blocksAgo = Number(currentBlock - blockNumber);
        const ts = Math.floor(Date.now() / 1000) - blocksAgo * 12;
        blockTimestampCache.set(blockNumber, ts);
        return ts;
      }
    }

    // Build burn events (capped for return) while still computing total burned across all txs
    const entries = Array.from(byTxHash.entries()).map(([txHash, entry]) => {
      const primaryLog = entry.firepitLog || entry.deadLog;
      return { txHash, entry, primaryLog };
    });

    // Sort by most recent block number first
    entries.sort((a, b) => Number(b.primaryLog?.blockNumber || 0n) - Number(a.primaryLog?.blockNumber || 0n));

    let totalBurnedWei = 0n;
    const burns: BurnEvent[] = [];

    for (const item of entries) {
      const primaryLog = item.primaryLog;
      if (!primaryLog?.args.value || !primaryLog?.args.from) continue;

      const value = primaryLog.args.value;
      totalBurnedWei += value;

      if (burns.length >= MAX_BURNS_RETURNED) continue;

      const timestamp = await getBlockTimestamp(primaryLog.blockNumber);
      const destinations: Array<"firepit" | "dead"> = [];
      if (item.entry.firepitLog) destinations.push("firepit");
      if (item.entry.deadLog) destinations.push("dead");

      burns.push({
        txHash: item.txHash,
        blockNumber: Number(primaryLog.blockNumber),
        timestamp,
        uniAmount: formatUnits(value, UNI_DECIMALS),
        uniAmountRaw: value.toString(),
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        burner: burnerAddress,
=======
        burner: primaryLog.args.from,
        destinations,
>>>>>>> Stashed changes
=======
        burner: primaryLog.args.from,
        destinations,
>>>>>>> Stashed changes
      });
    }

    // Sort by timestamp descending (most recent first)
    burns.sort((a, b) => b.timestamp - a.timestamp);

    // Enrich most recent burns with tx context (initiator, gas, status)
    const enrichTargets = burns.slice(0, MAX_TX_ENRICH);
    await Promise.all(
      enrichTargets.map(async (burn) => {
        try {
          const hash = burn.txHash as `0x${string}`;
          const [tx, receipt] = await Promise.all([
            client.getTransaction({ hash }),
            client.getTransactionReceipt({ hash }),
          ]);

          burn.initiator = tx.from;
          burn.gasUsed = receipt.gasUsed.toString();
          burn.gasPriceWei = (receipt.effectiveGasPrice ?? tx.gasPrice)?.toString();
          burn.status = receipt.status;
        } catch (error) {
          console.warn(`[BurnHistory] Failed to enrich tx ${burn.txHash}:`, error);
        }
      })
    );

    const result: BurnHistory = {
      burns,
      totalBurned: formatUnits(totalBurnedWei, UNI_DECIMALS),
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
