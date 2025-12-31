import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface HealthCheck {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  env: {
    hasAlchemyKey: boolean;
    alchemyKeyLength: number;
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

async function checkAlchemy(): Promise<{ status: string; latencyMs?: number; error?: string }> {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  if (!alchemyKey) {
    return { status: "skipped", error: "No ALCHEMY_API_KEY set" };
  }

  const start = Date.now();
  try {
    const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      }),
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      return { status: "error", latencyMs, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    if (data.error) {
      return { status: "error", latencyMs, error: data.error.message };
    }

    return { status: "ok", latencyMs };
  } catch (error) {
    return { status: "error", latencyMs: Date.now() - start, error: String(error) };
  }
}

async function checkDeFiLlama(): Promise<{ status: string; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    // Test with a known token (WETH)
    const response = await fetch(
      "https://coins.llama.fi/prices/current/ethereum:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
    );

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      return { status: "error", latencyMs, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    if (!data.coins || Object.keys(data.coins).length === 0) {
      return { status: "error", latencyMs, error: "No price data returned" };
    }

    return { status: "ok", latencyMs };
  } catch (error) {
    return { status: "error", latencyMs: Date.now() - start, error: String(error) };
  }
}

async function checkLlamaRpc(): Promise<{ status: string; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    const response = await fetch("https://eth.llamarpc.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      }),
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      return { status: "error", latencyMs, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    if (data.error) {
      return { status: "error", latencyMs, error: data.error.message };
    }

    return { status: "ok", latencyMs };
  } catch (error) {
    return { status: "error", latencyMs: Date.now() - start, error: String(error) };
  }
}

async function checkDune(): Promise<{ status: string; latencyMs?: number; error?: string }> {
  const duneKey = process.env.DUNE_API_KEY;
  if (!duneKey) {
    return { status: "skipped", error: "No DUNE_API_KEY set" };
  }

  const start = Date.now();
  try {
    // Test with a simple API call to check auth
    const response = await fetch("https://api.dune.com/api/v1/query/6432620/results?limit=1", {
      headers: {
        "X-Dune-API-Key": duneKey,
      },
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      const errorText = await response.text();
      return { status: "error", latencyMs, error: `HTTP ${response.status}: ${errorText.slice(0, 100)}` };
    }

    return { status: "ok", latencyMs };
  } catch (error) {
    return { status: "error", latencyMs: Date.now() - start, error: String(error) };
  }
}

export async function GET(): Promise<NextResponse<HealthCheck>> {
  const [alchemy, defiLlama, llamaRpc, dune] = await Promise.all([
    checkAlchemy(),
    checkDeFiLlama(),
    checkLlamaRpc(),
    checkDune(),
  ]);

  const alchemyKey = process.env.ALCHEMY_API_KEY || "";

  // Core services (Alchemy, DeFiLlama, LlamaRpc) determine overall status
  // Dune is optional enhancement
  const coreOk = alchemy.status === "ok" && defiLlama.status === "ok" && llamaRpc.status === "ok";
  const coreError = alchemy.status === "error" || defiLlama.status === "error" || llamaRpc.status === "error";

  const health: HealthCheck = {
    status: coreOk ? "ok" : coreError ? "degraded" : "ok",
    timestamp: new Date().toISOString(),
    env: {
      hasAlchemyKey: !!process.env.ALCHEMY_API_KEY,
      alchemyKeyLength: alchemyKey.length,
      hasDuneKey: !!process.env.DUNE_API_KEY,
      nodeEnv: process.env.NODE_ENV || "unknown",
    },
    checks: {
      alchemy,
      defiLlama,
      llamaRpc,
      dune,
    },
  };

  return NextResponse.json(health);
}
