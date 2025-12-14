import { fetchAllServiceStatuses } from "@/lib/utils/service-status";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // キャッシュ無効化（手動リフレッシュのため）

export async function GET() {
  try {
    const statuses = await fetchAllServiceStatuses();
    return NextResponse.json({ statuses });
  } catch (error) {
    console.error("Service status API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch service status",
      },
      { status: 500 }
    );
  }
}
