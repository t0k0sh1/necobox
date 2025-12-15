export interface AccessLogEntry {
  timestamp: Date;
  ip: string;
  method: string;
  path: string;
  status: number;
  size?: number;
  referer?: string;
  userAgent?: string;
  raw: string;
}

interface ParseResult {
  entries: AccessLogEntry[];
  errors: string[];
}

/**
 * Apache Common Log Format
 * Example: 127.0.0.1 - - [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326
 */
const APACHE_COMMON_REGEX =
  /^(\S+) (\S+) (\S+) \[([^\]]+)\] "(\S+) (\S+) ([^"]+)" (\d+) (\S+)$/;

/**
 * Apache Combined Log Format
 * Example: 127.0.0.1 - - [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://www.example.com/start.html" "Mozilla/4.08 [en] (Win98; I ;Nav)"
 */
const APACHE_COMBINED_REGEX =
  /^(\S+) (\S+) (\S+) \[([^\]]+)\] "(\S+) (\S+) ([^"]+)" (\d+) (\S+) "([^"]*)" "([^"]*)"$/;

/**
 * Nginx Log Format (default)
 * Example: 127.0.0.1 - - [10/Oct/2000:13:55:36 -0700] "GET /index.html HTTP/1.1" 200 612 "-" "Mozilla/5.0"
 */
const NGINX_REGEX =
  /^(\S+) (\S+) (\S+) \[([^\]]+)\] "(\S+) (\S+) ([^"]+)" (\d+) (\S+) "([^"]*)" "([^"]*)"$/;

/**
 * Parse Apache/Nginx date format
 * Example: "10/Oct/2000:13:55:36 -0700"
 */
function parseLogDate(dateStr: string): Date | null {
  try {
    // Try to parse Apache/Nginx format: "10/Oct/2000:13:55:36 -0700"
    const match = dateStr.match(
      /^(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})\s+([+-]\d{4})$/
    );
    if (match) {
      const [, day, month, year, hour, minute, second, tz] = match;
      const monthMap: Record<string, number> = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      };
      const monthNum = monthMap[month];
      if (monthNum === undefined) {
        return null;
      }
      const date = new Date(
        Date.UTC(
          parseInt(year, 10),
          monthNum,
          parseInt(day, 10),
          parseInt(hour, 10),
          parseInt(minute, 10),
          parseInt(second, 10)
        )
      );
      // Adjust for timezone offset
      const tzOffset = parseInt(tz.slice(1, 3), 10) * 60 + parseInt(tz.slice(3, 5), 10);
      const tzSign = tz[0] === "+" ? -1 : 1;
      date.setMinutes(date.getMinutes() + tzSign * tzOffset);
      return date;
    }
    // Fallback to standard Date parsing
    return new Date(dateStr);
  } catch {
    return null;
  }
}

/**
 * Parse Apache error log date format
 * Example: "Sun Dec 04 04:47:44 2005"
 */
