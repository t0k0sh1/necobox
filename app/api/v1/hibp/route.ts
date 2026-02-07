import { NextRequest, NextResponse } from "next/server";

const HIBP_API_BASE = "https://api.pwnedpasswords.com/range";
// 5文字の16進数のみ許可
const PREFIX_REGEX = /^[0-9a-fA-F]{5}$/;

export async function GET(request: NextRequest) {
  const prefix = request.nextUrl.searchParams.get("prefix");

  if (!prefix || !PREFIX_REGEX.test(prefix)) {
    return NextResponse.json(
      { error: "Invalid prefix. Must be exactly 5 hexadecimal characters." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${HIBP_API_BASE}/${prefix}`, {
      headers: {
        "Add-Padding": "true",
        "User-Agent": "NecoBox-PasswordChecker",
      },
      next: { revalidate: 300 }, // 5分キャッシュ
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "HIBP API request failed" },
        { status: response.status }
      );
    }

    const text = await response.text();

    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch from HIBP API" },
      { status: 500 }
    );
  }
}
