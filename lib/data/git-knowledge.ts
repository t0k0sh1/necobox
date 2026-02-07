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
    hasRelatedCheatsheet: true,
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
    hasRelatedCheatsheet: true,
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
    hasRelatedCheatsheet: true,
    tags: ["diff", "compare", "staging"],
  },
  {
    id: "rebase-interactive",
    situationEn: "Cleaning up commits with interactive rebase",
    situationJa: "rebase -i でコミットを整理したい",
    explanationEn:
      "Interactive rebase (`git rebase -i`) lets you squash, reorder, edit, or drop commits before pushing. It rewrites history, so use it only on local/unpushed branches. `fixup` is like squash but discards the commit message.",
    explanationJa:
      "インタラクティブ rebase（`git rebase -i`）では、コミットの統合・並べ替え・編集・削除ができます。履歴を書き換えるため、ローカルまたは未 push のブランチでのみ使用してください。`fixup` は squash と似ていますがコミットメッセージを破棄します。",
    snippets: [
      {
        labelEn: "Start interactive rebase for last N commits",
        labelJa: "直近Nコミットをインタラクティブ rebase",
        code: "git rebase -i HEAD~<N>",
        noteEn: "Opens editor to pick/squash/edit/drop commits",
        noteJa: "エディタが開き、各コミットの操作（pick/squash/edit/drop）を指定",
      },
      {
        labelEn: "Squash commits (merge into one)",
        labelJa: "コミットを統合（squash）",
        code: "git rebase -i HEAD~<N>",
        noteEn: "Change 'pick' to 'squash' (or 's') for commits to merge",
        noteJa: "統合したいコミットの 'pick' を 'squash'（または 's'）に変更",
      },
      {
        labelEn: "Fixup (squash without message)",
        labelJa: "fixup（メッセージなしで統合）",
        code: "git commit --fixup <commit-hash>",
        noteEn: "Creates a fixup commit. Use with `git rebase -i --autosquash`",
        noteJa: "fixupコミットを作成。`git rebase -i --autosquash` と組み合わせて使用",
      },
      {
        labelEn: "Abort rebase if something goes wrong",
        labelJa: "rebase を中断",
        code: "git rebase --abort",
      },
    ],
    hasRelatedCheatsheet: true,
    tags: ["rebase", "squash", "fixup"],
  },
  {
    id: "stash-usage",
    situationEn: "Temporarily shelving changes with stash",
    situationJa: "変更を一時退避して別の作業をしたい",
    explanationEn:
      "git stash saves your uncommitted changes (both staged and unstaged) and reverts the working directory to match HEAD. You can then apply or pop stashed changes later. Use `stash push -m` to give a meaningful name.",
    explanationJa:
      "git stash はコミットしていない変更（ステージング済み・未ステージング両方）を保存し、ワーキングディレクトリを HEAD の状態に戻します。後で apply や pop で変更を復元できます。`stash push -m` で名前を付けると管理しやすくなります。",
    snippets: [
      {
        labelEn: "Save changes to stash",
        labelJa: "変更をスタッシュに保存",
        code: "git stash push -m <message>",
      },
      {
        labelEn: "List stashed changes",
        labelJa: "スタッシュ一覧を表示",
        code: "git stash list",
      },
      {
        labelEn: "Apply and remove latest stash",
        labelJa: "最新のスタッシュを適用して削除",
        code: "git stash pop",
        noteEn: "Applies the stash and removes it from the stash list",
        noteJa: "スタッシュを適用し、スタッシュ一覧から削除",
      },
      {
        labelEn: "Apply stash without removing",
        labelJa: "スタッシュを適用（削除しない）",
        code: "git stash apply stash@{<N>}",
        noteEn: "Useful when you want to apply the same stash to multiple branches",
        noteJa: "同じスタッシュを複数ブランチに適用したい場合に便利",
      },
      {
        labelEn: "Drop a specific stash",
        labelJa: "特定のスタッシュを削除",
        code: "git stash drop stash@{<N>}",
      },
    ],
    hasRelatedCheatsheet: true,
    tags: ["stash", "save", "pop"],
  },
  {
    id: "cherry-pick",
    situationEn: "Applying specific commits from another branch",
    situationJa: "特定のコミットだけを取り込みたい",
    explanationEn:
      "git cherry-pick copies a commit from another branch and applies it to your current branch. It creates a new commit with the same changes. Useful for hotfixes or selectively bringing features across branches.",
    explanationJa:
      "git cherry-pick は別ブランチのコミットをコピーして現在のブランチに適用します。同じ変更内容で新しいコミットが作成されます。ホットフィックスや機能の選択的な取り込みに便利です。",
    snippets: [
      {
        labelEn: "Cherry-pick a single commit",
        labelJa: "1つのコミットをcherry-pick",
        code: "git cherry-pick <commit-hash>",
      },
      {
        labelEn: "Cherry-pick without committing",
        labelJa: "コミットせずにcherry-pick（変更だけ取り込む）",
        code: "git cherry-pick --no-commit <commit-hash>",
        noteEn: "Applies changes to working directory without creating a commit",
        noteJa: "変更をワーキングディレクトリに適用するがコミットは作成しない",
      },
      {
        labelEn: "Cherry-pick a range of commits",
        labelJa: "範囲指定でcherry-pick",
        code: "git cherry-pick <start-hash>..<end-hash>",
        noteEn: "Start commit is excluded, end commit is included",
        noteJa: "開始コミットは含まれず、終了コミットが含まれる",
      },
    ],
    hasRelatedCheatsheet: true,
    tags: ["cherry-pick", "commit"],
  },
  {
    id: "merge-conflict",
    situationEn: "Resolving merge conflicts",
    situationJa: "マージコンフリクトを解消したい",
    explanationEn:
      "Merge conflicts occur when Git can't automatically merge changes. Conflict markers (<<<<<<<, =======, >>>>>>>) show both versions. After resolving, stage the file and complete the merge with a commit.",
    explanationJa:
      "マージコンフリクトはGitが自動的にマージできない場合に発生します。コンフリクトマーカー（<<<<<<<, =======, >>>>>>>）で両方のバージョンが表示されます。解消後、ファイルをステージングしてコミットでマージを完了します。",
    snippets: [
      {
        labelEn: "Check which files have conflicts",
        labelJa: "コンフリクトのあるファイルを確認",
        code: "git status",
        noteEn: "Files with conflicts are listed under 'Unmerged paths'",
        noteJa: "コンフリクトファイルは 'Unmerged paths' に表示される",
      },
      {
        labelEn: "After resolving, stage and commit",
        labelJa: "解消後、ステージングしてコミット",
        code: "git add <file> && git commit",
        noteEn: "Git auto-generates a merge commit message",
        noteJa: "Gitがマージコミットメッセージを自動生成",
      },
      {
        labelEn: "Accept current branch version (ours)",
        labelJa: "現在のブランチ側を採用（ours）",
        code: "git checkout --ours <file>",
      },
      {
        labelEn: "Accept incoming branch version (theirs)",
        labelJa: "マージ元ブランチ側を採用（theirs）",
        code: "git checkout --theirs <file>",
      },
    ],
    hasRelatedCheatsheet: true,
    tags: ["merge", "conflict", "resolve"],
  },
  {
    id: "remote-sync",
    situationEn: "Syncing with remote repository",
    situationJa: "リモートとの同期パターンを知りたい",
    explanationEn:
      "Understanding fetch vs pull is key: `fetch` downloads changes without merging, while `pull` is fetch + merge. Use `push -u` to set upstream tracking. `--force-with-lease` is a safer alternative to force push.",
    explanationJa:
      "fetch と pull の違いが重要です。`fetch` は変更をダウンロードするだけでマージしません。`pull` は fetch + merge です。`push -u` でアップストリームのトラッキングを設定できます。`--force-with-lease` は force push のより安全な代替手段です。",
    snippets: [
      {
        labelEn: "Fetch all remote changes",
        labelJa: "リモートの全変更を取得",
        code: "git fetch --all --prune",
        noteEn: "--prune removes references to deleted remote branches",
        noteJa: "--prune で削除済みリモートブランチの参照を除去",
      },
      {
        labelEn: "Pull with rebase (cleaner history)",
        labelJa: "rebase付きpull（履歴がきれいに）",
        code: "git pull --rebase origin <branch>",
        noteEn: "Avoids unnecessary merge commits",
        noteJa: "不要なマージコミットを回避",
      },
      {
        labelEn: "Push and set upstream",
        labelJa: "push してアップストリームを設定",
        code: "git push -u origin <branch>",
        noteEn: "After this, you can just use `git push` without arguments",
        noteJa: "以降は引数なしの `git push` で push 可能に",
      },
      {
        labelEn: "Safe force push",
        labelJa: "安全な force push",
        code: "git push --force-with-lease",
        noteEn: "Fails if someone else pushed changes you haven't fetched",
        noteJa: "取得していない他人の変更がある場合は失敗する（安全）",
      },
      {
        labelEn: "Check remote tracking status",
        labelJa: "リモートトラッキングの状態を確認",
        code: "git branch -vv",
      },
    ],
    hasRelatedCheatsheet: true,
    tags: ["remote", "fetch", "pull", "push"],
  },
  {
    id: "git-log-search",
    situationEn: "Searching and filtering git log history",
    situationJa: "git log で履歴を検索・フィルタしたい",
    explanationEn:
      "git log has powerful search capabilities: `--grep` searches commit messages, `-S` finds when a string was added/removed (pickaxe), `--author` filters by committer, and `--oneline --graph` gives a visual branch overview.",
    explanationJa:
      "git log には強力な検索機能があります。`--grep` はコミットメッセージを検索、`-S` は文字列の追加・削除を検出（pickaxe）、`--author` はコミッターでフィルタ、`--oneline --graph` でブランチの視覚的な概要を表示できます。",
    snippets: [
      {
        labelEn: "Visual branch graph",
        labelJa: "ブランチのグラフ表示",
        code: "git log --oneline --graph --all",
      },
      {
        labelEn: "Search commit messages",
        labelJa: "コミットメッセージを検索",
        code: "git log --grep=<keyword>",
      },
      {
        labelEn: "Find when a string was added/removed",
        labelJa: "文字列の追加・削除を検索（pickaxe）",
        code: "git log -S <string> --patch",
        noteEn: "Shows commits where the given string was added or removed",
        noteJa: "指定文字列が追加・削除されたコミットを表示",
      },
      {
        labelEn: "Filter by author",
        labelJa: "作者でフィルタ",
        code: "git log --author=<name>",
      },
      {
        labelEn: "Show changes for a specific file",
        labelJa: "特定ファイルの変更履歴",
        code: "git log --follow -p -- <file>",
        noteEn: "--follow tracks file renames",
        noteJa: "--follow でファイル名変更を追跡",
      },
    ],
    hasRelatedCheatsheet: true,
    tags: ["log", "search", "history"],
  },
  {
    id: "gitignore-fix",
    situationEn: "Fixing .gitignore not working",
    situationJa: ".gitignore が効かない時の対処",
    explanationEn:
      ".gitignore only ignores untracked files. If a file was already tracked before adding it to .gitignore, you need to remove it from the index first with `git rm --cached`. This keeps the file locally but removes Git tracking.",
    explanationJa:
      ".gitignore は未追跡ファイルのみを無視します。.gitignore に追加する前に既に追跡されているファイルは、まず `git rm --cached` でインデックスから削除する必要があります。ファイルはローカルに残りますが、Gitの追跡から外れます。",
    snippets: [
      {
        labelEn: "Remove file from tracking (keep local)",
        labelJa: "追跡から外す（ローカルには残す）",
        code: "git rm --cached <file>",
      },
      {
        labelEn: "Remove directory from tracking",
        labelJa: "ディレクトリを追跡から外す",
        code: "git rm -r --cached <directory>",
      },
      {
        labelEn: "Rebuild index from .gitignore",
        labelJa: ".gitignore に基づいてインデックスを再構築",
        code: "git rm -r --cached . && git add .",
        noteEn: "Removes all files from index and re-adds them, applying .gitignore rules",
        noteJa: "全ファイルをインデックスから削除し再追加することで、.gitignore ルールを適用",
      },
    ],
    hasRelatedCheatsheet: true,
    tags: ["gitignore", "cache", "rm"],
  },
];
