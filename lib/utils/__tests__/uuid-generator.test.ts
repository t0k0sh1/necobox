import {
  generateUUIDv4,
  generateUUIDv7,
  generateULID,
  generateNanoid,
  batchGenerate,
} from "../uuid-generator";

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

describe("generateUUIDv7", () => {
  it("有効なUUID v7を生成する", () => {
    const uuid = generateUUIDv7();
    expect(uuid).toMatch(UUID_V7_REGEX);
  });

  it("タイムスタンプ部分が現在時刻に近い", () => {
    const before = Date.now();
    const uuid = generateUUIDv7();
    const after = Date.now();

    // UUIDの先頭12文字（ハイフンを除く）がタイムスタンプ
    const hex = uuid.replace(/-/g, "").substring(0, 12);
    const timestamp = parseInt(hex, 16);

    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
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
});
