/**
 * クリップボード用TSV処理ユーティリティ
 */

/**
 * クリップボード用（TSV形式）にフィールドをクォートする
 * タブ、改行、ダブルクォートを含む場合はダブルクォートで囲む
 */
export function quoteFieldForClipboard(value: string): string {
  if (value.includes("\t") || value.includes("\n") || value.includes('"')) {
    // ダブルクォートをエスケープ（" -> ""）してダブルクォートで囲む
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

/**
 * ダブルクォートを考慮してTSV形式のテキストをパース
 */
export function parseTsvWithQuotes(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        // 次の文字もダブルクォートならエスケープされたダブルクォート
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentField += '"';
          i += 2;
        } else {
          // クォート終了
          inQuotes = false;
          i++;
        }
      } else {
        currentField += char;
        i++;
      }
    } else {
      if (char === '"') {
        if (currentField === "") {
          // クォート開始（フィールド先頭のダブルクォートのみをクォート開始として扱う）
          inQuotes = true;
        } else {
          // フィールド中のダブルクォートはリテラルとして扱う
          currentField += '"';
        }
        i++;
      } else if (char === "\t") {
        // フィールド区切り
        currentRow.push(currentField);
        currentField = "";
        i++;
      } else if (char === "\n") {
        // 行区切り
        currentRow.push(currentField);
        currentField = "";
        rows.push(currentRow);
        currentRow = [];
        i++;
      } else {
        currentField += char;
        i++;
      }
    }
  }

  // 最後のフィールドと行を追加
  if (currentField !== "" || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  // 末尾の空行を除去
  if (
    rows.length > 0 &&
    rows[rows.length - 1].length === 1 &&
    rows[rows.length - 1][0] === ""
  ) {
    rows.pop();
  }

  return rows;
}

/**
 * クリップボードテキストを解析して更新配列を生成
 * ダブルクォートで囲まれたフィールド（改行を含む）に対応
 * @param text クリップボードのテキスト
 * @param startRow 開始行
 * @param startCol 開始列
 * @param maxRows 最大行数（-1で無制限、ヘッダー行は別カウント）
 * @param maxCols 最大列数
 */
export function parseClipboardText(
  text: string,
  startRow: number,
  startCol: number,
  maxRows: number,
  maxCols: number
): Array<{ row: number; col: number; value: string }> {
  // CRLF/CR を LF に正規化
  const normalizedText = text.replace(/\r\n?/g, "\n");

  // ダブルクォートを考慮してTSVをパース
  const rows = parseTsvWithQuotes(normalizedText);

  const updates: Array<{ row: number; col: number; value: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = startRow + i;
    // ヘッダー行（row === -1）は許可、データ行は範囲内のみ
    if (row !== -1 && maxRows !== -1 && row >= maxRows) break;

    const cells = rows[i];
    for (let j = 0; j < cells.length; j++) {
      const col = startCol + j;
      if (col >= maxCols) break;
      updates.push({ row, col, value: cells[j] });
    }
  }

  return updates;
}
