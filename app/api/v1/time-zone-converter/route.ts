import {
  convertTimeZone,
  getAvailableTimeZonesWithInfo,
  type TimeZoneConverterOptions,
} from "@/lib/utils/time-zone-converter";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Convert timezone
    const result = convertTimeZone(validation.data!);

    return NextResponse.json({
      success: true,
      data: result,
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

function validateRequest(body: unknown): {
  valid: boolean;
  error?: string;
  data?: TimeZoneConverterOptions;
} {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const {
    year,
    month,
    day,
    hour,
    minute,
    fromTimeZone,
    toTimeZone,
  } = body as Record<string, unknown>;

  if (
    typeof year !== "number" ||
    typeof month !== "number" ||
    typeof day !== "number" ||
    typeof hour !== "number" ||
    typeof minute !== "number"
  ) {
    return { valid: false, error: "Invalid date/time parameters" };
  }

  if (typeof fromTimeZone !== "string" || typeof toTimeZone !== "string") {
    return { valid: false, error: "Invalid timezone parameters" };
  }

  if (month < 1 || month > 12) {
    return { valid: false, error: "Month must be between 1 and 12" };
  }

  if (day < 1 || day > 31) {
    return { valid: false, error: "Day must be between 1 and 31" };
  }

  if (hour < 0 || hour > 23) {
    return { valid: false, error: "Hour must be between 0 and 23" };
  }

  if (minute < 0 || minute > 59) {
    return { valid: false, error: "Minute must be between 0 and 59" };
  }

  return {
    valid: true,
    data: {
      year,
      month,
      day,
      hour,
      minute,
      fromTimeZone,
      toTimeZone,
    },
  };
}