function parseApacheErrorLogDate(dateStr: string): Date | null {
  try {
    const match = dateStr.match(
      /^(\w{3})\s+(\w{3})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\s+(\d{4})$/
    );
    if (match) {
      const [, , month, day, hour, minute, second, year] = match;
      const monthMap: Record<string, number> = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      };
      const monthNum = monthMap[month];
      if (monthNum === undefined) {
        return null;
      }
      return new Date(
        parseInt(year, 10),
        monthNum,
        parseInt(day, 10),
        parseInt(hour, 10),
        parseInt(minute, 10),
        parseInt(second, 10)
      );
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract IP address from various log formats
 */
function extractIP(line: string): string {
  // Try to find [client IP] pattern (Apache error log)
  const clientMatch = line.match(/\[client\s+([^\]]+)\]/i);
  if (clientMatch) {
    return clientMatch[1].trim();
  }

  // Try to find IP at the beginning of the line
  const ipMatch = line.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
  if (ipMatch) {
    return ipMatch[1];
  }

  return "";
}

/**
 * Parse a single log line
 * Returns an entry even if parsing is incomplete, with default values for missing fields
 */
function parseLogLine(line: string): AccessLogEntry {
  const trimmed = line.trim();
  if (!trimmed) {
    // Return entry with defaults for empty lines
    return {
      timestamp: new Date(),
      ip: "",
      method: "",
      path: "",
      status: 0,
      raw: trimmed,
    };
  }

  // Try Apache Combined format first (most complete)
  let match = trimmed.match(APACHE_COMBINED_REGEX);
  if (match) {
    const [, ip, , , dateStr, method, path, , status, size, referer, userAgent] =
      match;
    const timestamp = parseLogDate(dateStr);

    if (timestamp) {
      return {
        timestamp,
        ip,
        method,
        path,
        status: parseInt(status, 10),
        size: size === "-" ? undefined : parseInt(size, 10),
        referer: referer === "-" ? undefined : referer,
        userAgent: userAgent === "-" ? undefined : userAgent,
        raw: trimmed,
      };
    }
  }

  // Try Apache Common format
  match = trimmed.match(APACHE_COMMON_REGEX);
  if (match) {
    const [, ip, , , dateStr, method, path, , status, size] = match;
    const timestamp = parseLogDate(dateStr);

    if (timestamp) {
      return {
        timestamp,
        ip,
        method,
        path,
        status: parseInt(status, 10),
        size: size === "-" ? undefined : parseInt(size, 10),
        raw: trimmed,
      };
    }
  }

  // Try Nginx format
  match = trimmed.match(NGINX_REGEX);
  if (match) {
    const [, ip, , , dateStr, method, path, , status, size, referer, userAgent] =
      match;
    const timestamp = parseLogDate(dateStr);

    if (timestamp) {
      return {
        timestamp,
        ip,
        method,
        path,
        status: parseInt(status, 10),
        size: size === "-" ? undefined : parseInt(size, 10),
        referer: referer === "-" ? undefined : referer,
        userAgent: userAgent === "-" ? undefined : userAgent,
        raw: trimmed,
      };
    }
  }

  // Try Apache error log format: [Sun Dec 04 04:47:44 2005] [error] [client IP] message
  const errorLogMatch = trimmed.match(/^\[([^\]]+)\]\s+\[([^\]]+)\](?:\s+\[client\s+([^\]]+)\])?/);
  if (errorLogMatch) {
    const [, dateStr, , clientIP] = errorLogMatch;
    const timestamp = parseApacheErrorLogDate(dateStr);

    // Try to extract path from error message if available
    let path = "";
    const pathMatch = trimmed.match(/(?:Directory index forbidden|File does not exist|Permission denied).*?:\s*([^\s]+)/i);
    if (pathMatch) {
      path = pathMatch[1];
    }

    return {
      timestamp: timestamp || new Date(),
      ip: clientIP || extractIP(trimmed) || "",
      method: "",
      path: path,
      status: 0,
      raw: trimmed,
    };
  }

  // Try to extract partial information from any line
  const extractedIP = extractIP(trimmed);
  let extractedTimestamp: Date | null = null;

  // Try to find date patterns in the line
  const datePatterns = [
    /\[(\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2}\s+[+-]\d{4})\]/,
    /\[(\w{3}\s+\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\d{4})\]/,
  ];

  for (const pattern of datePatterns) {
    const dateMatch = trimmed.match(pattern);
    if (dateMatch) {
      extractedTimestamp =
        parseLogDate(dateMatch[1]) ||
        parseApacheErrorLogDate(dateMatch[1]);
      if (extractedTimestamp) {
        break;
      }
    }
  }

  // Return entry with whatever information we could extract
  return {
    timestamp: extractedTimestamp || new Date(),
    ip: extractedIP,
    method: "",
    path: "",
    status: 0,
    raw: trimmed,
  };
}

/**
 * Parse access log text content
 * All lines are converted to entries, even if parsing is incomplete
 */
export function parseAccessLog(content: string): ParseResult {
  const entries: AccessLogEntry[] = [];
  const errors: string[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      continue;
    }

    try {
      const entry = parseLogLine(line);
      entries.push(entry);

      // Only add to errors if we couldn't extract any meaningful information
      if (
        !entry.ip &&
        !entry.method &&
        !entry.path &&
        entry.status === 0 &&
        entry.timestamp.getTime() === new Date().getTime()
      ) {
        // This is a fallback entry with no extracted information
        // Don't add to errors, just log it as a warning
      }
    } catch (error) {
      // Even if parsing fails completely, create a minimal entry
      entries.push({
        timestamp: new Date(),
        ip: "",
        method: "",
        path: "",
        status: 0,
        raw: line,
      });
      errors.push(
        `Line ${i + 1}: Parse error - ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  return { entries, errors };
}

