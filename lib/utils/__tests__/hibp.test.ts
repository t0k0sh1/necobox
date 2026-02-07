/**
 * @jest-environment jsdom
 */
import { sha1Hash, checkPasswordBreach } from "../hibp";

describe("sha1Hash", () => {
  it("既知の入力に対して正しいSHA-1ハッシュを返す", async () => {
    // "password" のSHA-1ハッシュ
    const result = await sha1Hash("password");
    expect(result).toBe("5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8");
  });

  it("空文字のハッシュを正しく計算する", async () => {
    const result = await sha1Hash("");
    expect(result).toBe("DA39A3EE5E6B4B0D3255BFEF95601890AFD80709");
  });

  it("大文字で返す", async () => {
    const result = await sha1Hash("test");
    expect(result).toMatch(/^[0-9A-F]{40}$/);
  });
});

describe("checkPasswordBreach", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("漏洩が見つかった場合に breached: true と件数を返す", async () => {
    // "password" のSHA-1: 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
    // プレフィックス: 5BAA6, サフィックス: 1E4C9B93F3F0682250B6CF8331B7EE68FD8
    const responseBody = [
      "0018A45C4D1DEF81644B54AB7F969B88D65:1",
      "1E4C9B93F3F0682250B6CF8331B7EE68FD8:9659365",
      "00D4F6E8FA6EECAD2A3AA415EEC418D38EC:2",
    ].join("\n");

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(responseBody),
    });

    const result = await checkPasswordBreach("password");

    expect(result.breached).toBe(true);
    expect(result.count).toBe(9659365);
    expect(result.error).toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith("/api/v1/hibp?prefix=5BAA6");
  });

  it("漏洩が見つからない場合に breached: false を返す", async () => {
    const responseBody = [
      "0018A45C4D1DEF81644B54AB7F969B88D65:1",
      "00D4F6E8FA6EECAD2A3AA415EEC418D38EC:2",
    ].join("\n");

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(responseBody),
    });

    const result = await checkPasswordBreach("password");

    expect(result.breached).toBe(false);
    expect(result.count).toBe(0);
    expect(result.error).toBeUndefined();
  });

  it("APIエラー時にエラーを返す", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await checkPasswordBreach("password");

    expect(result.breached).toBe(false);
    expect(result.count).toBe(0);
    expect(result.error).toBe("API request failed");
  });

  it("ネットワークエラー時にエラーを返す", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const result = await checkPasswordBreach("password");

    expect(result.breached).toBe(false);
    expect(result.count).toBe(0);
    expect(result.error).toBe("Failed to check breach status");
  });

  it("件数0の場合は breached: false を返す", async () => {
    // サフィックスが一致するが件数が0のケース
    const responseBody = [
      "1E4C9B93F3F0682250B6CF8331B7EE68FD8:0",
    ].join("\n");

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(responseBody),
    });

    const result = await checkPasswordBreach("password");

    expect(result.breached).toBe(false);
    expect(result.count).toBe(0);
  });
});
