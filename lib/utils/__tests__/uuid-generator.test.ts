import { decodeTime } from "ulid";
import {
  generateUUIDv4,
  generateUUIDv7,
  generateULID,
  generateNanoid,
  batchGenerate,
  pickRandomMsInRange,
} from "../uuid-generator";

/** UUID v7 先頭 48 ビットの Unix 時刻（ミリ秒）を取り出す */
function parseUuidV7TimestampMs(uuid: string): number {
  const hex = uuid.replace(/-/g, "").substring(0, 12);
  return parseInt(hex, 16);
}

// UUID v4 のフォーマット: xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// UUID v7 のフォーマット: xxxxxxxx-xxxx-7xxx-[89ab]xxx-xxxxxxxxxxxx
const UUID_V7_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// ULID のフォーマット: 26文字のCrockford Base32
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

describe("generateUUIDv4", () => {
  it("有効なUUID v4を生成する", () => {
    const uuid = generateUUIDv4();
    expect(uuid).toMatch(UUID_V4_REGEX);
  });

  it("毎回異なるUUIDを生成する", () => {
    const uuid1 = generateUUIDv4();
    const uuid2 = generateUUIDv4();
    expect(uuid1).not.toBe(uuid2);
  });
});

describe("pickRandomMsInRange", () => {
  it("区間内のミリ秒を返す", () => {
    const min = 1_700_000_000_000;
    const max = min + 10_000;
    for (let i = 0; i < 50; i++) {
      const ms = pickRandomMsInRange(min, max);
      expect(ms).toBeGreaterThanOrEqual(min);
      expect(ms).toBeLessThanOrEqual(max);
    }
  });

  it("min と max が等しいときその値を返す", () => {
    const t = 1_600_000_000_000;
    expect(pickRandomMsInRange(t, t)).toBe(t);
  });

  it("min > max のとき RangeError", () => {
    expect(() => pickRandomMsInRange(100, 50)).toThrow(RangeError);
  });

  it("非有限値のとき RangeError", () => {
    expect(() => pickRandomMsInRange(NaN, 0)).toThrow(RangeError);
    expect(() => pickRandomMsInRange(0, Infinity)).toThrow(RangeError);
  });
});

describe("generateUUIDv7", () => {
  it("有効なUUID v7を生成する", () => {
    const uuid = generateUUIDv7();
    expect(uuid).toMatch(UUID_V7_REGEX);
  });

  it("タイムスタンプ部分が現在時刻に近い", () => {
    const before = Date.now();
    const uuid = generateUUIDv7();
    const after = Date.now();

    const timestamp = parseUuidV7TimestampMs(uuid);

    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it("UUID v7 range mode embeds timestamp in bounds", () => {
    const minMs = 1_700_000_000_000;
    const maxMs = minMs + 500_000;
    for (let i = 0; i < 30; i++) {
      const uuid = generateUUIDv7({
        mode: "range",
        minMs,
        maxMs,
      });
      expect(uuid).toMatch(UUID_V7_REGEX);
      const ts = parseUuidV7TimestampMs(uuid);
      expect(ts).toBeGreaterThanOrEqual(minMs);
      expect(ts).toBeLessThanOrEqual(maxMs);
    }
  });

  it("期間が一点のとき常にそのタイムスタンプ", () => {
    const t = 1_650_000_000_000;
    const uuids = Array.from({ length: 20 }, () =>
      generateUUIDv7({ mode: "range", minMs: t, maxMs: t })
    );
    uuids.forEach((uuid) => {
      expect(parseUuidV7TimestampMs(uuid)).toBe(t);
    });
  });
});

describe("generateULID", () => {
  it("有効なULIDを生成する", () => {
    const id = generateULID();
    expect(id).toMatch(ULID_REGEX);
  });

  it("26文字のCrockford Base32で生成される", () => {
    const ids = Array.from({ length: 10 }, () => generateULID());
    ids.forEach((id) => {
      expect(id).toHaveLength(26);
      expect(id).toMatch(ULID_REGEX);
    });
  });

  it("ULID range mode keeps decodeTime in bounds", () => {
    const minMs = 1_700_000_000_000;
    const maxMs = minMs + 400_000;
    for (let i = 0; i < 30; i++) {
      const id = generateULID({ mode: "range", minMs, maxMs });
      const ts = decodeTime(id);
      expect(ts).toBeGreaterThanOrEqual(minMs);
      expect(ts).toBeLessThanOrEqual(maxMs);
    }
  });

  it("期間が一点のとき decodeTime が固定", () => {
    const t = 1_640_000_000_000;
    const ids = Array.from({ length: 15 }, () =>
      generateULID({ mode: "range", minMs: t, maxMs: t })
    );
    ids.forEach((id) => {
      expect(decodeTime(id)).toBe(t);
    });
  });
});

describe("generateNanoid", () => {
  it("デフォルト長（21文字）で生成する", () => {
    const id = generateNanoid();
    expect(id).toHaveLength(21);
  });

  it("指定した長さで生成する", () => {
    expect(generateNanoid(10)).toHaveLength(10);
    expect(generateNanoid(32)).toHaveLength(32);
  });
});

describe("batchGenerate", () => {
  it("指定した数だけ生成する", () => {
    const results = batchGenerate("uuidV4", 5);
    expect(results).toHaveLength(5);
  });

  it("生成されたIDがすべて一意", () => {
    const results = batchGenerate("uuidV4", 100);
    const unique = new Set(results);
    expect(unique.size).toBe(100);
  });

  it("各タイプで正しく生成する", () => {
    expect(batchGenerate("uuidV4", 1)[0]).toMatch(UUID_V4_REGEX);
    expect(batchGenerate("uuidV7", 1)[0]).toMatch(UUID_V7_REGEX);
    expect(batchGenerate("ulid", 1)[0]).toMatch(ULID_REGEX);
    expect(batchGenerate("nanoid", 1)[0]).toHaveLength(21);
  });

  it("Nanoidのカスタム長さを指定できる", () => {
    const results = batchGenerate("nanoid", 3, { nanoidLength: 10 });
    results.forEach((id) => expect(id).toHaveLength(10));
  });

  it("UUID v7 で timeSource 期間指定が反映される", () => {
    const minMs = 1_690_000_000_000;
    const maxMs = minMs + 100_000;
    const results = batchGenerate("uuidV7", 25, {
      timeSource: { mode: "range", minMs, maxMs },
    });
    results.forEach((uuid) => {
      const ts = parseUuidV7TimestampMs(uuid);
      expect(ts).toBeGreaterThanOrEqual(minMs);
      expect(ts).toBeLessThanOrEqual(maxMs);
    });
  });

  it("無効な期間では batchGenerate が例外を投げる", () => {
    expect(() =>
      batchGenerate("uuidV7", 1, {
        timeSource: { mode: "range", minMs: 100, maxMs: 50 },
      })
    ).toThrow(RangeError);
  });
});
