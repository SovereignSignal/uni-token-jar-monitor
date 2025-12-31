import { NextResponse } from "next/server";
import { getBurnHistory, type BurnHistory } from "@/lib/burnHistory";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface BurnHistoryApiResponse {
  success: boolean;
  data?: BurnHistory;
  error?: string;
}

export async function GET(): Promise<NextResponse<BurnHistoryApiResponse>> {
  try {
    const burnHistory = await getBurnHistory();

    return NextResponse.json({
      success: true,
      data: burnHistory,
    });
  } catch (error) {
    console.error("Burn history API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
