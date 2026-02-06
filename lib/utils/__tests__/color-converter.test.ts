import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  getRelativeLuminance,
  getContrastRatio,
  getComplementaryColor,
  getAnalogousColors,
  formatRgb,
  formatHsl,
  isValidHex,
} from "../color-converter";

describe("color-converter", () => {
  describe("hexToRgb", () => {
    it("6桁のHEXを正しく変換できる", () => {
      expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb("#00ff00")).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb("#0000ff")).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    });

    it("3桁のHEXを正しく変換できる", () => {
      expect(hexToRgb("#f00")).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb("#abc")).toEqual({ r: 170, g: 187, b: 204 });
    });

    it("#なしのHEXも変換できる", () => {
      expect(hexToRgb("ff0000")).toEqual({ r: 255, g: 0, b: 0 });
    });

    it("不正なHEXはnullを返す", () => {
      expect(hexToRgb("")).toBeNull();
      expect(hexToRgb("#gg0000")).toBeNull();
      expect(hexToRgb("#12345")).toBeNull();
      expect(hexToRgb("#1234567")).toBeNull();
    });
  });

  describe("rgbToHex", () => {
    it("RGBを正しくHEXに変換できる", () => {
      expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe("#ff0000");
      expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe("#00ff00");
      expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe("#0000ff");
    });

    it("値がクランプされる", () => {
      expect(rgbToHex({ r: 300, g: -10, b: 128 })).toBe("#ff0080");
    });
  });

  describe("rgbToHsl / hslToRgb", () => {
    it("赤色を正しく変換できる", () => {
      const hsl = rgbToHsl({ r: 255, g: 0, b: 0 });
      expect(hsl.h).toBe(0);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);
    });

    it("白色を正しく変換できる", () => {
      const hsl = rgbToHsl({ r: 255, g: 255, b: 255 });
      expect(hsl.h).toBe(0);
      expect(hsl.s).toBe(0);
      expect(hsl.l).toBe(100);
    });

    it("HSL → RGB → HSL のラウンドトリップが成立する", () => {
      const original = { h: 210, s: 50, l: 60 };
      const rgb = hslToRgb(original);
      const result = rgbToHsl(rgb);
      // 丸め誤差を考慮
      expect(Math.abs(result.h - original.h)).toBeLessThanOrEqual(1);
      expect(Math.abs(result.s - original.s)).toBeLessThanOrEqual(1);
      expect(Math.abs(result.l - original.l)).toBeLessThanOrEqual(1);
    });

    it("グレーの場合 s=0 で正しく変換できる", () => {
      const rgb = hslToRgb({ h: 0, s: 0, l: 50 });
      expect(rgb.r).toBe(128);
      expect(rgb.g).toBe(128);
      expect(rgb.b).toBe(128);
    });
  });

  describe("getRelativeLuminance", () => {
    it("白色の相対輝度は1に近い", () => {
      const lum = getRelativeLuminance({ r: 255, g: 255, b: 255 });
      expect(lum).toBeCloseTo(1.0, 2);
    });

    it("黒色の相対輝度は0に近い", () => {
      const lum = getRelativeLuminance({ r: 0, g: 0, b: 0 });
      expect(lum).toBeCloseTo(0, 2);
    });
  });

  describe("getContrastRatio", () => {
    it("白と黒のコントラスト比は21:1に近い", () => {
      const result = getContrastRatio(
        { r: 0, g: 0, b: 0 },
        { r: 255, g: 255, b: 255 }
      );
      expect(result.ratio).toBeCloseTo(21, 0);
      expect(result.wcagAA).toBe(true);
      expect(result.wcagAAA).toBe(true);
    });

    it("同色のコントラスト比は1:1", () => {
      const result = getContrastRatio(
        { r: 128, g: 128, b: 128 },
        { r: 128, g: 128, b: 128 }
      );
      expect(result.ratio).toBe(1);
      expect(result.wcagAA).toBe(false);
    });
  });

  describe("getComplementaryColor", () => {
    it("補色はH+180度", () => {
      expect(getComplementaryColor({ h: 0, s: 100, l: 50 })).toEqual({
        h: 180,
        s: 100,
        l: 50,
      });
      expect(getComplementaryColor({ h: 200, s: 50, l: 60 })).toEqual({
        h: 20,
        s: 50,
        l: 60,
      });
    });
  });

  describe("getAnalogousColors", () => {
    it("類似色はH±30度", () => {
      const [left, right] = getAnalogousColors({ h: 120, s: 50, l: 50 });
      expect(left.h).toBe(90);
      expect(right.h).toBe(150);
    });

    it("0度付近でも正しくラップする", () => {
      const [left, right] = getAnalogousColors({ h: 10, s: 50, l: 50 });
      expect(left.h).toBe(340);
      expect(right.h).toBe(40);
    });
  });

  describe("formatRgb", () => {
    it("正しいフォーマットで出力する", () => {
      expect(formatRgb({ r: 255, g: 128, b: 0 })).toBe("rgb(255, 128, 0)");
    });
  });

  describe("formatHsl", () => {
    it("正しいフォーマットで出力する", () => {
      expect(formatHsl({ h: 210, s: 50, l: 60 })).toBe("hsl(210, 50%, 60%)");
    });
  });

  describe("isValidHex", () => {
    it("有効なHEXを判定できる", () => {
      expect(isValidHex("#fff")).toBe(true);
      expect(isValidHex("#ffffff")).toBe(true);
      expect(isValidHex("abc")).toBe(true);
      expect(isValidHex("abcdef")).toBe(true);
    });

    it("無効なHEXを判定できる", () => {
      expect(isValidHex("")).toBe(false);
      expect(isValidHex("#12345")).toBe(false);
      expect(isValidHex("#gggggg")).toBe(false);
    });
  });
});
