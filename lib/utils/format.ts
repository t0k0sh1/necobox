/**
 * フォーマットユーティリティ
 * ファイルサイズなどの値を人間が読みやすい形式に変換
 */

/**
 * バイト数を人間が読みやすい形式にフォーマット
 * @param bytes バイト数
 * @param decimals 小数点以下の桁数（デフォルト: 2）
 * @returns フォーマットされた文字列（例: "1.5 MB"）
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // 配列の範囲外になる場合（ペタバイト以上）は最大単位で表示
  const index = Math.min(i, sizes.length - 1);

  return (
    Math.round((bytes / Math.pow(k, index)) * Math.pow(10, decimals)) /
      Math.pow(10, decimals) +
    " " +
    sizes[index]
  );
}
