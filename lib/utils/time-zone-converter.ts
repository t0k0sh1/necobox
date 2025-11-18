export interface TimeZoneConverterOptions {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number; // 0-59
  fromTimeZone: string; // IANA timezone (e.g., "Asia/Tokyo")
  toTimeZone: string; // IANA timezone (e.g., "America/New_York")
}

export interface ConvertedTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: string;
  timeZone: string;
  timeZoneAbbr: string;
  formatted: string;
  utcOffset: string;
}

export interface TimeZoneInfo {
  ianaName: string;
  abbreviation: string;
  offset: string;
  displayName: string;
}

/**
 * Get UTC timestamp for a date/time in a specific timezone
 */
function getUTCTimestamp(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): number {
  // Create a tentative UTC date
  const tentativeDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

  // Get how this UTC time would be displayed in the target timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(tentativeDate);
  const tzYear = parseInt(parts.find((p) => p.type === "year")!.value);
  const tzMonth = parseInt(parts.find((p) => p.type === "month")!.value);
  const tzDay = parseInt(parts.find((p) => p.type === "day")!.value);
  const tzHour = parseInt(parts.find((p) => p.type === "hour")!.value);
  const tzMinute = parseInt(parts.find((p) => p.type === "minute")!.value);
  const tzSecond = parseInt(parts.find((p) => p.type === "second")!.value);

  // Calculate the difference between timezone display and original time
  const tzDate = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, tzSecond);
  const diff = tentativeDate.getTime() - tzDate;

  // The actual UTC time is the input time plus the difference
  const inputDate = Date.UTC(year, month - 1, day, hour, minute, 0);
  return inputDate + diff;
}

/**
 * Get UTC offset in minutes for a specific date and timezone
 */
function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  // Get the date parts in the target timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const tzYear = parseInt(parts.find((p) => p.type === "year")!.value);
  const tzMonth = parseInt(parts.find((p) => p.type === "month")!.value);
  const tzDay = parseInt(parts.find((p) => p.type === "day")!.value);
  const tzHour = parseInt(parts.find((p) => p.type === "hour")!.value);
  const tzMinute = parseInt(parts.find((p) => p.type === "minute")!.value);
  const tzSecond = parseInt(parts.find((p) => p.type === "second")!.value);

  // Create a Date object for the timezone's local time
  const tzDate = new Date(Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, tzSecond));

  // Calculate the difference in minutes
  // Timezone offset = (local time - UTC time)
  const offsetMinutes = (tzDate.getTime() - date.getTime()) / (1000 * 60);

  return Math.round(offsetMinutes);
}

/**
 * Format offset minutes to UTC±HHMM string
 */
function formatUTCOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;

  return `UTC${sign}${String(hours).padStart(2, "0")}${String(minutes).padStart(2, "0")}`;
}

/**
 * Get UTC offset for a specific date and timezone in UTC±HHMM format
 */
function getTimeZoneOffset(date: Date, timeZone: string): string {
  const offsetMinutes = getTimeZoneOffsetMinutes(date, timeZone);
  return formatUTCOffset(offsetMinutes);
}

/**
 * Check if a timezone is currently in daylight saving time
 */
function isDST(date: Date, timeZone: string): boolean {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);

  const janOffset = getTimeZoneOffsetMinutes(jan, timeZone);
  const julOffset = getTimeZoneOffsetMinutes(jul, timeZone);
  const currentOffset = getTimeZoneOffsetMinutes(date, timeZone);

  // If offsets are the same, no DST
  if (janOffset === julOffset) {
    return false;
  }

  // DST is when offset is greater (more positive, closer to or past UTC)
  const maxOffset = Math.max(janOffset, julOffset);
  return currentOffset === maxOffset;
}

/**
 * Get timezone abbreviation for a specific date
 * Uses manual mapping for major timezones to ensure consistent abbreviations
 */
