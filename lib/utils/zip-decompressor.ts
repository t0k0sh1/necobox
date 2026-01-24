import JSZip from "jszip";

export interface ExtractedFile {
  name: string;
  content: string;
}

// 制限値の定義
const MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_FILES_TO_EXTRACT = 50; // 最大抽出ファイル数

/**
 * ZIPファイルを解凍してテキストファイルの内容を取得
 * 複数のテキストファイルが含まれている場合はそれぞれ別のファイルとして返す
 */
export async function decompressZip(file: File): Promise<ExtractedFile[]> {
  // ZIPファイルサイズのチェック
  if (file.size > MAX_ZIP_SIZE) {
    throw new Error(
      `ZIP file is too large (${formatSize(file.size)}). Maximum allowed size is ${formatSize(MAX_ZIP_SIZE)}.`
    );
  }

  try {
    const zip = await JSZip.loadAsync(file);
    const extractedFiles: ExtractedFile[] = [];

    // テキストファイルの拡張子パターン
    const textExtensions = /\.(txt|log|md|json|csv|xml|yaml|yml|conf|cfg|ini|properties|html|htm|css|js|ts|jsx|tsx|py|rb|java|c|cpp|h|hpp|go|rs|sh|bash|zsh|sql|graphql|toml)$/i;

    // 抽出対象のファイルを収集
    const filesToExtract: { path: string; entry: JSZip.JSZipObject }[] = [];

    zip.forEach((relativePath, zipEntry) => {
      // ディレクトリや隠しファイル（__MACOSX等）をスキップ
      if (zipEntry.dir || relativePath.startsWith("__MACOSX") || relativePath.startsWith(".")) {
        return;
      }

      // テキストファイルのみを処理
      if (textExtensions.test(relativePath)) {
        filesToExtract.push({ path: relativePath, entry: zipEntry });
      }
    });

    if (filesToExtract.length === 0) {
      throw new Error("No text files found in the ZIP archive");
    }

    // ファイル数制限のチェック
    if (filesToExtract.length > MAX_FILES_TO_EXTRACT) {
      throw new Error(
        `Too many files in ZIP archive (${filesToExtract.length}). Maximum allowed is ${MAX_FILES_TO_EXTRACT} files.`
      );
    }

    // ファイル名でソートしてから処理
    filesToExtract.sort((a, b) => a.path.localeCompare(b.path));

    // ファイルを1つずつ順番に処理（メモリ使用量を抑制）
    for (const { path, entry } of filesToExtract) {
      // 圧縮前のサイズをチェック（利用可能な場合）
      // JSZipでは_data.uncompressedSizeで取得できる場合がある
      const uncompressedSize = (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
      if (uncompressedSize && uncompressedSize > MAX_FILE_SIZE) {
        console.warn(`Skipping ${path}: file too large (${formatSize(uncompressedSize)})`);
        continue;
      }

      try {
        const content = await entry.async("string");

        // 展開後のサイズチェック
        const contentSize = new Blob([content]).size;
        if (contentSize > MAX_FILE_SIZE) {
          console.warn(`Skipping ${path}: extracted content too large (${formatSize(contentSize)})`);
          continue;
        }

        extractedFiles.push({
          name: path,
          content,
        });
      } catch (err) {
        // 個別ファイルの解凍エラーはスキップして続行
        console.warn(`Failed to extract ${path}:`, err);
      }
    }

    if (extractedFiles.length === 0) {
      throw new Error("No text files could be extracted from the ZIP archive");
    }

    return extractedFiles;
  } catch (error) {
    if (error instanceof Error && error.message.includes("ZIP")) {
      throw error;
    }
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

/**
 * バイト数を人間が読みやすい形式にフォーマット
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
