import { fetchServiceStatus } from "@/lib/utils/service-status";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // キャッシュ無効化（手動リフレッシュのため）

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const { serviceId } = await params;
    const status = await fetchServiceStatus(serviceId);

    if (!status) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ status });
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
