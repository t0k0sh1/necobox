# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 言語設定

常に日本語で応答すること。コードコメントやドキュメントも日本語で記述すること。

## プロジェクト概要

Neco Box は開発者向けユーティリティツールを集めた Next.js アプリケーション。パスワード生成、乱数生成、JWT デコーダー、タイムゾーン変換、画像フォーマット変換などのツールを提供。

## 開発コマンド

```bash
# パッケージマネージャー: pnpm
pnpm install          # 依存関係のインストール
pnpm dev              # 開発サーバー起動 (http://localhost:3000)
pnpm build            # プロダクションビルド
pnpm lint             # ESLint 実行

# テスト (Jest)
pnpm test             # 全テスト実行
pnpm test:watch       # ウォッチモード
pnpm test:coverage    # カバレッジレポート
pnpm test -- path/to/file.test.tsx  # 単一ファイルのテスト
```

## アーキテクチャ

### 技術スタック
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui (Radix UI ベース)
- next-intl (国際化: en/ja)
- Jest + Testing Library

### ディレクトリ構造
- `app/[locale]/` - ロケール対応ページ（各ツールのページ）
- `app/api/v1/` - REST API エンドポイント
- `app/components/` - ツール固有のコンポーネント
- `app/__tests__/` - ページレベルのテスト
- `components/` - 共通コンポーネント
- `components/ui/` - shadcn/ui コンポーネント
- `lib/utils/` - ビジネスロジック・ユーティリティ関数
- `i18n/` - 国際化設定 (`routing.ts` でロケール定義)
- `messages/` - 翻訳ファイル (`en.json`, `ja.json`)

### 国際化
- next-intl を使用、`[locale]` 動的ルートで対応
- サポート言語: 英語 (`en`), 日本語 (`ja`)
- デフォルト言語: `en`
- ミドルウェアでロケールルーティングを処理

### UI コンポーネント
- shadcn/ui (new-york スタイル) を使用
- CSS 変数ベース、Tailwind CSS でカスタマイズ
- アイコン: lucide-react
- テーマ: next-themes (system/light/dark)

### テスト構成
- コンポーネントテスト: `**/__tests__/*.test.tsx`
- ユーティリティテスト: `lib/utils/__tests__/*.test.ts`
- next-intl のモック対応済み

## パスエイリアス

```typescript
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
```

## プルリクエスト作成時

- タイトルにプレフィックス使用: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- コミットメッセージは日本語
- リンター・型エラーがないことを確認
- 関連するテストが通過することを確認
