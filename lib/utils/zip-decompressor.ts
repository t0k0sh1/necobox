import JSZip from "jszip";

export interface ExtractedFile {
  name: string;
  content: string;
}

/**
 * ZIPファイルを解凍してテキストファイルの内容を取得
 * 複数のテキストファイルが含まれている場合はそれぞれ別のファイルとして返す
 */
export async function decompressZip(file: File): Promise<ExtractedFile[]> {
  try {
    const zip = await JSZip.loadAsync(file);
    const extractedFiles: ExtractedFile[] = [];

    // テキストファイルの拡張子パターン
    const textExtensions = /\.(txt|log|md|json|csv|xml|yaml|yml|conf|cfg|ini|properties|html|htm|css|js|ts|jsx|tsx|py|rb|java|c|cpp|h|hpp|go|rs|sh|bash|zsh|sql|graphql|toml)$/i;

    // ZIPファイル内のファイルを処理
    const filePromises: Promise<void>[] = [];

    zip.forEach((relativePath, zipEntry) => {
      // ディレクトリや隠しファイル（__MACOSX等）をスキップ
      if (zipEntry.dir || relativePath.startsWith("__MACOSX") || relativePath.startsWith(".")) {
        return;
      }

      // テキストファイルのみを処理
      if (textExtensions.test(relativePath)) {
        const promise = zipEntry.async("string").then((content) => {
          extractedFiles.push({
            name: relativePath,
            content,
          });
        });
        filePromises.push(promise);
      }
    });

    await Promise.all(filePromises);

    if (extractedFiles.length === 0) {
      throw new Error("No text files found in the ZIP archive");
    }

    // ファイル名でソート
    extractedFiles.sort((a, b) => a.name.localeCompare(b.name));

    return extractedFiles;
  } catch (error) {
    throw new Error(
      `Failed to decompress ZIP file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * ファイルがZIPファイルかどうかを拡張子で判定
 */
export function isZipFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".zip");
}
