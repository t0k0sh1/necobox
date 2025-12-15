import type { AccessLogEntry } from "./access-log-parser";

export interface LogFilters {
  startDate?: Date;
  endDate?: Date;
  statusCode?: string;
  pathRegex?: string;
}

/**
 * Parse HTTP status code filter string
 * Supports:
 * - Pinpoint: "404" → matches 404 only
 * - Range: "4xx" → matches 400-499, "5xx" → matches 500-599
 * - Exclude: "!2xx" → matches everything except 200-299
 * - Multiple: "4xx,5xx" → matches 4xx or 5xx
 * - Multiple pinpoint: "200,201,404" → matches 200, 201, or 404
 */
export function parseStatusCodeFilter(filter: string): {
  matches: (status: number) => boolean;
  isValid: boolean;
  error?: string;
} {
  const trimmed = filter.trim();
  if (!trimmed) {
    return {
      matches: () => true,
      isValid: true,
    };
  }

  try {
    const parts = trimmed.split(",").map((p) => p.trim());
    const includeRanges: Array<{ min: number; max: number }> = [];
    const excludeRanges: Array<{ min: number; max: number }> = [];
    const includeExact: number[] = [];

    for (const part of parts) {
      if (part.startsWith("!")) {
        // Exclude pattern
        const excludePattern = part.slice(1).trim();
        if (excludePattern.match(/^\dxx$/)) {
          const firstDigit = parseInt(excludePattern[0], 10);
          if (isNaN(firstDigit) || firstDigit < 1 || firstDigit > 5) {
            return {
              matches: () => false,
              isValid: false,
              error: `Invalid exclude range: ${excludePattern}`,
            };
          }
          excludeRanges.push({
            min: firstDigit * 100,
            max: firstDigit * 100 + 99,
          });
        } else {
          return {
            matches: () => false,
            isValid: false,
            error: `Invalid exclude pattern: ${excludePattern}. Use format like !2xx`,
          };
        }
      } else if (part.match(/^\dxx$/)) {
        // Range pattern (e.g., "4xx")
        const firstDigit = parseInt(part[0], 10);
        if (isNaN(firstDigit) || firstDigit < 1 || firstDigit > 5) {
          return {
            matches: () => false,
            isValid: false,
            error: `Invalid range: ${part}`,
          };
        }
        includeRanges.push({
          min: firstDigit * 100,
          max: firstDigit * 100 + 99,
        });
      } else if (part.match(/^\d+$/)) {
        // Exact number
        const num = parseInt(part, 10);
        if (isNaN(num) || num < 0) {
          return {
            matches: () => false,
            isValid: false,
            error: `Invalid status code: ${part}. Must be a non-negative integer`,
          };
        }
        includeExact.push(num);
      } else {
        return {
          matches: () => false,
          isValid: false,
          error: `Invalid pattern: ${part}. Use format like 404, 4xx, !2xx, or 4xx,5xx`,
        };
      }
    }

    return {
      matches: (status: number) => {
        // Check excludes first
        for (const range of excludeRanges) {
          if (status >= range.min && status <= range.max) {
            return false;
          }
        }

        // Check includes
        if (includeExact.length > 0 && includeExact.includes(status)) {
          return true;
        }

        for (const range of includeRanges) {
          if (status >= range.min && status <= range.max) {
            return true;
          }
        }

        // If we have include patterns but none matched, return false
        if (includeRanges.length > 0 || includeExact.length > 0) {
          return false;
        }

        // If only excludes, return true (not excluded)
        return true;
      },
      isValid: true,
    };
  } catch (error) {
    return {
      matches: () => false,
      isValid: false,
      error: `Failed to parse status code filter: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Validate regex pattern
 */
export function validateRegex(pattern: string): {
  isValid: boolean;
  error?: string;
  regex?: RegExp;
} {
  if (!pattern.trim()) {
    return { isValid: true, error: undefined };
  }

  try {
    const regex = new RegExp(pattern);
    return { isValid: true, regex };
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof Error
          ? error.message
          : "Invalid regular expression",
    };
  }
}

/**
 * Apply filters to log entries
 */
export function filterLogEntries(
  entries: AccessLogEntry[],
  filters: LogFilters
): AccessLogEntry[] {
  let filtered = entries;

  // Date filter
  if (filters.startDate || filters.endDate) {
    filtered = filtered.filter((entry) => {
      if (filters.startDate && entry.timestamp < filters.startDate) {
        return false;
      }
      if (filters.endDate && entry.timestamp > filters.endDate) {
        return false;
      }
      return true;
    });
  }

  // Status code filter
  if (filters.statusCode) {
    const statusFilter = parseStatusCodeFilter(filters.statusCode);
    if (statusFilter.isValid) {
      filtered = filtered.filter((entry) =>
        statusFilter.matches(entry.status || 0)
      );
    }
  }

  // Path regex filter
  if (filters.pathRegex) {
    const pathValidation = validateRegex(filters.pathRegex);
    if (pathValidation.isValid && pathValidation.regex) {
      filtered = filtered.filter((entry) =>
        pathValidation.regex!.test(entry.path || "")
      );
    }
  }

  return filtered;
}

