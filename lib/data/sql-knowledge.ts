import type { KnowledgeItem } from "@/lib/types/knowledge";

// SQLノウハウデータ
export const SQL_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: "join-patterns",
    situationEn: "Choosing the right JOIN pattern",
    situationJa: "テーブルを結合するパターンを知りたい",
    explanationEn:
      "INNER JOIN returns only matching rows. LEFT JOIN returns all left table rows plus matches. CROSS JOIN produces a Cartesian product. Choose based on whether you need unmatched rows.",
    explanationJa:
      "INNER JOIN は一致する行のみ返します。LEFT JOIN は左テーブルの全行と一致行を返します。CROSS JOIN はデカルト積を生成します。一致しない行が必要かどうかで使い分けます。",
    snippets: [
      {
        labelEn: "INNER JOIN",
        labelJa: "INNER JOIN（一致のみ）",
        code: "SELECT *\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.id;",
      },
      {
        labelEn: "LEFT JOIN (include unmatched)",
        labelJa: "LEFT JOIN（左テーブルの全行を保持）",
        code: "SELECT *\nFROM customers c\nLEFT JOIN orders o ON c.id = o.customer_id;",
        noteEn: "Unmatched rows in the right table will have NULL values",
        noteJa: "右テーブルに一致がない行はNULLになる",
      },
      {
        labelEn: "CROSS JOIN (Cartesian product)",
        labelJa: "CROSS JOIN（デカルト積）",
        code: "SELECT *\nFROM sizes\nCROSS JOIN colors;",
        noteEn: "Produces every combination of rows from both tables",
        noteJa: "両テーブルの全組み合わせを生成",
      },
      {
        labelEn: "Self JOIN",
        labelJa: "自己結合",
        code: "SELECT e.name, m.name AS manager\nFROM employees e\nLEFT JOIN employees m ON e.manager_id = m.id;",
      },
    ],
    tags: ["JOIN", "INNER", "LEFT", "CROSS"],
  },
  {
    id: "subquery-vs-join",
    situationEn: "Choosing between subqueries and JOINs",
    situationJa: "サブクエリと JOIN を使い分けたい",
    explanationEn:
      "JOINs are generally preferred for combining data from multiple tables. Subqueries are useful for filtering (EXISTS, IN) or when you need intermediate aggregation. CTEs (WITH clause) improve readability for complex queries.",
    explanationJa:
      "複数テーブルのデータ結合にはJOINが一般的に推奨されます。サブクエリはフィルタリング（EXISTS, IN）や中間集計が必要な場合に便利です。CTE（WITH句）は複雑なクエリの可読性を向上させます。",
    snippets: [
      {
        labelEn: "Subquery with IN",
        labelJa: "INでのサブクエリ",
        code: "SELECT *\nFROM products\nWHERE category_id IN (\n  SELECT id FROM categories WHERE active = true\n);",
      },
      {
        labelEn: "Correlated subquery with EXISTS",
        labelJa: "EXISTS での相関サブクエリ",
        code: "SELECT *\nFROM customers c\nWHERE EXISTS (\n  SELECT 1 FROM orders o WHERE o.customer_id = c.id\n);",
        noteEn: "Often faster than IN for large datasets",
        noteJa: "大規模データセットではINより高速なことが多い",
      },
      {
        labelEn: "CTE (Common Table Expression)",
        labelJa: "CTE（共通テーブル式）",
        code: "WITH monthly_sales AS (\n  SELECT customer_id, SUM(amount) AS total\n  FROM orders\n  GROUP BY customer_id\n)\nSELECT c.name, ms.total\nFROM customers c\nJOIN monthly_sales ms ON c.id = ms.customer_id;",
      },
    ],
    tags: ["subquery", "JOIN", "performance"],
  },
  {
    id: "group-by-having",
    situationEn: "Aggregating and filtering grouped data",
    situationJa: "集計してフィルタリングしたい",
    explanationEn:
      "GROUP BY groups rows sharing column values. Use aggregate functions (COUNT, SUM, AVG, etc.) with it. HAVING filters groups after aggregation, while WHERE filters rows before grouping.",
    explanationJa:
      "GROUP BY はカラム値が同じ行をグループ化します。集約関数（COUNT, SUM, AVGなど）と組み合わせます。HAVING は集約後にグループをフィルタし、WHERE はグループ化前に行をフィルタします。",
    snippets: [
      {
        labelEn: "Basic GROUP BY with COUNT",
        labelJa: "COUNTでの基本GROUP BY",
        code: "SELECT department, COUNT(*) AS employee_count\nFROM employees\nGROUP BY department;",
      },
      {
        labelEn: "HAVING (filter after aggregation)",
        labelJa: "HAVING（集約後のフィルタ）",
        code: "SELECT department, AVG(salary) AS avg_salary\nFROM employees\nGROUP BY department\nHAVING AVG(salary) > 50000;",
        noteEn: "WHERE cannot use aggregate functions; use HAVING instead",
        noteJa: "WHEREでは集約関数を使えない。HAVINGを使用する",
      },
      {
        labelEn: "Multiple aggregations",
        labelJa: "複数の集約",
        code: "SELECT category,\n  COUNT(*) AS cnt,\n  SUM(price) AS total,\n  AVG(price) AS avg_price\nFROM products\nGROUP BY category;",
      },
    ],
    tags: ["GROUP BY", "HAVING", "COUNT"],
  },
  {
    id: "window-functions",
    situationEn: "Calculating rankings and running totals with window functions",
    situationJa: "ランキングや累計をウィンドウ関数で計算したい",
    explanationEn:
      "Window functions perform calculations across related rows without collapsing them into groups. OVER() defines the window. PARTITION BY groups rows, ORDER BY determines ordering within each partition.",
    explanationJa:
      "ウィンドウ関数はグループに集約せずに関連行にまたがった計算を行います。OVER()でウィンドウを定義します。PARTITION BYで行をグループ化し、ORDER BYで各パーティション内の順序を決定します。",
    snippets: [
      {
        labelEn: "ROW_NUMBER (sequential numbering)",
        labelJa: "ROW_NUMBER（連番の付与）",
        code: "SELECT name, department, salary,\n  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rank\nFROM employees;",
      },
      {
        labelEn: "RANK (with gaps for ties)",
        labelJa: "RANK（同順位にギャップあり）",
        code: "SELECT name, score,\n  RANK() OVER (ORDER BY score DESC) AS ranking\nFROM students;",
        noteEn: "DENSE_RANK() has no gaps (1,2,2,3 instead of 1,2,2,4)",
        noteJa: "DENSE_RANK()はギャップなし（1,2,2,4ではなく1,2,2,3）",
      },
      {
        labelEn: "Running total with SUM OVER",
        labelJa: "SUM OVERでの累計",
        code: "SELECT date, amount,\n  SUM(amount) OVER (ORDER BY date) AS running_total\nFROM transactions;",
      },
      {
        labelEn: "LAG / LEAD (access previous/next row)",
        labelJa: "LAG / LEAD（前後の行を参照）",
        code: "SELECT date, price,\n  LAG(price) OVER (ORDER BY date) AS prev_price,\n  price - LAG(price) OVER (ORDER BY date) AS diff\nFROM stock_prices;",
      },
    ],
    tags: ["RANK", "ROW_NUMBER", "SUM OVER"],
  },
  {
    id: "upsert-on-conflict",
    situationEn: "Inserting or updating on duplicate key",
    situationJa: "INSERT で重複時に更新したい",
    explanationEn:
      "UPSERT handles the common pattern of 'insert if new, update if exists'. PostgreSQL uses ON CONFLICT, MySQL uses ON DUPLICATE KEY UPDATE, and SQL standard MERGE works across databases.",
    explanationJa:
      "UPSERT は「新規なら挿入、既存なら更新」というパターンを扱います。PostgreSQL は ON CONFLICT、MySQL は ON DUPLICATE KEY UPDATE、SQL 標準の MERGE は複数のDBで動作します。",
    snippets: [
      {
        labelEn: "PostgreSQL: ON CONFLICT DO UPDATE",
        labelJa: "PostgreSQL: ON CONFLICT DO UPDATE",
        code: "INSERT INTO users (email, name)\nVALUES ('a@example.com', 'Alice')\nON CONFLICT (email)\nDO UPDATE SET name = EXCLUDED.name;",
      },
      {
        labelEn: "MySQL: ON DUPLICATE KEY UPDATE",
        labelJa: "MySQL: ON DUPLICATE KEY UPDATE",
        code: "INSERT INTO users (email, name)\nVALUES ('a@example.com', 'Alice')\nON DUPLICATE KEY UPDATE name = VALUES(name);",
      },
      {
        labelEn: "SQL Standard: MERGE",
        labelJa: "SQL標準: MERGE",
        code: "MERGE INTO target t\nUSING source s ON t.id = s.id\nWHEN MATCHED THEN UPDATE SET t.name = s.name\nWHEN NOT MATCHED THEN INSERT (id, name) VALUES (s.id, s.name);",
      },
    ],
    tags: ["UPSERT", "ON CONFLICT", "MERGE"],
  },
  {
    id: "explain-plan",
    situationEn: "Reading execution plans to optimize queries",
    situationJa: "実行計画を読んでクエリを最適化したい",
    explanationEn:
      "EXPLAIN shows how the database will execute your query. Look for sequential scans on large tables (add indexes), high cost estimates, and nested loops with large row counts. ANALYZE runs the query to show actual vs estimated times.",
    explanationJa:
      "EXPLAIN はデータベースがクエリをどう実行するかを表示します。大きなテーブルの順次スキャン（インデックス追加を検討）、高コスト見積、大量行のネストループに注目してください。ANALYZE はクエリを実行して実測値を表示します。",
    snippets: [
      {
        labelEn: "PostgreSQL: EXPLAIN ANALYZE",
        labelJa: "PostgreSQL: EXPLAIN ANALYZE",
        code: "EXPLAIN ANALYZE\nSELECT * FROM orders WHERE customer_id = 123;",
        noteEn: "Actually executes the query to show real timing",
        noteJa: "クエリを実際に実行して実測値を表示",
      },
      {
        labelEn: "MySQL: EXPLAIN with FORMAT",
        labelJa: "MySQL: FORMAT付きEXPLAIN",
        code: "EXPLAIN FORMAT=JSON\nSELECT * FROM orders WHERE customer_id = 123;",
      },
      {
        labelEn: "Create an index to improve performance",
        labelJa: "インデックスを作成してパフォーマンス改善",
        code: "CREATE INDEX idx_orders_customer\nON orders (customer_id);",
        noteEn: "Add indexes on columns used in WHERE, JOIN, and ORDER BY",
        noteJa: "WHERE, JOIN, ORDER BYで使うカラムにインデックスを追加",
      },
    ],
    tags: ["EXPLAIN", "ANALYZE", "index"],
  },
  {
    id: "null-handling",
    situationEn: "Handling NULL values correctly",
    situationJa: "NULLの比較・変換を正しく扱いたい",
    explanationEn:
      "NULL represents unknown/missing data. It cannot be compared with = or !=; use IS NULL / IS NOT NULL. COALESCE returns the first non-null value. NULLIF returns NULL if two values are equal.",
    explanationJa:
      "NULLは不明・欠損データを表します。= や != では比較できず、IS NULL / IS NOT NULL を使います。COALESCE は最初の非NULL値を返します。NULLIF は2つの値が等しい場合にNULLを返します。",
    snippets: [
      {
        labelEn: "Check for NULL",
        labelJa: "NULLチェック",
        code: "SELECT * FROM users WHERE phone IS NULL;",
        noteEn: "Never use = NULL or != NULL — they always return unknown",
        noteJa: "= NULL や != NULL は常にunknownを返すので使わない",
      },
      {
        labelEn: "COALESCE (fallback value)",
        labelJa: "COALESCE（代替値）",
        code: "SELECT name, COALESCE(nickname, name) AS display_name\nFROM users;",
        noteEn: "Returns the first non-null argument",
        noteJa: "最初の非NULL引数を返す",
      },
      {
        labelEn: "NULLIF (return NULL if equal)",
        labelJa: "NULLIF（等しければNULLを返す）",
        code: "SELECT amount / NULLIF(quantity, 0) AS unit_price\nFROM order_items;",
        noteEn: "Prevents division by zero by converting 0 to NULL",
        noteJa: "0をNULLに変換してゼロ除算を防止",
      },
      {
        labelEn: "CASE with NULL",
        labelJa: "CASEでのNULL処理",
        code: "SELECT name,\n  CASE WHEN email IS NOT NULL THEN 'verified'\n       ELSE 'pending'\n  END AS status\nFROM users;",
      },
    ],
    tags: ["NULL", "COALESCE", "NULLIF", "IS NULL"],
  },
];
