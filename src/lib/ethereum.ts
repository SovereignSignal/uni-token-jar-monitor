import { createPublicClient, http, type Address, formatUnits } from "viem";
import { mainnet } from "viem/chains";
import {
  TOKENJAR_ADDRESS,
  ERC20_ABI,
  KNOWN_TOKENS,
} from "./constants";

// Create Ethereum client - prefer Alchemy if available
function getClient() {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  if (alchemyKey) {
    console.log("Using Alchemy RPC");
    return createPublicClient({
      chain: mainnet,
      transport: http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`),
    });
  }

  // Fallback to free RPC
  console.log("Using free RPC (llamarpc)");
  return createPublicClient({
    chain: mainnet,
    transport: http("https://eth.llamarpc.com"),
  });
}

export interface TokenBalance {
  address: Address;
  symbol: string;
  decimals: number;
  balance: bigint;
  balanceFormatted: string;
}

// Cache for token balances
let tokenBalancesCache: TokenBalance[] | null = null;
let balancesCacheTimestamp = 0;
const BALANCES_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface AlchemyTokenBalance {
  contractAddress: string;
  tokenBalance: string;
}

interface AlchemyTokenBalancesResponse {
  jsonrpc: string;
  id: number;
  result: {
    address: string;
    tokenBalances: AlchemyTokenBalance[];
  };
}

interface AlchemyTokenMetadata {
  decimals: number;
  logo: string | null;
  name: string;
  symbol: string;
}

/**
 * Fetch all token balances using Alchemy's getTokenBalances API
 * This returns ALL tokens held by the address in a single call
 */
async function fetchTokenBalancesFromAlchemy(): Promise<TokenBalance[]> {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  if (!alchemyKey) {
    console.log("No Alchemy API key, skipping Alchemy token fetch");
    return [];
  }

  const balances: TokenBalance[] = [];

  try {
    // Step 1: Get all token balances
    const balancesResponse = await fetch(
      `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "alchemy_getTokenBalances",
          params: [TOKENJAR_ADDRESS, "erc20"],
          id: 1,
        }),
      }
    );

    const balancesData: AlchemyTokenBalancesResponse = await balancesResponse.json();
    
    if (!balancesData.result?.tokenBalances) {
      console.error("No token balances in Alchemy response");
      return [];
    }

    // Filter out zero balances
    const nonZeroBalances = balancesData.result.tokenBalances.filter(
      (tb) => tb.tokenBalance && tb.tokenBalance !== "0x0" && tb.tokenBalance !== "0x"
    );

    console.log(`Alchemy found ${nonZeroBalances.length} tokens with non-zero balances`);

    // Step 2: Get metadata for each token (batch in groups of 100)
    const batchSize = 100;
    for (let i = 0; i < nonZeroBalances.length; i += batchSize) {
      const batch = nonZeroBalances.slice(i, i + batchSize);
      
      const metadataPromises = batch.map(async (tb) => {
        const tokenAddress = tb.contractAddress.toLowerCase() as Address;
        const balanceHex = tb.tokenBalance;
        
        // Check known tokens first
        const known = KNOWN_TOKENS[tokenAddress];
        if (known) {
          const balance = BigInt(balanceHex);
          return {
            address: tokenAddress,
            symbol: known.symbol,
            decimals: known.decimals,
            balance,
            balanceFormatted: formatUnits(balance, known.decimals),
          };
        }

        // Fetch metadata from Alchemy
        try {
          const metaResponse = await fetch(
            `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0",
                method: "alchemy_getTokenMetadata",
                params: [tokenAddress],
                id: 1,
              }),
            }
          );

          const metaData = await metaResponse.json();
          const metadata: AlchemyTokenMetadata = metaData.result;

          if (metadata && metadata.decimals !== null) {
            const balance = BigInt(balanceHex);
            return {
              address: tokenAddress,
              symbol: metadata.symbol || "UNKNOWN",
              decimals: metadata.decimals,
              balance,
              balanceFormatted: formatUnits(balance, metadata.decimals),
            };
          }
        } catch (error) {
          console.error(`Failed to get metadata for ${tokenAddress}:`, error);
        }

        // Fallback: assume 18 decimals
        const balance = BigInt(balanceHex);
        return {
          address: tokenAddress,
          symbol: "UNKNOWN",
          decimals: 18,
          balance,
          balanceFormatted: formatUnits(balance, 18),
        };
      });

      const batchResults = await Promise.all(metadataPromises);
      balances.push(...batchResults);
    }

    return balances;
  } catch (error) {
    console.error("Error fetching from Alchemy:", error);
    return [];
  }
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
    console.error(`Failed to get metadata for ${tokenAddress}:`, error);
    return { symbol: "UNKNOWN", decimals: 18 };
  }
}

/**
 * Fetch all token balances held by the TokenJar
 */
export async function getTokenJarBalances(): Promise<TokenBalance[]> {
  const now = Date.now();

  // Return cached balances if still valid
  if (tokenBalancesCache && now - balancesCacheTimestamp < BALANCES_CACHE_TTL_MS) {
    console.log("Returning cached token balances");
    return tokenBalancesCache;
  }

  // Try Alchemy first (most comprehensive)
  const alchemyBalances = await fetchTokenBalancesFromAlchemy();
  
  if (alchemyBalances.length > 0) {
    console.log(`Got ${alchemyBalances.length} token balances from Alchemy`);
    tokenBalancesCache = alchemyBalances;
    balancesCacheTimestamp = now;
    return alchemyBalances;
  }

  // Fallback: fetch balances for known tokens only
  console.log("Falling back to known tokens only");
  const client = getClient();
  const balances: TokenBalance[] = [];

  const knownAddresses = Object.keys(KNOWN_TOKENS);
  const batchSize = 20;

  for (let i = 0; i < knownAddresses.length; i += batchSize) {
    const batch = knownAddresses.slice(i, i + batchSize);

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

  console.log(`Found ${balances.length} tokens with non-zero balances (fallback mode)`);
  tokenBalancesCache = balances;
  balancesCacheTimestamp = now;
  
  return balances;
}

/**
 * Force refresh the token balances cache
 */
export function invalidateTokenCache(): void {
  tokenBalancesCache = null;
  balancesCacheTimestamp = 0;
}

/**
 * Get the RPC data source name for display
 */
export function getDataSource(): string {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  return alchemyKey ? "alchemy.com" : "llamarpc.com";
}
