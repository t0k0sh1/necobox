import JSZip from "jszip";
import { decompressZip, isBinaryContent, isZipFile } from "../zip-decompressor";

// ヘルパー関数: ZIPファイルを作成
async function createZipFile(
  files: { name: string; content: string }[],
  fileName = "test.zip"
): Promise<File> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.name, file.content);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  return new File([blob], fileName, { type: "application/zip" });
}

// ヘルパー関数: 指定サイズのコンテンツを生成
function generateContent(sizeInBytes: number): string {
  return "x".repeat(sizeInBytes);
}

describe("zip-decompressor", () => {
  describe("isZipFile", () => {
    it("returns true for .zip files", () => {
      const file = new File([""], "test.zip", { type: "application/zip" });
      expect(isZipFile(file)).toBe(true);
    });

    it("returns true for .ZIP files (case insensitive)", () => {
      const file = new File([""], "test.ZIP", { type: "application/zip" });
      expect(isZipFile(file)).toBe(true);
    });

    it("returns false for non-zip files", () => {
      const txtFile = new File([""], "test.txt", { type: "text/plain" });
      const gzFile = new File([""], "test.gz", { type: "application/gzip" });

      expect(isZipFile(txtFile)).toBe(false);
      expect(isZipFile(gzFile)).toBe(false);
    });
  });

  describe("decompressZip", () => {
    describe("basic functionality", () => {
      it("extracts text files from ZIP", async () => {
        const zipFile = await createZipFile([
          { name: "file1.txt", content: "Hello World" },
          { name: "file2.txt", content: "Goodbye World" },
        ]);

        const result = await decompressZip(zipFile);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe("file1.txt");
        expect(result[0].content).toBe("Hello World");
        expect(result[1].name).toBe("file2.txt");
        expect(result[1].content).toBe("Goodbye World");
      });

      it("extracts files from subdirectories", async () => {
        const zipFile = await createZipFile([
          { name: "folder/subfolder/file.txt", content: "Nested content" },
        ]);

        const result = await decompressZip(zipFile);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("folder/subfolder/file.txt");
        expect(result[0].content).toBe("Nested content");
      });

      it("sorts extracted files by name", async () => {
        const zipFile = await createZipFile([
          { name: "c.txt", content: "C" },
          { name: "a.txt", content: "A" },
          { name: "b.txt", content: "B" },
        ]);

        const result = await decompressZip(zipFile);

        expect(result[0].name).toBe("a.txt");
        expect(result[1].name).toBe("b.txt");
        expect(result[2].name).toBe("c.txt");
      });
    });

    describe("file type filtering", () => {
      it("extracts various text file types", async () => {
        const zipFile = await createZipFile([
          { name: "file.txt", content: "txt" },
          { name: "file.log", content: "log" },
          { name: "file.md", content: "md" },
          { name: "file.json", content: "{}" },
          { name: "file.csv", content: "a,b,c" },
          { name: "file.xml", content: "<xml/>" },
          { name: "file.yaml", content: "key: value" },
          { name: "file.yml", content: "key: value" },
          { name: "file.js", content: "const x = 1;" },
          { name: "file.ts", content: "const x: number = 1;" },
          { name: "file.py", content: "x = 1" },
        ]);

        const result = await decompressZip(zipFile);

        expect(result).toHaveLength(11);
      });

      it("skips non-text files", async () => {
        const zipFile = await createZipFile([
          { name: "file.txt", content: "text" },
          { name: "image.png", content: "binary" },
          { name: "data.bin", content: "binary" },
        ]);

        const result = await decompressZip(zipFile);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("file.txt");
      });
    });

    describe("hidden files and directories", () => {
      it("skips files starting with dot", async () => {
        const zipFile = await createZipFile([
          { name: ".hidden.txt", content: "hidden" },
          { name: "visible.txt", content: "visible" },
        ]);

        const result = await decompressZip(zipFile);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("visible.txt");
      });

      it("skips files in hidden directories", async () => {
        const zipFile = await createZipFile([
          { name: ".hidden/file.txt", content: "hidden" },
          { name: "folder/.hidden/file.txt", content: "hidden in subfolder" },
          { name: "visible/file.txt", content: "visible" },
        ]);

        const result = await decompressZip(zipFile);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("visible/file.txt");
      });

      it("skips __MACOSX directories", async () => {
        const zipFile = await createZipFile([
          { name: "__MACOSX/file.txt", content: "macosx" },
          { name: "folder/__MACOSX/file.txt", content: "macosx in subfolder" },
          { name: "visible.txt", content: "visible" },
        ]);

        const result = await decompressZip(zipFile);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("visible.txt");
      });
    });

    describe("error handling", () => {
      it("throws error for ZIP with no text files", async () => {
        const zipFile = await createZipFile([
          { name: "image.png", content: "binary" },
          { name: "data.bin", content: "binary" },
        ]);

        await expect(decompressZip(zipFile)).rejects.toThrow(
          "No text files found in the ZIP archive"
        );
      });

      it("throws error for empty ZIP", async () => {
        const zipFile = await createZipFile([]);

        await expect(decompressZip(zipFile)).rejects.toThrow(
          "No text files found in the ZIP archive"
        );
      });

      it("throws error for invalid ZIP file", async () => {
        const invalidFile = new File(["not a zip file"], "fake.zip", {
          type: "application/zip",
        });

        await expect(decompressZip(invalidFile)).rejects.toThrow();
      });

      it("throws error for ZIP file exceeding size limit", async () => {
        // 101MB を超えるファイルをシミュレート
        const largeContent = new ArrayBuffer(101 * 1024 * 1024);
        const largeFile = new File([largeContent], "large.zip", {
          type: "application/zip",
        });

        await expect(decompressZip(largeFile)).rejects.toThrow(
          /ZIP file is too large/
        );
      });
    });

    describe("file limits", () => {
      it("throws error when ZIP contains too many files", async () => {
        // 51ファイルを含むZIPを作成
        const files = Array.from({ length: 51 }, (_, i) => ({
          name: `file${i}.txt`,
          content: `content ${i}`,
        }));
        const zipFile = await createZipFile(files);

        await expect(decompressZip(zipFile)).rejects.toThrow(
          /Too many files in ZIP archive/
        );
      });

      it("extracts up to 50 files successfully", async () => {
        const files = Array.from({ length: 50 }, (_, i) => ({
          name: `file${i.toString().padStart(2, "0")}.txt`,
          content: `content ${i}`,
        }));
        const zipFile = await createZipFile(files);

        const result = await decompressZip(zipFile);

        expect(result).toHaveLength(50);
      });
    });

    describe("individual file size limits", () => {
      it("skips files exceeding individual size limit", async () => {
        // 11MBのコンテンツを生成（制限は10MB）
        const largeContent = generateContent(11 * 1024 * 1024);
        const zipFile = await createZipFile([
          { name: "large.txt", content: largeContent },
          { name: "small.txt", content: "small content" },
        ]);

        const result = await decompressZip(zipFile);

        // 大きなファイルはスキップされ、小さなファイルのみ抽出される
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("small.txt");
      });
    });

    describe("unicode and special characters", () => {
      it("handles files with unicode names", async () => {
        const zipFile = await createZipFile([
          { name: "日本語.txt", content: "Japanese content" },
          { name: "émoji_🎉.txt", content: "Emoji content" },
        ]);

        const result = await decompressZip(zipFile);

        expect(result).toHaveLength(2);
      });

      it("handles files with unicode content", async () => {
        const zipFile = await createZipFile([
          { name: "file.txt", content: "日本語テキスト 🎉 émoji" },
        ]);

        const result = await decompressZip(zipFile);

        expect(result[0].content).toBe("日本語テキスト 🎉 émoji");
      });
    });

    describe("extensionless files", () => {
      it("extracts files without extension from ZIP", async () => {
        const zipFile = await createZipFile([
          { name: "Makefile", content: "all:\n\techo hello" },
          { name: "Dockerfile", content: "FROM node:18" },
          { name: "LICENSE", content: "MIT License" },
        ]);

        const result = await decompressZip(zipFile);

        expect(result).toHaveLength(3);
        expect(result.map((f) => f.name)).toContain("Dockerfile");
        expect(result.map((f) => f.name)).toContain("Makefile");
        expect(result.map((f) => f.name)).toContain("LICENSE");
      });

      it("extracts extensionless files from subdirectories", async () => {
        const zipFile = await createZipFile([
          { name: "project/Makefile", content: "build:" },
          { name: "project/src/config", content: "key=value" },
        ]);

        const result = await decompressZip(zipFile);

        expect(result).toHaveLength(2);
        expect(result.map((f) => f.name)).toContain("project/Makefile");
        expect(result.map((f) => f.name)).toContain("project/src/config");
      });

      it("skips binary content even without extension", async () => {
        // バイナリデータ（NULLバイトを含む）
        const binaryContent = "text\x00with\x00nulls";
        const zipFile = await createZipFile([
          { name: "binary_file", content: binaryContent },
          { name: "text_file", content: "plain text" },
        ]);

        const result = await decompressZip(zipFile);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("text_file");
      });
    });

    describe("binary extension filtering", () => {
      it("skips files with known binary extensions", async () => {
        const zipFile = await createZipFile([
          { name: "image.png", content: "fake png" },
          { name: "document.pdf", content: "fake pdf" },
          { name: "data.bin", content: "binary data" },
          { name: "readme.txt", content: "text content" },
        ]);

        const result = await decompressZip(zipFile);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("readme.txt");
      });
    });
  });

  describe("isBinaryContent", () => {
    it("returns false for normal text", () => {
      expect(isBinaryContent("Hello, World!")).toBe(false);
    });

    it("returns false for text with newlines and tabs", () => {
      expect(isBinaryContent("line1\nline2\ttab")).toBe(false);
    });

    it("returns false for unicode text", () => {
      expect(isBinaryContent("日本語テキスト 🎉")).toBe(false);
    });

    it("returns true for content with NULL bytes", () => {
      expect(isBinaryContent("text\x00with\x00nulls")).toBe(true);
    });

    it("returns true for content with many control characters", () => {
      // 10%以上の制御文字を含むコンテンツ
      const controlChars = "\x01\x02\x03\x04\x05\x06\x07\x08";
      const content = controlChars + "text".repeat(10);
      expect(isBinaryContent(content)).toBe(true);
    });

    it("returns false for empty string", () => {
      expect(isBinaryContent("")).toBe(false);
    });

    it("returns false for typical code content", () => {
      const code = `
function hello() {
  console.log("Hello, World!");
}
`;
      expect(isBinaryContent(code)).toBe(false);
    });
  });
});
