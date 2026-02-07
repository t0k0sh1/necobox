import { groupByCategory } from "./utils";

// SQL構文のカテゴリ
export type SqlSyntaxCategory =
  | "select"
  | "join"
  | "aggregate"
  | "subquery"
  | "window_function"
  | "dml"
  | "ddl"
  | "constraint";

// SQL構文の型
export interface SqlSyntax {
  syntax: string;
  nameEn: string;
  nameJa: string;
  category: SqlSyntaxCategory;
  descriptionEn: string;
  descriptionJa: string;
  exampleSql: string;
  notes?: { en: string; ja: string };
}

// カテゴリの表示順
export const SQL_CATEGORY_ORDER: SqlSyntaxCategory[] = [
  "select",
  "join",
  "aggregate",
  "subquery",
  "window_function",
  "dml",
  "ddl",
  "constraint",
];

// SQL構文一覧
export const SQL_SYNTAXES: SqlSyntax[] = [
  // SELECT (select)
  {
    syntax: "SELECT ... FROM ...",
    nameEn: "Basic SELECT",
    nameJa: "基本的なSELECT",
    category: "select",
    descriptionEn: "Retrieve data from one or more tables.",
    descriptionJa: "1つ以上のテーブルからデータを取得します。",
    exampleSql: "SELECT name, email\nFROM users\nWHERE active = true;",
  },
  {
    syntax: "SELECT DISTINCT",
    nameEn: "Remove duplicates",
    nameJa: "重複の除去",
    category: "select",
    descriptionEn: "Return only distinct (unique) values.",
    descriptionJa: "一意の値のみを返します。",
    exampleSql: "SELECT DISTINCT department\nFROM employees;",
  },
  {
    syntax: "WHERE",
    nameEn: "Filter rows",
    nameJa: "行のフィルタリング",
    category: "select",
    descriptionEn: "Filter rows based on specified conditions.",
    descriptionJa: "指定した条件に基づいて行をフィルタリングします。",
    exampleSql: "SELECT *\nFROM orders\nWHERE amount > 100\n  AND status = 'completed';",
  },
  {
    syntax: "ORDER BY",
    nameEn: "Sort results",
    nameJa: "結果のソート",
    category: "select",
    descriptionEn: "Sort the result set by one or more columns.",
    descriptionJa: "1つ以上の列で結果セットをソートします。",
    exampleSql: "SELECT name, created_at\nFROM users\nORDER BY created_at DESC;",
  },
  {
    syntax: "LIMIT / OFFSET",
    nameEn: "Pagination",
    nameJa: "ページネーション",
    category: "select",
    descriptionEn: "Limit the number of rows returned and skip rows.",
    descriptionJa: "返される行数を制限し、行をスキップします。",
    exampleSql: "SELECT *\nFROM products\nORDER BY id\nLIMIT 10 OFFSET 20;",
    notes: {
      en: "SQL Server uses TOP or OFFSET FETCH. Oracle uses FETCH FIRST n ROWS ONLY.",
      ja: "SQL Serverでは TOP または OFFSET FETCH を使用。Oracleでは FETCH FIRST n ROWS ONLY を使用。",
    },
  },
  {
    syntax: "LIKE / ILIKE",
    nameEn: "Pattern matching",
    nameJa: "パターンマッチング",
    category: "select",
    descriptionEn: "Filter rows using pattern matching with wildcards.",
    descriptionJa: "ワイルドカードを使ったパターンマッチングで行をフィルタリングします。",
    exampleSql: "SELECT *\nFROM users\nWHERE name LIKE 'John%'\n  OR email LIKE '%@example.com';",
    notes: {
      en: "ILIKE is PostgreSQL-specific for case-insensitive matching.",
      ja: "ILIKE は PostgreSQL 固有の大文字小文字を区別しないマッチング。",
    },
  },
  {
    syntax: "IN / NOT IN",
    nameEn: "Value list match",
    nameJa: "値リストのマッチング",
    category: "select",
    descriptionEn: "Check if a value matches any value in a list.",
    descriptionJa: "値がリスト内のいずれかの値と一致するか確認します。",
    exampleSql: "SELECT *\nFROM orders\nWHERE status IN ('pending', 'processing');",
  },
  {
    syntax: "BETWEEN",
    nameEn: "Range filter",
    nameJa: "範囲フィルタ",
    category: "select",
    descriptionEn: "Filter values within a range (inclusive).",
    descriptionJa: "範囲内の値をフィルタリングします（両端含む）。",
    exampleSql: "SELECT *\nFROM events\nWHERE event_date BETWEEN '2025-01-01'\n  AND '2025-12-31';",
  },
  {
    syntax: "CASE WHEN",
    nameEn: "Conditional expression",
    nameJa: "条件式",
    category: "select",
    descriptionEn: "Add conditional logic to queries.",
    descriptionJa: "クエリに条件分岐ロジックを追加します。",
    exampleSql: "SELECT name,\n  CASE\n    WHEN score >= 90 THEN 'A'\n    WHEN score >= 80 THEN 'B'\n    ELSE 'C'\n  END AS grade\nFROM students;",
  },
  {
    syntax: "COALESCE / NULLIF",
    nameEn: "NULL handling",
    nameJa: "NULL処理",
    category: "select",
    descriptionEn: "Handle NULL values in expressions.",
    descriptionJa: "式内のNULL値を処理します。",
    exampleSql: "SELECT\n  COALESCE(nickname, name) AS display_name,\n  NULLIF(status, 'unknown') AS status\nFROM users;",
  },

  // JOIN (join)
  {
    syntax: "INNER JOIN",
    nameEn: "Inner Join",
    nameJa: "内部結合",
    category: "join",
    descriptionEn: "Return rows that have matching values in both tables.",
    descriptionJa: "両方のテーブルで一致する値を持つ行を返します。",
    exampleSql: "SELECT u.name, o.total\nFROM users u\nINNER JOIN orders o\n  ON u.id = o.user_id;",
  },
  {
    syntax: "LEFT JOIN",
    nameEn: "Left Outer Join",
    nameJa: "左外部結合",
    category: "join",
    descriptionEn: "Return all rows from the left table, and matched rows from the right table.",
    descriptionJa: "左テーブルのすべての行と、右テーブルの一致する行を返します。",
    exampleSql: "SELECT u.name, o.total\nFROM users u\nLEFT JOIN orders o\n  ON u.id = o.user_id;",
  },
  {
    syntax: "RIGHT JOIN",
    nameEn: "Right Outer Join",
    nameJa: "右外部結合",
    category: "join",
    descriptionEn: "Return all rows from the right table, and matched rows from the left table.",
    descriptionJa: "右テーブルのすべての行と、左テーブルの一致する行を返します。",
    exampleSql: "SELECT u.name, o.total\nFROM users u\nRIGHT JOIN orders o\n  ON u.id = o.user_id;",
  },
  {
    syntax: "FULL OUTER JOIN",
    nameEn: "Full Outer Join",
    nameJa: "完全外部結合",
    category: "join",
    descriptionEn: "Return all rows when there is a match in either left or right table.",
    descriptionJa: "左右いずれかのテーブルに一致がある場合、すべての行を返します。",
    exampleSql: "SELECT u.name, o.total\nFROM users u\nFULL OUTER JOIN orders o\n  ON u.id = o.user_id;",
    notes: {
      en: "MySQL does not support FULL OUTER JOIN directly; use UNION of LEFT and RIGHT JOIN.",
      ja: "MySQLでは FULL OUTER JOIN を直接サポートしていません。LEFT JOIN と RIGHT JOIN の UNION を使用します。",
    },
  },
  {
    syntax: "CROSS JOIN",
    nameEn: "Cross Join",
    nameJa: "クロス結合",
    category: "join",
    descriptionEn: "Return the Cartesian product of both tables.",
    descriptionJa: "両テーブルの直積（デカルト積）を返します。",
    exampleSql: "SELECT c.name, s.size\nFROM colors c\nCROSS JOIN sizes s;",
  },
  {
    syntax: "SELF JOIN",
    nameEn: "Self Join",
    nameJa: "自己結合",
    category: "join",
    descriptionEn: "Join a table to itself.",
    descriptionJa: "テーブルを自分自身と結合します。",
    exampleSql: "SELECT e.name, m.name AS manager\nFROM employees e\nLEFT JOIN employees m\n  ON e.manager_id = m.id;",
  },

  // 集約 (aggregate)
  {
    syntax: "GROUP BY",
    nameEn: "Group By",
    nameJa: "グループ化",
    category: "aggregate",
    descriptionEn: "Group rows that have the same values into summary rows.",
    descriptionJa: "同じ値を持つ行をサマリー行にグループ化します。",
    exampleSql: "SELECT department, COUNT(*) AS count\nFROM employees\nGROUP BY department;",
  },
  {
    syntax: "HAVING",
    nameEn: "Filter Groups",
    nameJa: "グループのフィルタリング",
    category: "aggregate",
    descriptionEn: "Filter groups after aggregation (like WHERE for GROUP BY).",
    descriptionJa: "集約後のグループをフィルタリングします（GROUP BY用のWHERE）。",
    exampleSql: "SELECT department, AVG(salary) AS avg_sal\nFROM employees\nGROUP BY department\nHAVING AVG(salary) > 50000;",
  },
  {
    syntax: "COUNT / SUM / AVG / MIN / MAX",
    nameEn: "Aggregate Functions",
    nameJa: "集約関数",
    category: "aggregate",
    descriptionEn: "Perform calculations on a set of values and return a single value.",
    descriptionJa: "値のセットに対して計算を実行し、単一の値を返します。",
    exampleSql: "SELECT\n  COUNT(*) AS total,\n  SUM(amount) AS total_amount,\n  AVG(amount) AS avg_amount,\n  MIN(amount) AS min_amount,\n  MAX(amount) AS max_amount\nFROM orders;",
  },
  {
    syntax: "GROUP_CONCAT / STRING_AGG",
    nameEn: "String Aggregation",
    nameJa: "文字列の集約",
    category: "aggregate",
    descriptionEn: "Concatenate values from multiple rows into a single string.",
    descriptionJa: "複数行の値を1つの文字列に連結します。",
    exampleSql: "-- PostgreSQL\nSELECT department,\n  STRING_AGG(name, ', ') AS members\nFROM employees\nGROUP BY department;",
    notes: {
      en: "MySQL uses GROUP_CONCAT(), PostgreSQL uses STRING_AGG(), SQL Server uses STRING_AGG().",
      ja: "MySQLでは GROUP_CONCAT()、PostgreSQLでは STRING_AGG()、SQL Serverでは STRING_AGG() を使用。",
    },
  },

  // サブクエリ (subquery)
  {
    syntax: "Subquery in WHERE",
    nameEn: "Subquery in WHERE",
    nameJa: "WHERE内のサブクエリ",
    category: "subquery",
    descriptionEn: "Use a query result as a condition in the WHERE clause.",
    descriptionJa: "クエリの結果をWHERE句の条件として使用します。",
    exampleSql: "SELECT *\nFROM employees\nWHERE department_id IN (\n  SELECT id FROM departments\n  WHERE location = 'Tokyo'\n);",
  },
  {
    syntax: "EXISTS / NOT EXISTS",
    nameEn: "Existence Check",
    nameJa: "存在チェック",
    category: "subquery",
    descriptionEn: "Check for the existence of rows in a subquery.",
    descriptionJa: "サブクエリに行が存在するかチェックします。",
    exampleSql: "SELECT *\nFROM customers c\nWHERE EXISTS (\n  SELECT 1 FROM orders o\n  WHERE o.customer_id = c.id\n);",
  },
  {
    syntax: "CTE (WITH)",
    nameEn: "Common Table Expression",
    nameJa: "共通テーブル式（CTE）",
    category: "subquery",
    descriptionEn: "Define temporary named result sets that can be referenced within the query.",
    descriptionJa: "クエリ内で参照可能な一時的な名前付き結果セットを定義します。",
    exampleSql: "WITH active_users AS (\n  SELECT * FROM users\n  WHERE active = true\n)\nSELECT department, COUNT(*)\nFROM active_users\nGROUP BY department;",
  },
  {
    syntax: "Recursive CTE",
    nameEn: "Recursive CTE",
    nameJa: "再帰CTE",
    category: "subquery",
    descriptionEn: "A CTE that references itself to handle hierarchical or recursive data.",
    descriptionJa: "階層的または再帰的なデータを処理するために自身を参照するCTE。",
    exampleSql: "WITH RECURSIVE tree AS (\n  SELECT id, name, parent_id, 0 AS depth\n  FROM categories\n  WHERE parent_id IS NULL\n  UNION ALL\n  SELECT c.id, c.name, c.parent_id,\n    t.depth + 1\n  FROM categories c\n  JOIN tree t ON c.parent_id = t.id\n)\nSELECT * FROM tree;",
  },

  // ウィンドウ関数 (window_function)
  {
    syntax: "ROW_NUMBER()",
    nameEn: "Row Number",
    nameJa: "行番号",
    category: "window_function",
    descriptionEn: "Assign a unique sequential integer to rows within a partition.",
    descriptionJa: "パーティション内の行に一意の連番を割り当てます。",
    exampleSql: "SELECT name, department,\n  ROW_NUMBER() OVER (\n    PARTITION BY department\n    ORDER BY salary DESC\n  ) AS rank\nFROM employees;",
  },
  {
    syntax: "RANK() / DENSE_RANK()",
    nameEn: "Ranking",
    nameJa: "ランキング",
    category: "window_function",
    descriptionEn: "Assign a rank to each row. RANK skips numbers on ties, DENSE_RANK does not.",
    descriptionJa: "各行にランクを割り当てます。RANKは同順位でスキップし、DENSE_RANKはスキップしません。",
    exampleSql: "SELECT name, score,\n  RANK() OVER (ORDER BY score DESC) AS rank,\n  DENSE_RANK() OVER (\n    ORDER BY score DESC\n  ) AS dense_rank\nFROM students;",
  },
  {
    syntax: "LAG() / LEAD()",
    nameEn: "Access adjacent rows",
    nameJa: "前後の行へのアクセス",
    category: "window_function",
    descriptionEn: "Access data from a previous (LAG) or next (LEAD) row.",
    descriptionJa: "前の行（LAG）または次の行（LEAD）のデータにアクセスします。",
    exampleSql: "SELECT date, revenue,\n  LAG(revenue) OVER (\n    ORDER BY date\n  ) AS prev_revenue,\n  revenue - LAG(revenue) OVER (\n    ORDER BY date\n  ) AS diff\nFROM daily_sales;",
  },
  {
    syntax: "SUM() OVER / running totals",
    nameEn: "Window Aggregate",
    nameJa: "ウィンドウ集約",
    category: "window_function",
    descriptionEn: "Calculate running totals or moving averages using window frames.",
    descriptionJa: "ウィンドウフレームを使用して累積合計や移動平均を計算します。",
    exampleSql: "SELECT date, amount,\n  SUM(amount) OVER (\n    ORDER BY date\n    ROWS BETWEEN UNBOUNDED PRECEDING\n      AND CURRENT ROW\n  ) AS running_total\nFROM transactions;",
  },

  // DML (dml)
  {
    syntax: "INSERT INTO",
    nameEn: "Insert Rows",
    nameJa: "行の挿入",
    category: "dml",
    descriptionEn: "Insert new rows into a table.",
    descriptionJa: "テーブルに新しい行を挿入します。",
    exampleSql: "INSERT INTO users (name, email)\nVALUES ('Alice', 'alice@example.com');",
  },
  {
    syntax: "INSERT INTO ... SELECT",
    nameEn: "Insert from Select",
    nameJa: "SELECTからの挿入",
    category: "dml",
    descriptionEn: "Insert rows from a query result.",
    descriptionJa: "クエリ結果から行を挿入します。",
    exampleSql: "INSERT INTO archive_orders\nSELECT * FROM orders\nWHERE created_at < '2024-01-01';",
  },
  {
    syntax: "UPDATE ... SET",
    nameEn: "Update Rows",
    nameJa: "行の更新",
    category: "dml",
    descriptionEn: "Modify existing rows in a table.",
    descriptionJa: "テーブル内の既存の行を更新します。",
    exampleSql: "UPDATE users\nSET email = 'new@example.com',\n    updated_at = NOW()\nWHERE id = 1;",
  },
  {
    syntax: "DELETE FROM",
    nameEn: "Delete Rows",
    nameJa: "行の削除",
    category: "dml",
    descriptionEn: "Delete rows from a table.",
    descriptionJa: "テーブルから行を削除します。",
    exampleSql: "DELETE FROM sessions\nWHERE expires_at < NOW();",
  },
  {
    syntax: "UPSERT (ON CONFLICT / MERGE)",
    nameEn: "Upsert",
    nameJa: "アップサート",
    category: "dml",
    descriptionEn: "Insert or update if a conflict occurs.",
    descriptionJa: "競合が発生した場合に挿入または更新します。",
    exampleSql: "-- PostgreSQL\nINSERT INTO users (id, name, email)\nVALUES (1, 'Alice', 'alice@example.com')\nON CONFLICT (id)\nDO UPDATE SET\n  name = EXCLUDED.name,\n  email = EXCLUDED.email;",
    notes: {
      en: "PostgreSQL uses ON CONFLICT, MySQL uses ON DUPLICATE KEY UPDATE, SQL Server uses MERGE.",
      ja: "PostgreSQLでは ON CONFLICT、MySQLでは ON DUPLICATE KEY UPDATE、SQL Serverでは MERGE を使用。",
    },
  },
  {
    syntax: "TRUNCATE TABLE",
    nameEn: "Truncate Table",
    nameJa: "テーブルの切り詰め",
    category: "dml",
    descriptionEn: "Remove all rows from a table quickly without logging individual row deletions.",
    descriptionJa: "個別の行削除をログに記録せず、テーブルからすべての行を高速に削除します。",
    exampleSql: "TRUNCATE TABLE temp_data;",
  },

  // DDL (ddl)
  {
    syntax: "CREATE TABLE",
    nameEn: "Create Table",
    nameJa: "テーブル作成",
    category: "ddl",
    descriptionEn: "Create a new table in the database.",
    descriptionJa: "データベースに新しいテーブルを作成します。",
    exampleSql: "CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(100) NOT NULL,\n  email VARCHAR(255) UNIQUE,\n  created_at TIMESTAMP DEFAULT NOW()\n);",
  },
  {
    syntax: "ALTER TABLE",
    nameEn: "Alter Table",
    nameJa: "テーブル変更",
    category: "ddl",
    descriptionEn: "Modify the structure of an existing table.",
    descriptionJa: "既存のテーブルの構造を変更します。",
    exampleSql: "ALTER TABLE users\n  ADD COLUMN phone VARCHAR(20),\n  DROP COLUMN fax,\n  ALTER COLUMN name SET NOT NULL;",
  },
  {
    syntax: "DROP TABLE",
    nameEn: "Drop Table",
    nameJa: "テーブル削除",
    category: "ddl",
    descriptionEn: "Remove a table and all its data from the database.",
    descriptionJa: "データベースからテーブルとそのすべてのデータを削除します。",
    exampleSql: "DROP TABLE IF EXISTS temp_users;",
  },
  {
    syntax: "CREATE INDEX",
    nameEn: "Create Index",
    nameJa: "インデックス作成",
    category: "ddl",
    descriptionEn: "Create an index on a table to improve query performance.",
    descriptionJa: "クエリパフォーマンスを向上させるためにテーブルにインデックスを作成します。",
    exampleSql: "CREATE INDEX idx_users_email\n  ON users (email);\n\nCREATE UNIQUE INDEX idx_users_name\n  ON users (name);",
  },
  {
    syntax: "CREATE VIEW",
    nameEn: "Create View",
    nameJa: "ビュー作成",
    category: "ddl",
    descriptionEn: "Create a virtual table based on a SELECT query.",
    descriptionJa: "SELECTクエリに基づいた仮想テーブルを作成します。",
    exampleSql: "CREATE VIEW active_users AS\nSELECT id, name, email\nFROM users\nWHERE active = true;",
  },

  // 制約 (constraint)
  {
    syntax: "PRIMARY KEY",
    nameEn: "Primary Key",
    nameJa: "主キー",
    category: "constraint",
    descriptionEn: "Uniquely identifies each row in a table. Cannot be NULL.",
    descriptionJa: "テーブル内の各行を一意に識別します。NULLは不可。",
    exampleSql: "CREATE TABLE orders (\n  id SERIAL PRIMARY KEY,\n  ...\n);",
  },
  {
    syntax: "FOREIGN KEY",
    nameEn: "Foreign Key",
    nameJa: "外部キー",
    category: "constraint",
    descriptionEn: "Enforce a link between data in two tables.",
    descriptionJa: "2つのテーブル間のデータリンクを強制します。",
    exampleSql: "CREATE TABLE orders (\n  id SERIAL PRIMARY KEY,\n  user_id INT REFERENCES users(id)\n    ON DELETE CASCADE\n);",
  },
  {
    syntax: "UNIQUE",
    nameEn: "Unique Constraint",
    nameJa: "ユニーク制約",
    category: "constraint",
    descriptionEn: "Ensure that all values in a column are unique.",
    descriptionJa: "列のすべての値が一意であることを保証します。",
    exampleSql: "CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  email VARCHAR(255) UNIQUE\n);",
  },
  {
    syntax: "CHECK",
    nameEn: "Check Constraint",
    nameJa: "チェック制約",
    category: "constraint",
    descriptionEn: "Ensure that values satisfy a specific condition.",
    descriptionJa: "値が特定の条件を満たすことを保証します。",
    exampleSql: "CREATE TABLE products (\n  id SERIAL PRIMARY KEY,\n  price DECIMAL(10,2)\n    CHECK (price >= 0),\n  quantity INT\n    CHECK (quantity >= 0)\n);",
  },
  {
    syntax: "NOT NULL / DEFAULT",
    nameEn: "NOT NULL & Default",
    nameJa: "NOT NULLとデフォルト",
    category: "constraint",
    descriptionEn: "Prevent NULL values and set default values for columns.",
    descriptionJa: "NULL値を防止し、列にデフォルト値を設定します。",
    exampleSql: "CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(100) NOT NULL,\n  role VARCHAR(20) DEFAULT 'user',\n  created_at TIMESTAMP\n    DEFAULT NOW()\n);",
  },
];

// カテゴリごとにグループ化
export function getSqlSyntaxByCategory(): Map<SqlSyntaxCategory, SqlSyntax[]> {
  return groupByCategory(SQL_SYNTAXES, SQL_CATEGORY_ORDER);
}
