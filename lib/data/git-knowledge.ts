// Gitノウハウのコードスニペット
export interface CodeSnippet {
  labelEn: string;
  labelJa: string;
  code: string;
  noteEn?: string;
  noteJa?: string;
}

// ノウハウ項目
export interface KnowledgeItem {
  id: string;
  situationEn: string;
  situationJa: string;
  explanationEn: string;
  explanationJa: string;
  snippets: CodeSnippet[];
  relatedCheatsheetTab?: string;
  tags: string[];
}

// Gitノウハウデータ
export const GIT_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: "create-branch",
    situationEn: "Creating a new branch and switching to it",
    situationJa: "新しいブランチを作成して切り替えたい",
    explanationEn:
      "Since Git 2.23, `git switch -c` is the recommended way to create and switch to a new branch. The older `git checkout -b` still works but `switch` is more explicit in its intent. You can also create a branch from a specific base branch or commit.",
    explanationJa:
      "Git 2.23以降、`git switch -c` が新しいブランチの作成と切り替えの推奨方法です。従来の `git checkout -b` も動作しますが、`switch` のほうが意図が明確です。特定のブランチやコミットを起点にブランチを作成することもできます。",
    snippets: [
      {
        labelEn: "Create and switch (recommended)",
        labelJa: "作成して切り替え（推奨）",
        code: "git switch -c <branch-name>",
      },
      {
        labelEn: "Create and switch (old way)",
        labelJa: "作成して切り替え（従来の方法）",
        code: "git checkout -b <branch-name>",
        noteEn: "Still works but switch is preferred for clarity",
        noteJa: "動作しますが、明確さのためswitch推奨",
      },
      {
        labelEn: "Create from a specific branch",
        labelJa: "特定のブランチから作成",
        code: "git switch -c <branch-name> <base-branch>",
        noteEn: "Creates the branch based on the specified base branch instead of the current branch",
        noteJa: "現在のブランチではなく指定したブランチを起点にブランチを作成",
      },
      {
        labelEn: "Create from a specific commit",
        labelJa: "特定のコミットから作成",
        code: "git switch -c <branch-name> <commit-hash>",
      },
    ],
    relatedCheatsheetTab: "gitCommands",
    tags: ["branch", "switch", "checkout"],
  },
  {
    id: "undo-commits",
    situationEn: "Undoing or reverting commits",
    situationJa: "コミットを取り消し・やり直したい",
    explanationEn:
      "Git provides several ways to undo commits depending on what you need: `reset --soft` keeps changes staged, `reset --mixed` unstages them, `revert` creates a new commit that undoes changes (safe for shared branches), and `restore` handles individual files.",
    explanationJa:
      "Gitにはコミットの取り消し方法が複数あります。`reset --soft` は変更をステージングに残し、`reset --mixed` はステージングを解除します。`revert` は変更を打ち消す新しいコミットを作成し（共有ブランチでも安全）、`restore` は個別ファイルの復元に使います。",
    snippets: [
      {
        labelEn: "Undo last commit, keep changes staged",
        labelJa: "直前のコミットを取り消し、変更はステージングに残す",
        code: "git reset --soft HEAD~1",
        noteEn: "Use when you want to redo the commit message or add more changes",
        noteJa: "コミットメッセージをやり直したい、追加の変更を含めたい場合に使用",
      },
      {
        labelEn: "Undo last commit, unstage changes",
        labelJa: "直前のコミットを取り消し、変更をワーキングツリーに戻す",
        code: "git reset --mixed HEAD~1",
        noteEn: "Default mode of reset. Changes remain in working directory but are unstaged",
        noteJa: "resetのデフォルトモード。変更はワーキングディレクトリに残るがステージング解除される",
      },
      {
        labelEn: "Revert a commit (safe for shared branches)",
        labelJa: "コミットを打ち消し（共有ブランチでも安全）",
        code: "git revert <commit-hash>",
        noteEn: "Creates a new commit that undoes the specified commit. Does not rewrite history",
        noteJa: "指定コミットを打ち消す新コミットを作成。履歴を書き換えない",
      },
      {
        labelEn: "Unstage a file",
        labelJa: "ファイルのステージングを解除",
        code: "git restore --staged <file>",
      },
      {
        labelEn: "Discard changes in a file",
        labelJa: "ファイルの変更を破棄",
        code: "git restore <file>",
        noteEn: "Warning: this permanently discards uncommitted changes",
        noteJa: "注意: コミットされていない変更が完全に失われます",
      },
    ],
    relatedCheatsheetTab: "gitCommands",
    tags: ["reset", "revert", "restore", "undo"],
  },
  {
    id: "git-diff-usage",
    situationEn: "Comparing changes with git diff",
    situationJa: "git diff で変更を比較したい",
    explanationEn:
      "git diff has several forms depending on what you want to compare: working directory vs staging area, staging area vs last commit, between two commits, or between two branches. The `--name-only` flag is useful for quick overviews.",
    explanationJa:
      "git diff は比較対象によって使い分けます。ワーキングディレクトリとステージングエリア、ステージングエリアとコミット、コミット間、ブランチ間の比較が可能です。`--name-only` フラグは概要の確認に便利です。",
    snippets: [
      {
        labelEn: "Working directory vs staging area",
        labelJa: "ワーキングディレクトリ vs ステージングエリア",
        code: "git diff",
        noteEn: "Shows unstaged changes (changes not yet added with git add)",
        noteJa: "まだ git add していない変更を表示",
      },
      {
        labelEn: "Staging area vs last commit",
        labelJa: "ステージングエリア vs 最新コミット",
        code: "git diff --staged",
        noteEn: "Shows what will be included in the next commit",
        noteJa: "次のコミットに含まれる変更を表示",
      },
      {
        labelEn: "Between two commits",
        labelJa: "コミット間の比較",
        code: "git diff <commit1> <commit2>",
      },
      {
        labelEn: "Between two branches",
        labelJa: "ブランチ間の比較",
        code: "git diff <branch1>..<branch2>",
        noteEn: "Use three dots (...) to compare from the merge base",
        noteJa: "マージベースからの比較には3つのドット（...）を使用",
      },
      {
        labelEn: "Show only changed file names",
        labelJa: "変更されたファイル名のみ表示",
        code: "git diff --name-only",
        noteEn: "Combine with --staged or branch names as needed",
        noteJa: "--staged やブランチ名と組み合わせて使用可能",
      },
    ],
    relatedCheatsheetTab: "gitCommands",
    tags: ["diff", "compare", "staging"],
  },
];