function getTimeZoneAbbreviation(date: Date, timeZone: string): string {
  // Manual mapping for major timezones
  const timeZoneMap: Record<string, { standard: string; daylight?: string }> = {
    "UTC": { standard: "UTC" },
    "Etc/UTC": { standard: "UTC" },
    "Etc/GMT": { standard: "GMT" },

    // Asia
    "Asia/Tokyo": { standard: "JST" },
    "Asia/Seoul": { standard: "KST" },
    "Asia/Shanghai": { standard: "CST" },
    "Asia/Hong_Kong": { standard: "HKT" },
    "Asia/Singapore": { standard: "SGT" },
    "Asia/Bangkok": { standard: "ICT" },
    "Asia/Kolkata": { standard: "IST" },
    "Asia/Dubai": { standard: "GST" },

    // Americas
    "America/New_York": { standard: "EST", daylight: "EDT" },
    "America/Chicago": { standard: "CST", daylight: "CDT" },
    "America/Denver": { standard: "MST", daylight: "MDT" },
    "America/Los_Angeles": { standard: "PST", daylight: "PDT" },
    "America/Anchorage": { standard: "AKST", daylight: "AKDT" },
    "Pacific/Honolulu": { standard: "HST" },
    "America/Toronto": { standard: "EST", daylight: "EDT" },
    "America/Mexico_City": { standard: "CST", daylight: "CDT" },
    "America/Sao_Paulo": { standard: "BRT", daylight: "BRST" },

    // Europe
    "Europe/London": { standard: "GMT", daylight: "BST" },
    "Europe/Paris": { standard: "CET", daylight: "CEST" },
    "Europe/Berlin": { standard: "CET", daylight: "CEST" },
    "Europe/Rome": { standard: "CET", daylight: "CEST" },
    "Europe/Madrid": { standard: "CET", daylight: "CEST" },
    "Europe/Moscow": { standard: "MSK" },

    // Africa
    "Africa/Cairo": { standard: "EET", daylight: "EEST" },
    "Africa/Johannesburg": { standard: "SAST" },

    // Oceania
    "Australia/Sydney": { standard: "AEST", daylight: "AEDT" },
    "Australia/Melbourne": { standard: "AEST", daylight: "AEDT" },
    "Pacific/Auckland": { standard: "NZST", daylight: "NZDT" },
  };

  const mapping = timeZoneMap[timeZone];
  if (mapping) {
    if (mapping.daylight && isDST(date, timeZone)) {
      return mapping.daylight;
    }
    return mapping.standard;
  }

  // Fallback to Intl API
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone,
    timeZoneName: "short",
  });
  const parts = formatter.formatToParts(date);
  const abbr = parts.find((p) => p.type === "timeZoneName")?.value || "";

  // If it's a GMT format, extract a simpler version
  if (abbr.startsWith("GMT")) {
    return timeZone.split("/").pop()?.replace(/_/g, " ") || abbr;
  }

  return abbr;
}

/**
 * Convert UTC timestamp to local time in specified timezone
 */
