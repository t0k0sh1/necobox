/**
 * IPv4/IPv6アドレスの判定ユーティリティ
 *
 * クライアントサイドとサーバーサイドの両方で使用可能な
 * シンプルで保守しやすいIP検証関数を提供
 */

/**
 * IPv4アドレスの各オクテットを検証
 * - 0-255の範囲
 * - 先頭の0は許可しない（0自体を除く）
 */
function isValidIPv4Octet(octet: string): boolean {
  // 空文字列は無効
  if (octet.length === 0) return false;

  // 先頭の0を許可しない（0自体は許可）
  if (octet.length > 1 && octet.startsWith("0")) return false;

  // 数字のみで構成されているか
  if (!/^\d+$/.test(octet)) return false;

  // 0-255の範囲内か
  const num = parseInt(octet, 10);
  return num >= 0 && num <= 255;
}

/**
 * 文字列がIPv4アドレスかどうかを判定
 *
 * 有効な形式:
 * - 192.168.1.1
 * - 0.0.0.0
 * - 255.255.255.255
 *
 * 無効な形式:
 * - 256.1.1.1 (範囲外)
 * - 01.02.03.04 (先頭の0)
 * - 192.168.1 (オクテット不足)
 */
export function isValidIPv4(ip: string): boolean {
  const parts = ip.split(".");

  // IPv4は4つのオクテットで構成される
  if (parts.length !== 4) return false;

  // 各オクテットを検証
  return parts.every(isValidIPv4Octet);
}

/**
 * IPv6の16進数グループを検証
 * - 1-4文字の16進数
 * - 空文字列は圧縮形式で許可される場合あり
 */
function isValidIPv6Group(group: string): boolean {
  // 空文字列は圧縮形式（::）の一部として許可
  if (group.length === 0) return true;

  // 1-4文字の16進数
  if (group.length > 4) return false;

  return /^[0-9a-fA-F]+$/.test(group);
}

/**
 * 文字列がIPv6アドレスかどうかを判定
 *
 * 有効な形式:
 * - 2001:0db8:85a3:0000:0000:8a2e:0370:7334 (完全形式)
 * - 2001:db8:85a3::8a2e:370:7334 (圧縮形式)
 * - ::1 (ループバック)
 * - :: (未指定アドレス)
 *
 * 注意: IPv4-mapped IPv6 (::ffff:192.168.1.1) は現在サポートしていない
 */
export function isValidIPv6(ip: string): boolean {
  // 空文字列は無効
  if (ip.length === 0) return false;

  // :: が複数回出現する場合は無効
  const doubleColonCount = (ip.match(/::/g) || []).length;
  if (doubleColonCount > 1) return false;

  // グループに分割
  const groups = ip.split(":");

  // :: がある場合
  if (doubleColonCount === 1) {
    // 最低2グループ（::のみの場合）、最大8グループ
    if (groups.length < 2 || groups.length > 8) return false;

    // 各グループを検証
    return groups.every(isValidIPv6Group);
  }

  // :: がない場合は8グループ必要
  if (groups.length !== 8) return false;

  // 各グループを検証
  return groups.every((group) => {
    if (group.length === 0) return false;
    return isValidIPv6Group(group);
  });
}

/**
 * 文字列がIPアドレス（IPv4またはIPv6）かどうかを判定
 *
 * 入力値は自動的にトリムされる
 */
export function isValidIP(ip: string): boolean {
  const trimmed = ip.trim();
  if (trimmed.length === 0) return false;

  return isValidIPv4(trimmed) || isValidIPv6(trimmed);
}
