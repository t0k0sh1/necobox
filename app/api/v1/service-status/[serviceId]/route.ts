import { fetchServiceStatus } from "@/lib/utils/service-status";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // キャッシュ無効化（手動リフレッシュのため）

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const { serviceId } = await params;
    const status = await fetchServiceStatus(serviceId);

    if (!status) {
      return NextResponse.json(
        { error: "サービスが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ status });
  } catch (error) {
    console.error("Service status API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "ステータスの取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
