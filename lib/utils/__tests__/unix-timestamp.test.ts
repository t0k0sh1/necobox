import {
  timestampToDate,
  dateToTimestamp,
  formatDate,
  isValidTimestamp,
  getCurrentTimestamp,
} from "../unix-timestamp";

describe("timestampToDate", () => {
  it("秒単位のタイムスタンプを変換する", () => {
    const date = timestampToDate(0, "seconds");
    expect(date.getTime()).toBe(0);
  });

  it("ミリ秒単位のタイムスタンプを変換する", () => {
    const date = timestampToDate(1000, "milliseconds");
    expect(date.getTime()).toBe(1000);
  });

  it("特定のタイムスタンプを正しく変換する", () => {
    // 2024-01-01T00:00:00Z = 1704067200
    const date = timestampToDate(1704067200, "seconds");
    expect(date.toISOString()).toBe("2024-01-01T00:00:00.000Z");
  });

  it("負のタイムスタンプ（1970年以前）を変換する", () => {
    const date = timestampToDate(-86400, "seconds");
    expect(date.toISOString()).toBe("1969-12-31T00:00:00.000Z");
  });
});

describe("dateToTimestamp", () => {
  it("Dateを秒単位のタイムスタンプに変換する", () => {
    const date = new Date("2024-01-01T00:00:00Z");
    expect(dateToTimestamp(date, "seconds")).toBe(1704067200);
  });

  it("Dateをミリ秒単位のタイムスタンプに変換する", () => {
    const date = new Date("2024-01-01T00:00:00Z");
    expect(dateToTimestamp(date, "milliseconds")).toBe(1704067200000);
  });

  it("エポック（0）を正しく処理する", () => {
    const date = new Date(0);
    expect(dateToTimestamp(date, "seconds")).toBe(0);
  });

  it("往復変換が一致する", () => {
    const original = 1704067200;
    const date = timestampToDate(original, "seconds");
    expect(dateToTimestamp(date, "seconds")).toBe(original);
  });
});

describe("formatDate", () => {
  it("日付をフォーマットする", () => {
    const date = new Date("2024-01-01T00:00:00Z");
    const formatted = formatDate(date);
    expect(formatted.iso8601).toBe("2024-01-01T00:00:00.000Z");
    expect(formatted.utc).toBeTruthy();
    expect(formatted.local).toBeTruthy();
    expect(formatted.relative).toBeTruthy();
  });

  it("Invalid Date を処理する", () => {
    const date = new Date("invalid");
    const formatted = formatDate(date);
    expect(formatted.local).toBe("Invalid Date");
  });
});

describe("isValidTimestamp", () => {
  it("秒単位のタイムスタンプを判定する", () => {
    const result = isValidTimestamp("1704067200");
    expect(result.valid).toBe(true);
    expect(result.unit).toBe("seconds");
  });

  it("ミリ秒単位のタイムスタンプを判定する", () => {
    const result = isValidTimestamp("1704067200000");
    expect(result.valid).toBe(true);
    expect(result.unit).toBe("milliseconds");
  });

  it("不正な入力をfalseとする", () => {
    expect(isValidTimestamp("abc").valid).toBe(false);
    expect(isValidTimestamp("").valid).toBe(false);
  });

  it("0（エポック）を有効と判定する", () => {
    const result = isValidTimestamp("0");
    expect(result.valid).toBe(true);
    expect(result.unit).toBe("seconds");
  });
});

describe("getCurrentTimestamp", () => {
  it("秒単位の現在のタイムスタンプを返す", () => {
    const ts = getCurrentTimestamp("seconds");
    expect(ts).toBeGreaterThan(1700000000);
    expect(ts).toBeLessThan(2000000000);
  });

  it("ミリ秒単位の現在のタイムスタンプを返す", () => {
    const ts = getCurrentTimestamp("milliseconds");
    expect(ts).toBeGreaterThan(1700000000000);
  });
});
