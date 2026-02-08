# Neco Box

開発者向けユーティリティツールを集めた Web アプリケーション。

## ツールカテゴリ

- **セキュリティ・生成** - パスワード生成、乱数生成など
- **エンコード・変換** - JWT デコーダー、画像フォーマット変換など
- **開発支援** - 開発ワークフローを補助するツール
- **テキスト処理** - テキスト変換・整形ツール
- **日付・時間** - タイムゾーン変換など
- **リファレンス** - 各種リファレンス情報

## セットアップ

### 前提条件

- Node.js 22
- pnpm

### インストールと起動

```bash
pnpm install
pnpm dev
```

http://localhost:3000 でアクセスできます。

## 開発コマンド

| コマンド | 説明 |
| --- | --- |
| `pnpm dev` | 開発サーバー起動 |
| `pnpm build` | プロダクションビルド |
| `pnpm start` | プロダクションサーバー起動 |
| `pnpm lint` | ESLint 実行 |
| `pnpm test` | 全テスト実行 |
| `pnpm test:watch` | テストウォッチモード |
| `pnpm test:coverage` | カバレッジレポート |

## 技術スタック

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui (Radix UI ベース)
- next-intl (en / ja)
- Jest + Testing Library
