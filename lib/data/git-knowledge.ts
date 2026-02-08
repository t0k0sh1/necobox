// 型は共通定義から re-export
export type { CodeSnippet, KnowledgeItem } from "@/lib/types/knowledge";

import type { KnowledgeItem } from "@/lib/types/knowledge";

// Gitノウハウデータ
export const GIT_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: "create-branch",
    situationEn: "Creating a new branch and switching to it",
    situationJa: "新しいブランチを作成して切り替えたい",
    explanationEn:
      "Since Git 2.23, `git switch -c` is the recommended way to create and switch to a new branch. You can also create a branch from a specific base branch or commit.",
    explanationJa:
      "Git 2.23以降、`git switch -c` が新しいブランチの作成と切り替えの推奨方法です。特定のブランチやコミットを起点にブランチを作成することもできます。",
    snippets: [
      {
        labelEn: "Create and switch",
        labelJa: "作成して切り替え",
        code: "git switch -c <branch-name>",
        placeholders: {
          "branch-name": {
            descriptionEn: "New branch name",
            descriptionJa: "作成するブランチ名",
          },
        },
      },
      {
        labelEn: "Create from a specific branch",
        labelJa: "特定のブランチから作成",
        code: "git switch -c <branch-name> <base-branch>",
        noteEn:
          "Creates the branch based on the specified base branch instead of the current branch",
        noteJa:
          "現在のブランチではなく指定したブランチを起点にブランチを作成",
        placeholders: {
          "branch-name": {
            descriptionEn: "New branch name",
            descriptionJa: "作成するブランチ名",
          },
          "base-branch": {
            descriptionEn: "Base branch to create from",
            descriptionJa: "起点にするブランチ名",
          },
        },
      },
      {
        labelEn: "Create from a specific commit",
        labelJa: "特定のコミットから作成",
        code: "git switch -c <branch-name> <commit-hash>",
        placeholders: {
          "branch-name": {
            descriptionEn: "New branch name",
            descriptionJa: "作成するブランチ名",
          },
          "commit-hash": {
            descriptionEn: "Commit hash to create from",
            descriptionJa: "起点にするコミットハッシュ",
          },
        },
      },
    ],

    tags: ["branch", "switch"],
  },
  {
    id: "check-push-status",
    situationEn: "Check if the last commit has been pushed",
    situationJa: "直前のコミットがプッシュ済みか調べたい",
    explanationEn:
      "Before undoing a commit, you may need to check whether it has already been pushed to the remote. If the command shows your commit, it means the commit exists only locally and has not been pushed yet.",
    explanationJa:
      "コミットを取り消す前に、そのコミットがリモートにプッシュ済みかどうかを確認する必要があります。コマンドの結果にコミットが表示されれば、そのコミットはローカルにのみ存在し、まだプッシュされていません。",
    snippets: [
      {
        labelEn: "List unpushed commits",
        labelJa: "未プッシュのコミット一覧",
        code: "git log @{u}..HEAD --oneline",
        noteEn:
          "Shows commits that exist locally but not on the remote tracking branch. No output means all commits have been pushed.",
        noteJa:
          "ローカルにあってリモート追跡ブランチにないコミットを表示。何も表示されなければ全コミットがプッシュ済み。",
      },
    ],
    tags: ["log", "push", "remote"],
  },
  {
    id: "undo-soft",
    situationEn: "Undo last commit, keep changes staged",
    situationJa: "直前のコミットを取り消し、変更をステージングに残す",
    warningEn: "Rewrites history. Use only for unpushed commits.",
    warningJa: "履歴を書き換えるため、未プッシュのコミットに対してのみ使用してください。",
    explanationEn:
      "When you want to redo a commit message or include additional changes in the same commit, you can undo the last commit while keeping all changes staged.",
    explanationJa:
      "コミットメッセージを書き直したい場合や、追加の変更を同じコミットに含めたい場合に使います。直前のコミットを取り消しつつ、変更はステージングエリアに残るため、すぐに再コミットできます。",
    snippets: [
      {
        labelEn: "Undo last commit, keep changes staged",
        labelJa: "直前のコミットを取り消し、変更はステージングに残す",
        code: "git reset --soft HEAD~1",
      },
    ],

    tags: ["reset", "undo", "soft"],
  },
  {
    id: "undo-mixed",
    situationEn: "Undo last commit, keep changes in working tree",
    situationJa: "直前のコミットを取り消し、変更をワーキングツリーに残す",
    warningEn: "Rewrites history. Use only for unpushed commits.",
    warningJa: "履歴を書き換えるため、未プッシュのコミットに対してのみ使用してください。",
    explanationEn:
      "When you want to review your changes before re-committing, or selectively stage only some of them, you can undo the last commit and return the changes to an unstaged state in your working directory.",
    explanationJa:
      "コミットした内容を見直して、一部だけ選んで再ステージングしたい場合に使います。直前のコミットを取り消し、変更はワーキングディレクトリに未ステージの状態で残ります。",
    snippets: [
      {
        labelEn: "Undo last commit, unstage changes",
        labelJa: "直前のコミットを取り消し、変更をワーキングツリーに戻す",
        code: "git reset --mixed HEAD~1",
      },
    ],

    tags: ["reset", "undo", "mixed"],
  },
  {
    id: "undo-hard",
    situationEn: "Undo last commit, discard changes completely",
    situationJa: "直前のコミットを取り消し、変更を完全に削除する",
    warningEn: "Changes are permanently lost and cannot be recovered. When using git reset, use only for unpushed commits.",
    warningJa: "変更は完全に失われて復元できません。git resetを使う場合は未プッシュのコミットに対してのみ使用してください。",
    explanationEn:
      "When you want to completely discard a commit and its changes, the approach depends on whether the commit has been pushed. Unpushed commits can be permanently removed, while pushed commits should be safely reverted to avoid rewriting shared history.",
    explanationJa:
      "コミットとその変更を完全に破棄したい場合に使います。まだプッシュしていないコミットは完全に削除できます。すでにプッシュ済みのコミットは、履歴を書き換えないよう、打ち消しコミットで安全に取り消します。",
    snippets: [
      {
        labelEn: "Discard unpushed commit completely",
        labelJa: "未プッシュのコミットを完全に削除",
        code: "git reset --hard HEAD~1",
        noteEn:
          "Changes are permanently lost. Use only for unpushed commits",
        noteJa:
          "変更が完全に失われる。未プッシュのコミットにのみ使用すること",
      },
      {
        labelEn: "Revert a pushed commit (safe for shared branches)",
        labelJa: "プッシュ済みコミットを打ち消し（プッシュ済みのコミットでも安全）",
        code: "git revert <commit-hash>",
        noteEn:
          "Creates a new commit that undoes the specified commit. Does not rewrite history, safe for shared branches",
        noteJa:
          "変更を打ち消す新コミットを作成。履歴を書き換えないためプッシュ済みのコミットでも安全",
        placeholders: {
          "commit-hash": {
            descriptionEn: "Hash of the commit to revert",
            descriptionJa: "取り消すコミットのハッシュ",
          },
        },
      },
    ],

    tags: ["reset", "revert", "undo", "hard"],
  },
];
