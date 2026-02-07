/**
 * アイテムをカテゴリ別にグループ化する汎用関数
 * カテゴリの順序を保持し、空のカテゴリも含める
 */
export function groupByCategory<
  TCategory extends string,
  TItem extends { category: TCategory },
>(
  items: readonly TItem[],
  categoryOrder: readonly TCategory[],
): Map<TCategory, TItem[]> {
  const grouped = new Map<TCategory, TItem[]>();

  for (const category of categoryOrder) {
    grouped.set(category, []);
  }

  for (const item of items) {
    const list = grouped.get(item.category);
    if (list) {
      list.push(item);
    }
  }

  return grouped;
}
