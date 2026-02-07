/**
 * @jest-environment jsdom
 */
import { sha1Hash } from "../hibp";

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
