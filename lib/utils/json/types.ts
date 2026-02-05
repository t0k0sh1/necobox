/**
 * JSONエディタ用の型定義
 */

/**
 * バリデーションエラー
 */
export interface ValidationError {
  message: string;
  line?: number;
  column?: number;
}

/**
 * バリデーション警告
 */
export interface ValidationWarning {
  message: string;
  line?: number;
  column?: number;
}

/**
 * バリデーション結果
 */
export interface ValidationResult {
  valid: boolean;
  error?: ValidationError;
  warnings?: ValidationWarning[];
}

/**
 * インデントタイプ
 * 2: 2スペース
 * 4: 4スペース
 * 'tab': タブ
 */
export type IndentType = 2 | 4 | "tab";

/**
 * フォーマットモード
 * 'pretty': 整形（見やすい形式）
 * 'minify': 圧縮（1行表示）
 */
export type FormatMode = "pretty" | "minify";

/**
 * フォーマットオプション
 */
export interface FormatOptions {
  mode: FormatMode;
  indent?: IndentType;
}

/**
 * フォーマット結果
 */
export interface FormatResult {
  success: boolean;
  output?: string;
  error?: ValidationError;
}
