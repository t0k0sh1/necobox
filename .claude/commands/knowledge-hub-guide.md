# ノウハウ集（Knowledge Hub）コンテンツ作成ガイド

ノウハウ集のデータを追加・編集する際に従うルール。

## データ構造

型定義: `lib/types/knowledge.ts`
データファイル: `lib/data/git-knowledge.ts`（現在はGitのみ）
テンプレート: `app/components/KnowledgeTemplate.tsx`
テスト: `app/__tests__/knowledge-hub.test.tsx`

## KnowledgeItem の構成

```typescript
{
  id: string,              // ケバブケースの一意ID
  situationEn: string,     // 英語の状況説明（カードヘッダーに表示）
  situationJa: string,     // 日本語の状況説明
  warningEn?: string,      // 英語の注意事項（カード展開時、最上部にアンバー色で表示）
  warningJa?: string,      // 日本語の注意事項
  explanationEn: string,   // 英語の解説文
  explanationJa: string,   // 日本語の解説文
  snippets: CodeSnippet[], // コードスニペット群
  tags: string[],          // 検索・フィルタ用タグ
}
```

## 文章の書き方ルール

### situation（カードヘッダー）
- ユーザーが「〜したい」と思う状況を簡潔に書く
- 日本語は「〜したい」「〜する」の形にする
- コマンド名を含めない

### warning（注意事項）
- 操作の危険性や制約を記載する
- カード展開時に最上部にアンバー色のバナーとして表示される
- 不要な項目では省略可
- 例: 「履歴を書き換えるため、未プッシュのコミットに対してのみ使用してください。」

### explanation（解説文）
- **どういう状況で使うかを最初に書く**。コマンドから書き始めない
- バッククォートで囲んだコマンドは自動的に `<code>` タグとして表示される
- 解説文中でスニペットの内容を繰り返さない
- 「共有ブランチ」のような曖昧な表現を避け、「プッシュ済みのコミット」のように具体的に書く

### snippets（コードスニペット）

#### label
- 操作内容を簡潔に書く
- 「（推奨）」「（従来の方法）」などの修飾を付けない。推奨コマンドのみ掲載する

#### code
- プレースホルダーは `<placeholder-name>` 形式（英語ケバブケース）
- プレースホルダーがある場合は `placeholders` フィールドで各言語の説明を定義する

#### note
- 解説文と重複する内容を書かない
- スニペット固有の補足情報がある場合のみ使用する
- 不要なら省略する

#### placeholders
- コード中の `<placeholder-name>` に対応する説明をen/jaで定義する
- コピー時のモーダルダイアログでラベルとして表示される
- 例: `"branch-name": { descriptionEn: "New branch name", descriptionJa: "作成するブランチ名" }`

### tags
- 検索に使われる。コマンドのキーワードや概念を含める
- 掲載していないコマンド名をタグに含めない

## 1つの状況に複数アプローチがある場合

状況ごとに KnowledgeItem を分割する。1つの KnowledgeItem に異なるユースケースを混在させない。

例: 「コミットを取り消したい」は以下の3つに分割した
- `undo-soft`: 変更をステージングに残す
- `undo-mixed`: 変更をワーキングツリーに残す
- `undo-hard`: 変更を完全に削除する

## 非推奨・従来のコマンドについて

非推奨や従来のコマンドは掲載しない。推奨されるコマンドのみを掲載する。
