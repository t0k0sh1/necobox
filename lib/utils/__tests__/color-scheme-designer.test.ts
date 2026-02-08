import {
  hslToHex,
  hexToHsl,
  getOptimalTextColor,
  exportAsText,
  exportAsCssVariables,
  exportAsTailwindConfig,
  calculateContrastPairs,
  type SchemeColor,
  type ColorScheme,
} from "../color-scheme-designer";
describe("color-scheme-designer", () => {
  // --- HSL <-> HEX 変換 ---
  describe("hslToHex / hexToHsl", () => {
    it("HSLをHEXに変換できる", () => {
      const hex = hslToHex({ h: 0, s: 100, l: 50 });
      expect(hex).toBe("#ff0000");
    });

    it("HEXをHSLに変換できる", () => {
      const hsl = hexToHsl("#ff0000");
      expect(hsl).toEqual({ h: 0, s: 100, l: 50 });
    });

    it("無効なHEXでnullを返す", () => {
      expect(hexToHsl("invalid")).toBeNull();
    });
  });

  // --- テキスト色判定 ---
  describe("getOptimalTextColor", () => {
    it("明るい背景色には黒を返す", () => {
      expect(getOptimalTextColor("#ffffff")).toBe("#000000");
      expect(getOptimalTextColor("#f0f0f0")).toBe("#000000");
    });

    it("暗い背景色には白を返す", () => {
      expect(getOptimalTextColor("#000000")).toBe("#ffffff");
      expect(getOptimalTextColor("#1a1a1a")).toBe("#ffffff");
    });

    it("無効なHEXには黒を返す", () => {
      expect(getOptimalTextColor("invalid")).toBe("#000000");
    });
  });

  // --- エクスポート ---
  describe("exportAsText", () => {
    it("Markdown箇条書き形式で正しくエクスポートする", () => {
      const scheme: ColorScheme = {
        name: "Test Scheme",
        colors: [
          { id: "1", hex: "#3b82f6", name: "Primary", group: "palette" },
        ],
      };
      const text = exportAsText(scheme);
      expect(text).toContain("## Test Scheme");
      expect(text).toContain("### Palette");
      expect(text).toContain("- **Primary**: `#3b82f6`");
      expect(text).not.toContain("### Grayscale");
    });
  });

  describe("exportAsCssVariables", () => {
    it("CSS変数形式で正しくエクスポートする", () => {
      const scheme: ColorScheme = {
        name: "Test",
        colors: [
          { id: "1", hex: "#3b82f6", name: "Primary", group: "palette" },
        ],
      };
      const css = exportAsCssVariables(scheme);
      expect(css).toContain(":root {");
      expect(css).toContain("--color-primary: #3b82f6;");
      expect(css).not.toContain("gray");
      expect(css).toContain("}");
    });
  });

  describe("exportAsTailwindConfig", () => {
    it("Tailwind設定形式で正しくエクスポートする", () => {
      const scheme: ColorScheme = {
        name: "Test",
        colors: [
          { id: "1", hex: "#3b82f6", name: "Primary", group: "palette" },
        ],
      };
      const config = exportAsTailwindConfig(scheme);
      expect(config).toContain("tailwind.config.js");
      expect(config).toContain('"primary"');
      expect(config).toContain("#3b82f6");
    });
  });

  // --- アクセシビリティ ---
  describe("calculateContrastPairs", () => {
    it("コントラストペアのリストを返す", () => {
      const colors: SchemeColor[] = [
        { id: "1", hex: "#3b82f6", name: "Primary", group: "palette" },
      ];
      const pairs = calculateContrastPairs(colors);
      expect(pairs.length).toBeGreaterThan(0);
      pairs.forEach((pair) => {
        expect(pair.ratio).toBeGreaterThan(0);
        expect(typeof pair.wcagAA).toBe("boolean");
        expect(typeof pair.wcagAAA).toBe("boolean");
      });
    });

    it("白と黒のテキストコントラストを含む", () => {
      const colors: SchemeColor[] = [
        { id: "1", hex: "#3b82f6", name: "Blue", group: "palette" },
      ];
      const pairs = calculateContrastPairs(colors);
      const fgNames = pairs.map((p) => p.fgName);
      expect(fgNames).toContain("White");
      expect(fgNames).toContain("Black");
    });

    it("色同士の組み合わせを含む", () => {
      const colors: SchemeColor[] = [
        { id: "1", hex: "#3b82f6", name: "Blue", group: "palette" },
        { id: "2", hex: "#ef4444", name: "Red", group: "palette" },
      ];
      const pairs = calculateContrastPairs(colors);
      const colorPairs = pairs.filter(
        (p) => p.fgName !== "White" && p.fgName !== "Black"
      );
      expect(colorPairs.length).toBeGreaterThan(0);
      expect(colorPairs[0].fgName).toBe("Blue");
      expect(colorPairs[0].bgName).toBe("Red");
    });

    it("空の色配列では空のペアを返す", () => {
      const pairs = calculateContrastPairs([]);
      expect(pairs).toEqual([]);
    });
  });
});
