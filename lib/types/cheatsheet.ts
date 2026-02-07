import type { ReactNode } from "react";

export interface CategoryColors {
  badge: string;
  bg: string;
}

export interface CheatsheetConfig<TCategory extends string, TItem> {
  /** カテゴリの表示順序 */
  categoryOrder: readonly TCategory[];
  /** カテゴリ別にグループ化されたデータを取得 */
  getGroupedData: () => Map<TCategory, TItem[]>;
  /** カテゴリごとの色設定 */
  categoryColors: Record<TCategory, CategoryColors>;
  /** 翻訳キーのプレフィックス（例: "gitCommands"） */
  translationPrefix: string;
  /** 検索対象のテキストを返す */
  getSearchableTexts: (item: TItem) => string[];
  /** アイテムの一意キーを返す */
  getItemKey: (item: TItem) => string;
  /** コピー対象のテキストを返す */
  getCopyText: (item: TItem) => string;
  /** アイテム行のメインコンテンツを描画 */
  renderItemContent: (item: TItem, locale: string) => ReactNode;
  /** 展開時の詳細セクションを描画（省略可） */
  renderItemDetail?: (
    item: TItem,
    locale: string,
    t: (key: string) => string,
  ) => ReactNode;
}