function getLocalTime(utcTimestamp: number, timeZone: string): ConvertedTime {
  const date = new Date(utcTimestamp);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "long",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find((p) => p.type === "year")!.value);
  const month = parseInt(parts.find((p) => p.type === "month")!.value);
  const day = parseInt(parts.find((p) => p.type === "day")!.value);
  const hour = parseInt(parts.find((p) => p.type === "hour")!.value);
  const minute = parseInt(parts.find((p) => p.type === "minute")!.value);
  const weekday = parts.find((p) => p.type === "weekday")!.value;

  const timeZoneAbbr = getTimeZoneAbbreviation(date, timeZone);
  const utcOffset = getTimeZoneOffset(date, timeZone);

  const formatted = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} (${weekday})`;

  return {
    year,
    month,
    day,
    hour,
    minute,
    weekday,
    timeZone,
    timeZoneAbbr,
    formatted,
    utcOffset,
  };
}

/**
 * Convert time from one timezone to another
 */
export function convertTimeZone(
  options: TimeZoneConverterOptions
): ConvertedTime {
  const { year, month, day, hour, minute, fromTimeZone, toTimeZone } = options;

  // Input validation
  if (!year || !month || !day || hour === undefined || minute === undefined) {
    throw new Error("Invalid date/time parameters");
  }

  if (month < 1 || month > 12) {
    throw new Error("Month must be between 1 and 12");
  }

  if (day < 1 || day > 31) {
    throw new Error("Day must be between 1 and 31");
  }

  // Check for invalid dates like Feb 30
  const testDate = new Date(Date.UTC(year, month - 1, day));
  if (testDate.getUTCDate() !== day) {
    throw new Error("Invalid day for the given month and year");
  }

  if (hour < 0 || hour > 23) {
    throw new Error("Hour must be between 0 and 23");
  }

  if (minute < 0 || minute > 59) {
    throw new Error("Minute must be between 0 and 59");
  }

  if (!fromTimeZone || !toTimeZone) {
    throw new Error("Time zones are required");
  }

  // Step 1: Get UTC timestamp for the input time in source timezone
  const utcTimestamp = getUTCTimestamp(
    year,
    month,
    day,
    hour,
    minute,
    fromTimeZone
  );

  // Step 2: Convert UTC timestamp to local time in target timezone
  const convertedTime = getLocalTime(utcTimestamp, toTimeZone);

  return convertedTime;
}

/**
 * Get list of available timezones with info
 */
export function getAvailableTimeZonesWithInfo(): TimeZoneInfo[] {
  const now = new Date();
  let timeZones: string[] = [];

  // Intl.supportedValuesOf is available in Node.js 18+
  if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
    timeZones = (Intl as { supportedValuesOf: (key: string) => string[] }).supportedValuesOf("timeZone");
  } else {
    // Fallback: List of major timezones
    timeZones = [
      "UTC",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Anchorage",
      "Pacific/Honolulu",
      "America/Toronto",
      "America/Mexico_City",
      "America/Sao_Paulo",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Europe/Rome",
      "Europe/Madrid",
      "Europe/Moscow",
      "Africa/Cairo",
      "Africa/Johannesburg",
      "Asia/Dubai",
      "Asia/Karachi",
      "Asia/Kolkata",
      "Asia/Bangkok",
      "Asia/Singapore",
      "Asia/Hong_Kong",
      "Asia/Shanghai",
      "Asia/Tokyo",
      "Asia/Seoul",
      "Australia/Sydney",
      "Australia/Melbourne",
      "Pacific/Auckland",
    ];
  }

  // Ensure UTC is in the list
  if (!timeZones.includes("UTC")) {
    timeZones.unshift("UTC");
  }

  // Priority timezones (in order)
  const priorityTimezones = [
    "UTC",
    "Asia/Tokyo",
    "America/New_York",
    "America/Chicago",
    "America/Los_Angeles",
  ];

  // Create timezone info objects
  const timeZoneInfos = timeZones.map((tz) => {
    const abbr = getTimeZoneAbbreviation(now, tz);
    const offset = getTimeZoneOffset(now, tz);
    const displayName = `${abbr} ${offset}`;
    return {
      ianaName: tz,
      abbreviation: abbr,
      offset: offset,
      displayName: displayName,
    };
  });

  // Sort: priority timezones first, then alphabetically by abbreviation
  const sorted = timeZoneInfos.sort((a, b) => {
    const aIndex = priorityTimezones.indexOf(a.ianaName);
    const bIndex = priorityTimezones.indexOf(b.ianaName);

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    return a.abbreviation.localeCompare(b.abbreviation);
  });

  return sorted;
}

/**
 * Get list of available timezones (IANA names only)
 */
export function getAvailableTimeZones(): string[] {
  return getAvailableTimeZonesWithInfo().map((tz) => tz.ianaName);
}
