import { createPublicClient, http, parseAbiItem, type Address, formatUnits } from "viem";
import { mainnet } from "viem/chains";
import {
  TOKENJAR_ADDRESS,
  ERC20_ABI,
  KNOWN_TOKENS,
  TOKEN_DISCOVERY_LOOKBACK_BLOCKS,
} from "./constants";

// Create Ethereum client
function getClient() {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    throw new Error("ALCHEMY_API_KEY environment variable is required");
  }

  return createPublicClient({
    chain: mainnet,
    transport: http(`https://eth-mainnet.g.alchemy.com/v2/${apiKey}`),
  });
}

export interface TokenBalance {
  address: Address;
  symbol: string;
  decimals: number;
  balance: bigint;
  balanceFormatted: string;
  coingeckoId?: string;
}

// Cache for discovered tokens (in-memory, resets on server restart)
let discoveredTokensCache: Set<Address> | null = null;
let tokensCacheTimestamp = 0;
const TOKENS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Discover tokens that have been transferred to the TokenJar
 * by scanning Transfer event logs
 */
async function discoverTokens(): Promise<Set<Address>> {
  const now = Date.now();

  // Return cached tokens if still valid
  if (discoveredTokensCache && now - tokensCacheTimestamp < TOKENS_CACHE_TTL_MS) {
    return discoveredTokensCache;
  }

  const client = getClient();
  const currentBlock = await client.getBlockNumber();
  const fromBlock = currentBlock - TOKEN_DISCOVERY_LOOKBACK_BLOCKS;

  // Start with known tokens
  const tokens = new Set<Address>(
    Object.keys(KNOWN_TOKENS).map((addr) => addr.toLowerCase() as Address)
  );

  try {
    // Get Transfer events TO the TokenJar
    const logs = await client.getLogs({
      event: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)"),
      args: {
        to: TOKENJAR_ADDRESS,
      },
      fromBlock: fromBlock > 0n ? fromBlock : 0n,
      toBlock: currentBlock,
    });

    // Extract unique token addresses (the contract that emitted the event)
    for (const log of logs) {
      tokens.add(log.address.toLowerCase() as Address);
    }
  } catch (error) {
    console.error("Error discovering tokens via events:", error);
    // Fall back to known tokens only
  }

  discoveredTokensCache = tokens;
  tokensCacheTimestamp = now;

  return tokens;
}

/**
 * Get token metadata (symbol, decimals) with fallback to known tokens
 */
async function getTokenMetadata(
  client: ReturnType<typeof getClient>,
  tokenAddress: Address
): Promise<{ symbol: string; decimals: number; coingeckoId?: string }> {
  const normalizedAddress = tokenAddress.toLowerCase();

  // Check known tokens first
  const known = KNOWN_TOKENS[tokenAddress] || KNOWN_TOKENS[normalizedAddress];
  if (known) {
    return known;
  }

  // Try to fetch from contract
  try {
    const [symbol, decimals] = await Promise.all([
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "symbol",
      }),
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "decimals",
      }),
    ]);

    return { symbol: symbol as string, decimals: Number(decimals) };
  } catch (error) {
    // Some tokens have non-standard implementations
    console.error(`Failed to get metadata for ${tokenAddress}:`, error);
    return { symbol: "UNKNOWN", decimals: 18 };
  }
}

/**
 * Fetch all token balances held by the TokenJar
 */
export async function getTokenJarBalances(): Promise<TokenBalance[]> {
  const client = getClient();

  // Discover all tokens
  const tokenAddresses = await discoverTokens();

  // Fetch balances in parallel (batch of 20 to avoid rate limits)
  const balances: TokenBalance[] = [];
  const addressArray = Array.from(tokenAddresses);
  const batchSize = 20;

  for (let i = 0; i < addressArray.length; i += batchSize) {
    const batch = addressArray.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (tokenAddress) => {
        try {
          const balance = await client.readContract({
            address: tokenAddress as Address,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [TOKENJAR_ADDRESS],
          });

          if (balance === 0n) {
            return null;
          }

          const metadata = await getTokenMetadata(client, tokenAddress as Address);

          return {
            address: tokenAddress as Address,
            symbol: metadata.symbol,
            decimals: metadata.decimals,
            balance: balance as bigint,
            balanceFormatted: formatUnits(balance as bigint, metadata.decimals),
            coingeckoId: metadata.coingeckoId,
          };
        } catch (error) {
          console.error(`Failed to fetch balance for ${tokenAddress}:`, error);
          return null;
        }
      })
    );

    for (const result of batchResults) {
      if (result !== null) {
        balances.push(result);
      }
    }
  }

  return balances;
}

/**
 * Force refresh the token discovery cache
 */
export function invalidateTokenCache(): void {
  discoveredTokensCache = null;
  tokensCacheTimestamp = 0;
}
