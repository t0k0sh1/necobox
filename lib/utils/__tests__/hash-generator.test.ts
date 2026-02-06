import { hashText, compareHash } from "../hash-generator";

describe("hashText", () => {
  it("SHA-256の空文字列ハッシュが既知のベクトルと一致する", async () => {
    const hash = await hashText("", "SHA-256");
    expect(hash).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });

  it("SHA-1の空文字列ハッシュが既知のベクトルと一致する", async () => {
    const hash = await hashText("", "SHA-1");
    expect(hash).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
  });

  it("SHA-512の空文字列ハッシュが既知のベクトルと一致する", async () => {
    const hash = await hashText("", "SHA-512");
    expect(hash).toBe(
      "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e"
    );
  });

  it("MD5でテキストをハッシュ化する", async () => {
    const hash = await hashText("hello", "MD5");
    expect(hash).toBe("5d41402abc4b2a76b9719d911017c592");
  });

  it("同一入力で冪等性がある", async () => {
    const hash1 = await hashText("test", "SHA-256");
    const hash2 = await hashText("test", "SHA-256");
    expect(hash1).toBe(hash2);
  });
});

describe("compareHash", () => {
  it("同じハッシュを一致と判定する", () => {
    expect(compareHash("abc123", "abc123")).toBe(true);
  });

  it("大文字小文字を無視して比較する", () => {
    expect(compareHash("ABC123", "abc123")).toBe(true);
  });

  it("異なるハッシュを不一致と判定する", () => {
    expect(compareHash("abc123", "xyz789")).toBe(false);
  });

  it("前後の空白を無視する", () => {
    expect(compareHash("  abc123  ", "abc123")).toBe(true);
  });
});
