import { generatePassword } from "@/lib/utils/generate";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const options = {
      uppercase: body.uppercase,
      lowercase: body.lowercase,
      numbers: body.numbers,
      symbols: body.symbols,
      symbolsSelection: body.symbolsSelection,
      spaces: body.spaces ?? false,
      unicode: body.unicode ?? false,
      length: body.length,
      excludeSimilar: body.excludeSimilar,
      noRepeat: body.noRepeat,
    };

    const count = body.count || 1;
    const passwords = Array.from({ length: count }, () =>
      generatePassword(options)
    );

    return NextResponse.json({
      passwords,
      settings: body,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}
