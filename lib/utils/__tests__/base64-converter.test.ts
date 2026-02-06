import {
  encodeBase64,
  decodeBase64,
  toDataUri,
  isValidBase64,
  formatFileSize,
} from "../base64-converter";

describe("encodeBase64", () => {
  it("ASCII テキストをエンコードする", () => {
    expect(encodeBase64("Hello, World!")).toBe("SGVsbG8sIFdvcmxkIQ==");
  });

  it("日本語テキスト (UTF-8) をエンコードする", () => {
    const encoded = encodeBase64("こんにちは");
    expect(encoded).toBeTruthy();
    // デコードして元に戻ることを確認
    const { result } = decodeBase64(encoded);
    expect(result).toBe("こんにちは");
  });

  it("空文字列をエンコードする", () => {
    expect(encodeBase64("")).toBe("");
  });
});

describe("decodeBase64", () => {
  it("Base64をデコードする", () => {
    expect(decodeBase64("SGVsbG8sIFdvcmxkIQ==")).toEqual({
      result: "Hello, World!",
      error: null,
    });
  });

  it("パディングなしのBase64をデコードする", () => {
    // "Hello" = "SGVsbG8=" パディングなしの場合 "SGVsbG8"
    const { result, error } = decodeBase64("SGVsbG8");
    expect(error).toBeNull();
    expect(result).toBe("Hello");
  });

  it("不正なBase64でエラーを返す", () => {
    const { error } = decodeBase64("!!!invalid!!!");
    expect(error).not.toBeNull();
  });

  it("Data URI プレフィックスを処理する", () => {
    const { result, error } = decodeBase64(
      "data:text/plain;base64,SGVsbG8="
    );
    expect(error).toBeNull();
    expect(result).toBe("Hello");
  });
});

describe("toDataUri", () => {
  it("Data URIを生成する", () => {
    expect(toDataUri("SGVsbG8=", "text/plain")).toBe(
      "data:text/plain;base64,SGVsbG8="
    );
  });
});

describe("isValidBase64", () => {
  it("有効なBase64を判定する", () => {
    expect(isValidBase64("SGVsbG8=")).toBe(true);
    expect(isValidBase64("SGVsbG8sIFdvcmxkIQ==")).toBe(true);
  });

  it("空文字列をfalseとする", () => {
    expect(isValidBase64("")).toBe(false);
  });

  it("不正なBase64をfalseとする", () => {
    expect(isValidBase64("!!!")).toBe(false);
  });

  it("Data URIを有効と判定する", () => {
    expect(isValidBase64("data:text/plain;base64,SGVsbG8=")).toBe(true);
  });
});

describe("formatFileSize", () => {
  it("バイトをフォーマットする", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1024)).toBe("1.0 KB");
    expect(formatFileSize(1048576)).toBe("1.0 MB");
    expect(formatFileSize(500)).toBe("500 B");
  });
});
