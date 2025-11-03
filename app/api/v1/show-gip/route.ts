import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const h = await headers();
    let ip =
      h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "::1";

    if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") {
      ip = "127.0.0.1";
    }
    return NextResponse.json({ ip });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get IP" },
      { status: 500 }
    );
  }
}
