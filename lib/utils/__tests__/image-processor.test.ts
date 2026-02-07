import { resizeImage, processImage } from "../image-processor";

// ブラウザAPIのモック
const mockRevokeObjectURL = jest.fn();
const mockCreateObjectURL = jest.fn(() => "blob:mock-url");

// Canvasモック
const mockDrawImage = jest.fn();
const mockToBlob = jest.fn();
const mockGetContext = jest.fn(() => ({
  drawImage: mockDrawImage,
  imageSmoothingEnabled: true,
  imageSmoothingQuality: "high",
}));

// 元のcreateElementを保存（再帰防止）
const originalCreateElement = document.createElement.bind(document);

beforeEach(() => {
  jest.clearAllMocks();

  // URL モック
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;

  // Image モック（srcのsetterでonloadを発火）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).Image = class {
    width = 800;
    height = 600;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    private _src = "";

    get src() {
      return this._src;
    }
    set src(value: string) {
      this._src = value;
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    }
  };

  // Canvas モック
  jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "canvas") {
      return {
        width: 0,
        height: 0,
        getContext: mockGetContext,
        toBlob: mockToBlob.mockImplementation(
          (callback: BlobCallback) => {
            const blob = new Blob(["mock"], { type: "image/jpeg" });
            callback(blob);
          }
        ),
      } as unknown as HTMLCanvasElement;
    }
    return originalCreateElement(tag);
  });

  // FileReader モック
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).FileReader = class {
    result: string | null = "data:image/jpeg;base64,mock";
    onloadend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    readAsDataURL() {
      setTimeout(() => {
        if (this.onloadend) this.onloadend();
      }, 0);
    }
  };
});

// テスト用Fileヘルパー
function createMockFile(name = "test.jpg", type = "image/jpeg"): File {
  return new File(["mock"], name, { type });
}

describe("image-processor", () => {
  describe("resizeImage", () => {
    it("幅のみ指定で高さがアスペクト比に応じて計算される", async () => {
      const file = createMockFile();
      const result = await resizeImage(file, 400);
      expect(result.width).toBe(400);
      expect(result.height).toBe(300); // 800:600 = 400:300
    });

    it("高さのみ指定で幅がアスペクト比に応じて計算される", async () => {
      const file = createMockFile();
      const result = await resizeImage(file, undefined, 300);
      expect(result.width).toBe(400); // 800:600 = 400:300
      expect(result.height).toBe(300);
    });

    it("幅と高さ両方指定でアスペクト比を維持して小さい方に合わせる", async () => {
      const file = createMockFile();
      const result = await resizeImage(file, 400, 400);
      // 800x600を400x400に収める: widthRatio=0.5, heightRatio=0.667, min=0.5
      expect(result.width).toBe(400);
      expect(result.height).toBe(300);
    });

    it("どちらも未指定で元のサイズを返す", async () => {
      const file = createMockFile();
      const result = await resizeImage(file);
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it("画像読み込みエラーでrejectする", async () => {
      // Imageのsrcセッターでonerrorを呼ぶように変更
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).Image = class {
        width = 0;
        height = 0;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        private _src = "";
        get src() {
          return this._src;
        }
        set src(value: string) {
          this._src = value;
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 0);
        }
      };

      const file = createMockFile();
      await expect(resizeImage(file)).rejects.toThrow("Failed to load image");
    });
  });

  describe("processImage", () => {
    it("正常に画像を処理して結果を返す", async () => {
      const file = createMockFile();
      const result = await processImage(file, 400);
      expect(result).toHaveProperty("blob");
      expect(result).toHaveProperty("dataUrl");
      expect(result.width).toBe(400);
      expect(result.height).toBe(300);
      expect(result).toHaveProperty("size");
    });

    it("Canvas context取得失敗でrejectする", async () => {
      mockGetContext.mockReturnValueOnce(null);
      const file = createMockFile();
      await expect(processImage(file, 400)).rejects.toThrow(
        "Failed to get canvas context"
      );
    });

    it("画像読み込みエラーでrejectする", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).Image = class {
        width = 0;
        height = 0;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        private _src = "";
        get src() {
          return this._src;
        }
        set src(value: string) {
          this._src = value;
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 0);
        }
      };

      const file = createMockFile();
      await expect(processImage(file)).rejects.toThrow(
        "Failed to load image"
      );
    });

    it("toBlob失敗でrejectする", async () => {
      mockToBlob.mockImplementationOnce(
        (callback: (blob: Blob | null) => void) => {
          callback(null);
        }
      );
      const file = createMockFile();
      await expect(processImage(file)).rejects.toThrow(
        "Failed to process image"
      );
    });
  });
});
