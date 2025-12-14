import { getIPInfo } from "@/lib/utils/ip-info";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = body.input?.trim();

    if (!input) {
      return NextResponse.json(
        { error: "IPアドレスまたはホスト名を入力してください" },
        { status: 400 }
      );
    }

    const result = await getIPInfo(input);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("IP info API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "情報の取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
