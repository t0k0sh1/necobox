import JSZip from "jszip";

export interface ExtractedFile {
  name: string;
  content: string;
}

/**
 * コンテンツがバイナリデータかどうかを判定
 * NULLバイトの存在や制御文字の割合で判定
 */
export function isBinaryContent(content: string): boolean {
  const sampleSize = Math.min(content.length, 8192);
  const sample = content.slice(0, sampleSize);

  // NULLバイトが含まれていればバイナリ
  if (sample.includes("\0")) return true;

  // 制御文字の割合をチェック（タブ、改行、復帰以外）
  let controlCharCount = 0;
  for (let i = 0; i < sample.length; i++) {
    const charCode = sample.charCodeAt(i);
    // 0x00-0x08: NUL, SOH, STX, ETX, EOT, ENQ, ACK, BEL, BS
    // 0x0E-0x1F: SO, SI, DLE, DC1-DC4, NAK, SYN, ETB, CAN, EM, SUB, ESC, FS, GS, RS, US
    // タブ(0x09), 改行(0x0A), 復帰(0x0D)は許可
    if ((charCode >= 0x00 && charCode <= 0x08) || (charCode >= 0x0E && charCode <= 0x1F)) {
      controlCharCount++;
    }
  }

  // 制御文字が5%以上ならバイナリ
  return sample.length > 0 && controlCharCount / sample.length > 0.05;
}

// 制限値の定義
const MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_FILES_TO_EXTRACT = 50; // 最大抽出ファイル数
const MAX_TOTAL_EXTRACTED_SIZE = 200 * 1024 * 1024; // 200MB total
const MAX_COMPRESSION_RATIO = 100; // 圧縮率の上限（ZIPボム検出用）

/**
 * ZIPファイルを解凍してテキストファイルの内容を取得
 * 複数のテキストファイルが含まれている場合はそれぞれ別のファイルとして返す
 *
 * セキュリティ対策:
 * - ZIPファイルサイズ制限
 * - 個別ファイルサイズ制限
 * - 抽出ファイル数制限
 * - 抽出コンテンツ合計サイズ制限
 * - 圧縮率チェック（ZIPボム検出）
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
    let totalExtractedSize = 0;

    // テキストファイルの拡張子パターン
    const textExtensions = /\.(txt|log|md|json|csv|xml|yaml|yml|conf|cfg|ini|properties|html|htm|css|js|ts|jsx|tsx|py|rb|java|c|cpp|h|hpp|go|rs|sh|bash|zsh|sql|graphql|toml)$/i;

    // バイナリファイルの拡張子パターン（これらは常に除外）
    const binaryExtensions = /\.(png|jpg|jpeg|gif|bmp|ico|webp|pdf|doc|docx|xls|xlsx|exe|dll|so|dylib|class|jar|wasm|ttf|otf|woff|woff2|mp3|mp4|avi|mov|wav|zip|tar|rar|7z|dmg|iso|bin|dat|db|sqlite)$/i;

    // 抽出対象のファイルを収集
    const filesToExtract: { path: string; entry: JSZip.JSZipObject }[] = [];

    zip.forEach((relativePath, zipEntry) => {
      // ディレクトリをスキップ
      if (zipEntry.dir) {
        return;
      }

      // 隠しファイル・フォルダをスキップ（パスのいずれかのセグメントが.で始まる場合）
      const pathSegments = relativePath.split("/");
      const hasHiddenSegment = pathSegments.some(
        (segment) => segment.startsWith(".") || segment.startsWith("__MACOSX")
      );
      if (hasHiddenSegment) {
        return;
      }

      // バイナリ拡張子は常に除外
      if (binaryExtensions.test(relativePath)) {
        return;
      }

      // 拡張子なしファイルかどうかを判定
      const fileName = relativePath.split("/").pop() || "";
      const hasExtension = fileName.includes(".") && !fileName.startsWith(".");

      // テキストファイル、または拡張子なしファイルを抽出対象に含める
      if (textExtensions.test(relativePath) || !hasExtension) {
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
      const uncompressedSize = (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
      if (uncompressedSize && uncompressedSize > MAX_FILE_SIZE) {
        console.warn(`Skipping ${path}: file too large (${formatSize(uncompressedSize)})`);
        continue;
      }

      // 圧縮サイズを取得（利用可能な場合）
      const compressedSize = (entry as unknown as { _data?: { compressedSize?: number } })._data?.compressedSize;

      // ZIPボム検出: 圧縮率が異常に高い場合はスキップ
      if (compressedSize && uncompressedSize && compressedSize > 0) {
        const compressionRatio = uncompressedSize / compressedSize;
        if (compressionRatio > MAX_COMPRESSION_RATIO) {
          console.warn(
            `Skipping ${path}: suspicious compression ratio (${compressionRatio.toFixed(1)}x)`
          );
          continue;
        }
      }

      // 合計サイズの事前チェック（推定値が利用可能な場合）
      if (uncompressedSize && totalExtractedSize + uncompressedSize > MAX_TOTAL_EXTRACTED_SIZE) {
        console.warn(
          `Stopping extraction: total size limit would be exceeded (${formatSize(totalExtractedSize + uncompressedSize)})`
        );
        break;
      }

      try {
        const content = await entry.async("string");

        // 展開後のサイズチェック
        const contentSize = new Blob([content]).size;
        if (contentSize > MAX_FILE_SIZE) {
          console.warn(`Skipping ${path}: extracted content too large (${formatSize(contentSize)})`);
          continue;
        }

        // バイナリ内容チェック（拡張子なしファイルの場合に特に重要）
        if (isBinaryContent(content)) {
          console.warn(`Skipping ${path}: binary content detected`);
          continue;
        }

        // ZIPボム検出: 実際の圧縮率チェック
        if (compressedSize && compressedSize > 0) {
          const actualRatio = contentSize / compressedSize;
          if (actualRatio > MAX_COMPRESSION_RATIO) {
            console.warn(
              `Skipping ${path}: suspicious compression ratio detected (${actualRatio.toFixed(1)}x)`
            );
            continue;
          }
        }

        // 合計サイズチェック
        if (totalExtractedSize + contentSize > MAX_TOTAL_EXTRACTED_SIZE) {
          console.warn(
            `Stopping extraction: total size limit exceeded (${formatSize(totalExtractedSize + contentSize)})`
          );
          break;
        }

        totalExtractedSize += contentSize;
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
    if (error instanceof Error && (error.message.includes("ZIP") || error.message.includes("file"))) {
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
