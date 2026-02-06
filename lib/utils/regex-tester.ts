/**
 * 正規表現テスターユーティリティ
 * 正規表現のリアルタイムマッチング、キャプチャグループ表示
 */

export interface CaptureGroup {
  index: number;
  name?: string;
  value: string;
}

export interface MatchInfo {
  fullMatch: string;
  index: number;
  endIndex: number;
  groups: CaptureGroup[];
}

export interface RegexResult {
  matches: MatchInfo[];
  matchCount: number;
  error: string | null;
}

/**
 * パターンとフラグのバリデーション
 */
export function validatePattern(
  pattern: string,
  flags: string
): { valid: boolean; error: string | null } {
  if (!pattern) {
    return { valid: false, error: null };
  }

  try {
    new RegExp(pattern, flags);
    return { valid: true, error: null };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

/**
 * 正規表現を実行してマッチ結果を返す
 */
export function executeRegex(
  pattern: string,
  flags: string,
  testString: string
): RegexResult {
  if (!pattern) {
    return { matches: [], matchCount: 0, error: null };
  }

  try {
    const regex = new RegExp(pattern, flags);
    const matches: MatchInfo[] = [];

    if (flags.includes("g")) {
      let match: RegExpExecArray | null;
      let count = 0;
      const maxMatches = 1000;

      while ((match = regex.exec(testString)) !== null && count < maxMatches) {
        matches.push(buildMatchInfo(match));
        if (match[0].length === 0) {
          regex.lastIndex++;
        }
        count++;
      }
    } else {
      const match = regex.exec(testString);
      if (match) {
        matches.push(buildMatchInfo(match));
      }
    }

    return { matches, matchCount: matches.length, error: null };
  } catch (e) {
    return { matches: [], matchCount: 0, error: (e as Error).message };
  }
}

/**
 * RegExpExecArray から MatchInfo を構築
 */
function buildMatchInfo(match: RegExpExecArray): MatchInfo {
  const groups: CaptureGroup[] = [];

  const namedGroups = match.groups;

  for (let i = 1; i < match.length; i++) {
    if (match[i] !== undefined) {
      groups.push({
        index: i,
        value: match[i],
      });
    }
  }

  if (namedGroups) {
    for (const [name, value] of Object.entries(namedGroups)) {
      if (value !== undefined) {
        const group = groups.find((g) => g.value === value && !g.name);
        if (group) {
          group.name = name;
        }
      }
    }
  }

  return {
    fullMatch: match[0],
    index: match.index,
    endIndex: match.index + match[0].length,
    groups,
  };
}

/**
 * フラグオブジェクトからフラグ文字列を構築
 */
export function buildFlagsString(flags: Record<string, boolean>): string {
  return Object.entries(flags)
    .filter(([, enabled]) => enabled)
    .map(([flag]) => flag)
    .join("");
}

/**
 * プリセットパターン定義
 */
export const REGEX_PRESETS = [
  {
    id: "email",
    i18nKey: "presetEmail",
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    flags: "g",
  },
  {
    id: "url",
    i18nKey: "presetUrl",
    pattern: "https?://[\\w\\-]+(\\.[\\w\\-]+)+[\\w.,@?^=%&:/~+#\\-]*",
    flags: "g",
  },
  {
    id: "ipv4",
    i18nKey: "presetIpv4",
    pattern:
      "\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b",
    flags: "g",
  },
  {
    id: "date",
    i18nKey: "presetDate",
    pattern: "\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}",
    flags: "g",
  },
  {
    id: "phone",
    i18nKey: "presetPhone",
    pattern: "\\+?[\\d\\-()\\s]{7,15}",
    flags: "g",
  },
  {
    id: "hexColor",
    i18nKey: "presetHexColor",
    pattern: "#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\b",
    flags: "g",
  },
] as const;
