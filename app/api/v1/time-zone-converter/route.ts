import {
  convertTimeZone,
  getAvailableTimeZonesWithInfo,
  type TimeZoneConverterOptions,
} from "@/lib/utils/time-zone-converter";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Convert timezone (validation is done inside convertTimeZone)
    const result = convertTimeZone(body);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Distinguish between validation errors (client errors) and server errors
    if (error instanceof Error) {
      // Validation errors thrown by convertTimeZone are client errors
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected internal error occurred",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const timeZones = getAvailableTimeZonesWithInfo();

    return NextResponse.json({
      success: true,
      data: {
        timeZones,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal error",
      },
      { status: 500 }
    );
  }
}
