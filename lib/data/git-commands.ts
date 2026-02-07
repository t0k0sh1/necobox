import { groupByCategory } from "./utils";

// Gitコマンドのカテゴリ
export type GitCommandCategory =
  | "basics"
  | "branching"
  | "diff_history"
  | "remote"
  | "stash"
  | "reset_undo"
  | "tag"
  | "worktree"
  | "config";

// Gitコマンドオプションの型
export interface GitCommandOption {
  flag: string;
  descriptionEn: string;
  descriptionJa: string;
}

// Gitコマンドの型
export interface GitCommand {
  command: string;
  nameEn: string;
  nameJa: string;
  category: GitCommandCategory;
  descriptionEn: string;
  descriptionJa: string;
  options: GitCommandOption[];
}

// カテゴリの表示順
export const GIT_CATEGORY_ORDER: GitCommandCategory[] = [
  "basics",
  "branching",
  "diff_history",
  "remote",
  "stash",
  "reset_undo",
  "tag",
  "worktree",
  "config",
];

// Gitコマンド一覧
export const GIT_COMMANDS: GitCommand[] = [
  // 基本操作 (basics)
  {
    command: "git init",
    nameEn: "Initialize repository",
    nameJa: "リポジトリを初期化",
    category: "basics",
    descriptionEn: "Create an empty Git repository or reinitialize an existing one.",
    descriptionJa: "空のGitリポジトリを作成、または既存のリポジトリを再初期化します。",
    options: [
      { flag: "--bare", descriptionEn: "Create a bare repository", descriptionJa: "ベアリポジトリを作成" },
      { flag: "--initial-branch <name>", descriptionEn: "Set the name of the initial branch", descriptionJa: "初期ブランチの名前を設定" },
      { flag: "--template <dir>", descriptionEn: "Specify the template directory", descriptionJa: "テンプレートディレクトリを指定" },
    ],
  },
  {
    command: "git clone",
    nameEn: "Clone repository",
    nameJa: "リポジトリをクローン",
    category: "basics",
    descriptionEn: "Clone a repository into a new directory.",
    descriptionJa: "リポジトリを新しいディレクトリにクローンします。",
    options: [
      { flag: "--depth <n>", descriptionEn: "Create a shallow clone with specified history depth", descriptionJa: "指定した深さの浅いクローンを作成" },
      { flag: "--branch <name>", descriptionEn: "Clone a specific branch", descriptionJa: "特定のブランチをクローン" },
      { flag: "--single-branch", descriptionEn: "Clone only the history of a single branch", descriptionJa: "単一ブランチの履歴のみをクローン" },
      { flag: "--recurse-submodules", descriptionEn: "Initialize and clone submodules", descriptionJa: "サブモジュールを初期化してクローン" },
      { flag: "--shallow-submodules", descriptionEn: "Shallow clone submodules with depth 1", descriptionJa: "サブモジュールを深さ1で浅くクローン" },
      { flag: "--bare", descriptionEn: "Create a bare repository", descriptionJa: "ベアリポジトリとしてクローン" },
      { flag: "--mirror", descriptionEn: "Create a mirror clone (bare + remote tracking)", descriptionJa: "ミラークローンを作成（bare + リモート追跡）" },
    ],
  },
  {
    command: "git add",
    nameEn: "Stage changes",
    nameJa: "変更をステージング",
    category: "basics",
    descriptionEn: "Add file contents to the staging area.",
    descriptionJa: "ファイルの内容をステージングエリアに追加します。",
    options: [
      { flag: "-A, --all", descriptionEn: "Stage all changes (new, modified, deleted)", descriptionJa: "すべての変更をステージング（新規・変更・削除）" },
      { flag: "-p, --patch", descriptionEn: "Interactively select hunks to stage", descriptionJa: "対話的にステージングする変更を選択" },
      { flag: "-u, --update", descriptionEn: "Stage modified and deleted files only", descriptionJa: "変更・削除されたファイルのみステージング" },
      { flag: "-n, --dry-run", descriptionEn: "Show what would be staged without actually staging", descriptionJa: "実際にステージングせず何がステージングされるか表示" },
      { flag: "-f, --force", descriptionEn: "Allow adding ignored files", descriptionJa: "無視されたファイルの追加を許可" },
    ],
  },
  {
    command: "git commit",
    nameEn: "Commit changes",
    nameJa: "変更をコミット",
    category: "basics",
    descriptionEn: "Record changes to the repository.",
    descriptionJa: "リポジトリに変更を記録します。",
    options: [
      { flag: "-m <message>", descriptionEn: "Set the commit message inline", descriptionJa: "コミットメッセージをインラインで指定" },
      { flag: "-a, --all", descriptionEn: "Stage all modified files and commit", descriptionJa: "変更されたファイルを全てステージングしてコミット" },
      { flag: "--amend", descriptionEn: "Amend the previous commit", descriptionJa: "直前のコミットを修正" },
      { flag: "--no-edit", descriptionEn: "Amend without changing the commit message", descriptionJa: "コミットメッセージを変更せずに修正" },
      { flag: "-s, --signoff", descriptionEn: "Add a Signed-off-by trailer", descriptionJa: "Signed-off-by トレーラーを追加" },
      { flag: "--allow-empty", descriptionEn: "Allow an empty commit", descriptionJa: "空のコミットを許可" },
      { flag: "-v, --verbose", descriptionEn: "Show diff in commit message editor", descriptionJa: "コミットメッセージエディタに差分を表示" },
      { flag: "--fixup <commit>", descriptionEn: "Create a fixup commit for autosquash", descriptionJa: "autosquash 用の fixup コミットを作成" },
    ],
  },
  {
    command: "git status",
    nameEn: "Show working tree status",
    nameJa: "作業状態を確認",
    category: "basics",
    descriptionEn: "Show the working tree status including staged, unstaged, and untracked files.",
    descriptionJa: "ステージング済み・未ステージング・未追跡ファイルを含む作業ツリーの状態を表示します。",
    options: [
      { flag: "-s, --short", descriptionEn: "Show status in short format", descriptionJa: "短い形式でステータスを表示" },
      { flag: "-b, --branch", descriptionEn: "Show branch info in short format", descriptionJa: "短い形式でブランチ情報を表示" },
      { flag: "--porcelain", descriptionEn: "Machine-readable output format", descriptionJa: "スクリプト向けの機械可読形式で出力" },
      { flag: "-u, --untracked-files[=<mode>]", descriptionEn: "Show untracked files (no/normal/all)", descriptionJa: "未追跡ファイルの表示モード（no/normal/all）" },
    ],
  },
  {
    command: "git push",
    nameEn: "Push to remote",
    nameJa: "リモートにプッシュ",
    category: "basics",
    descriptionEn: "Update remote refs along with associated objects.",
    descriptionJa: "リモートの参照を関連オブジェクトとともに更新します。",
    options: [
      { flag: "-u, --set-upstream", descriptionEn: "Set upstream tracking reference", descriptionJa: "上流の追跡参照を設定" },
      { flag: "--force", descriptionEn: "Force push (may overwrite remote changes)", descriptionJa: "強制プッシュ（リモートの変更を上書きする可能性あり）" },
      { flag: "--force-with-lease", descriptionEn: "Force push only if remote hasn't changed", descriptionJa: "リモートが変更されていない場合のみ強制プッシュ" },
      { flag: "--tags", descriptionEn: "Push all tags", descriptionJa: "すべてのタグをプッシュ" },
      { flag: "--delete", descriptionEn: "Delete remote branch", descriptionJa: "リモートブランチを削除" },
      { flag: "--dry-run", descriptionEn: "Simulate the push without sending data", descriptionJa: "データを送信せずプッシュをシミュレーション" },
      { flag: "--no-verify", descriptionEn: "Skip pre-push hooks", descriptionJa: "pre-push フックをスキップ" },
    ],
  },
  {
    command: "git pull",
    nameEn: "Pull from remote",
    nameJa: "リモートからプル",
    category: "basics",
    descriptionEn: "Fetch from and integrate with another repository or a local branch.",
    descriptionJa: "リモートリポジトリから取得して現在のブランチに統合します。",
    options: [
      { flag: "--rebase", descriptionEn: "Rebase instead of merge after fetching", descriptionJa: "フェッチ後にマージではなくリベースを実行" },
      { flag: "--no-rebase", descriptionEn: "Force merge after fetching", descriptionJa: "フェッチ後にマージを強制" },
      { flag: "--autostash", descriptionEn: "Automatically stash/unstash local changes", descriptionJa: "ローカルの変更を自動的にスタッシュ/アンスタッシュ" },
      { flag: "--ff-only", descriptionEn: "Only fast-forward merge", descriptionJa: "fast-forward マージのみ許可" },
      { flag: "--no-commit", descriptionEn: "Perform merge but do not commit", descriptionJa: "マージを実行するがコミットしない" },
    ],
  },
  {
    command: "git fetch",
    nameEn: "Fetch from remote",
    nameJa: "リモートからフェッチ",
    category: "basics",
    descriptionEn: "Download objects and refs from another repository.",
    descriptionJa: "リモートリポジトリからオブジェクトと参照をダウンロードします。",
    options: [
      { flag: "--all", descriptionEn: "Fetch from all remotes", descriptionJa: "すべてのリモートからフェッチ" },
      { flag: "--prune", descriptionEn: "Remove stale remote-tracking references", descriptionJa: "古いリモート追跡参照を削除" },
      { flag: "--tags", descriptionEn: "Fetch all tags", descriptionJa: "すべてのタグをフェッチ" },
      { flag: "--depth <n>", descriptionEn: "Limit fetching to specified depth", descriptionJa: "指定した深さまでフェッチを制限" },
      { flag: "--dry-run", descriptionEn: "Show what would be fetched without fetching", descriptionJa: "実際にフェッチせず何がフェッチされるか表示" },
    ],
  },

  // ブランチ (branching)
  {
    command: "git branch",
    nameEn: "Manage branches",
    nameJa: "ブランチを管理",
    category: "branching",
    descriptionEn: "List, create, or delete branches.",
    descriptionJa: "ブランチの一覧表示、作成、削除を行います。",
    options: [
      { flag: "-a, --all", descriptionEn: "List both local and remote branches", descriptionJa: "ローカルとリモートの両方のブランチを表示" },
      { flag: "-r, --remotes", descriptionEn: "List remote-tracking branches", descriptionJa: "リモート追跡ブランチを表示" },
      { flag: "-d, --delete", descriptionEn: "Delete a fully merged branch", descriptionJa: "完全にマージ済みのブランチを削除" },
      { flag: "-D", descriptionEn: "Force delete a branch", descriptionJa: "ブランチを強制削除" },
      { flag: "-m, --move", descriptionEn: "Rename a branch", descriptionJa: "ブランチ名を変更" },
      { flag: "-c, --copy", descriptionEn: "Copy a branch", descriptionJa: "ブランチをコピー" },
      { flag: "-v, --verbose", descriptionEn: "Show commit hash and subject for each branch", descriptionJa: "各ブランチのコミットハッシュと件名を表示" },
      { flag: "--merged", descriptionEn: "List branches merged into HEAD", descriptionJa: "HEADにマージ済みのブランチを表示" },
      { flag: "--no-merged", descriptionEn: "List branches not merged into HEAD", descriptionJa: "HEADにマージされていないブランチを表示" },
      { flag: "--sort=<key>", descriptionEn: "Sort branches by a key (e.g. -committerdate)", descriptionJa: "指定したキーでブランチをソート（例: -committerdate）" },
      { flag: "--contains <commit>", descriptionEn: "List branches containing the specified commit", descriptionJa: "指定したコミットを含むブランチを表示" },
    ],
  },
  {
    command: "git checkout",
    nameEn: "Switch branches / restore files",
    nameJa: "ブランチ切り替え・ファイル復元",
    category: "branching",
    descriptionEn: "Switch branches or restore working tree files.",
    descriptionJa: "ブランチの切り替えまたは作業ツリーのファイルを復元します。",
    options: [
      { flag: "-b <branch>", descriptionEn: "Create and switch to a new branch", descriptionJa: "新しいブランチを作成して切り替え" },
      { flag: "-B <branch>", descriptionEn: "Create or reset and switch to a branch", descriptionJa: "ブランチを作成またはリセットして切り替え" },
      { flag: "--track", descriptionEn: "Set up tracking for a remote branch", descriptionJa: "リモートブランチの追跡を設定" },
      { flag: "--orphan <branch>", descriptionEn: "Create a new orphan branch", descriptionJa: "新しい孤立ブランチを作成" },
      { flag: "-f, --force", descriptionEn: "Force checkout (discard local changes)", descriptionJa: "強制チェックアウト（ローカルの変更を破棄）" },
      { flag: "-- <path>", descriptionEn: "Restore specific file from HEAD", descriptionJa: "HEAD から特定のファイルを復元" },
    ],
  },
  {
    command: "git switch",
    nameEn: "Switch branches",
    nameJa: "ブランチ切り替え",
    category: "branching",
    descriptionEn: "Switch to a specified branch.",
    descriptionJa: "指定したブランチに切り替えます。",
    options: [
      { flag: "-c, --create <branch>", descriptionEn: "Create and switch to a new branch", descriptionJa: "新しいブランチを作成して切り替え" },
      { flag: "-C", descriptionEn: "Create or reset and switch to a branch", descriptionJa: "ブランチを作成またはリセットして切り替え" },
      { flag: "--detach", descriptionEn: "Switch to a commit in detached HEAD state", descriptionJa: "detached HEAD 状態でコミットに切り替え" },
      { flag: "--track", descriptionEn: "Set up tracking for a remote branch", descriptionJa: "リモートブランチの追跡を設定" },
      { flag: "--orphan <branch>", descriptionEn: "Create a new orphan branch", descriptionJa: "新しい孤立ブランチを作成" },
      { flag: "-f, --force", descriptionEn: "Force switch (discard local changes)", descriptionJa: "強制切り替え（ローカルの変更を破棄）" },
    ],
  },
  {
    command: "git merge",
    nameEn: "Merge branches",
    nameJa: "ブランチをマージ",
    category: "branching",
    descriptionEn: "Join two or more development histories together.",
    descriptionJa: "2つ以上の開発履歴を統合します。",
    options: [
      { flag: "--no-ff", descriptionEn: "Create a merge commit even for fast-forward", descriptionJa: "fast-forward でもマージコミットを作成" },
      { flag: "--ff-only", descriptionEn: "Only allow fast-forward merge", descriptionJa: "fast-forward マージのみ許可" },
      { flag: "--squash", descriptionEn: "Squash all commits into one before merging", descriptionJa: "マージ前にすべてのコミットを1つにまとめる" },
      { flag: "--abort", descriptionEn: "Abort the current merge", descriptionJa: "現在のマージを中断" },
      { flag: "--continue", descriptionEn: "Continue after resolving conflicts", descriptionJa: "コンフリクト解決後にマージを続行" },
      { flag: "-m <message>", descriptionEn: "Set the merge commit message", descriptionJa: "マージコミットのメッセージを設定" },
      { flag: "--no-commit", descriptionEn: "Perform merge but do not commit", descriptionJa: "マージを実行するがコミットしない" },
      { flag: "-s, --strategy <strategy>", descriptionEn: "Use a specific merge strategy", descriptionJa: "特定のマージ戦略を使用" },
    ],
  },
  {
    command: "git rebase",
    nameEn: "Rebase commits",
    nameJa: "コミット履歴を付け替え",
    category: "branching",
    descriptionEn: "Reapply commits on top of another base tip.",
    descriptionJa: "別のベースの先端にコミットを再適用します。",
    options: [
      { flag: "-i, --interactive", descriptionEn: "Start an interactive rebase", descriptionJa: "対話的リベースを開始" },
      { flag: "--onto <newbase>", descriptionEn: "Rebase onto a new base commit", descriptionJa: "新しいベースコミットにリベース" },
      { flag: "--abort", descriptionEn: "Abort the rebase", descriptionJa: "リベースを中断" },
      { flag: "--continue", descriptionEn: "Continue after resolving conflicts", descriptionJa: "コンフリクト解決後にリベースを続行" },
      { flag: "--skip", descriptionEn: "Skip the current commit", descriptionJa: "現在のコミットをスキップ" },
      { flag: "--autosquash", descriptionEn: "Automatically apply fixup/squash commits", descriptionJa: "fixup/squash コミットを自動的に適用" },
      { flag: "--autostash", descriptionEn: "Automatically stash/unstash local changes", descriptionJa: "ローカルの変更を自動的にスタッシュ/アンスタッシュ" },
      { flag: "-x <cmd>", descriptionEn: "Run a command after each commit", descriptionJa: "各コミットの後にコマンドを実行" },
    ],
  },

  // 差分・履歴 (diff_history)
  {
    command: "git diff",
    nameEn: "Show differences",
    nameJa: "差分を表示",
    category: "diff_history",
    descriptionEn: "Show changes between commits, commit and working tree, etc.",
    descriptionJa: "コミット間、コミットと作業ツリー間などの差分を表示します。",
    options: [
      { flag: "--staged, --cached", descriptionEn: "Show staged changes", descriptionJa: "ステージング済みの変更を表示" },
      { flag: "--stat", descriptionEn: "Show diffstat (summary of changes)", descriptionJa: "変更の統計情報を表示" },
      { flag: "--name-only", descriptionEn: "Show only names of changed files", descriptionJa: "変更されたファイル名のみ表示" },
      { flag: "--name-status", descriptionEn: "Show names and status of changed files", descriptionJa: "変更されたファイル名とステータスを表示" },
      { flag: "--word-diff", descriptionEn: "Show word-level diff", descriptionJa: "単語レベルの差分を表示" },
      { flag: "--color-words", descriptionEn: "Show colored word-level diff", descriptionJa: "色付きの単語レベル差分を表示" },
      { flag: "-w, --ignore-all-space", descriptionEn: "Ignore all whitespace changes", descriptionJa: "すべての空白の変更を無視" },
      { flag: "--no-index", descriptionEn: "Compare two paths outside of a repository", descriptionJa: "リポジトリ外の2つのパスを比較" },
    ],
  },
  {
    command: "git log",
    nameEn: "Show commit history",
    nameJa: "コミット履歴を表示",
    category: "diff_history",
    descriptionEn: "Show the commit logs.",
    descriptionJa: "コミットログを表示します。",
    options: [
      { flag: "--oneline", descriptionEn: "Show each commit on a single line", descriptionJa: "各コミットを1行で表示" },
      { flag: "--graph", descriptionEn: "Draw ASCII graph of branch structure", descriptionJa: "ブランチ構造のASCIIグラフを描画" },
      { flag: "--all", descriptionEn: "Show logs from all branches", descriptionJa: "すべてのブランチのログを表示" },
      { flag: "-n <number>", descriptionEn: "Limit the number of commits shown", descriptionJa: "表示するコミット数を制限" },
      { flag: "--author=<pattern>", descriptionEn: "Filter by author", descriptionJa: "作成者でフィルタ" },
      { flag: "--since=<date>", descriptionEn: "Show commits after a date", descriptionJa: "指定日以降のコミットを表示" },
      { flag: "--until=<date>", descriptionEn: "Show commits before a date", descriptionJa: "指定日以前のコミットを表示" },
      { flag: "--grep=<pattern>", descriptionEn: "Filter by commit message pattern", descriptionJa: "コミットメッセージのパターンでフィルタ" },
      { flag: "-p, --patch", descriptionEn: "Show patch (diff) for each commit", descriptionJa: "各コミットのパッチ（差分）を表示" },
      { flag: "--stat", descriptionEn: "Show diffstat for each commit", descriptionJa: "各コミットの変更統計を表示" },
      { flag: "--pretty=<format>", descriptionEn: "Use a custom format (oneline, short, full, etc.)", descriptionJa: "カスタム形式で表示（oneline, short, full 等）" },
      { flag: "--follow", descriptionEn: "Follow file renames", descriptionJa: "ファイルのリネームを追跡" },
      { flag: "-S <string>", descriptionEn: "Find commits that add/remove a string (pickaxe)", descriptionJa: "文字列の追加・削除を含むコミットを検索（pickaxe）" },
      { flag: "-G <regex>", descriptionEn: "Find commits where patch matches a regex", descriptionJa: "パッチが正規表現にマッチするコミットを検索" },
    ],
  },
  {
    command: "git show",
    nameEn: "Show commit details",
    nameJa: "コミット内容を表示",
    category: "diff_history",
    descriptionEn: "Show various types of objects (commits, tags, etc.).",
    descriptionJa: "各種オブジェクト（コミット、タグ等）の内容を表示します。",
    options: [
      { flag: "--stat", descriptionEn: "Show diffstat summary", descriptionJa: "変更の統計情報を表示" },
      { flag: "--name-only", descriptionEn: "Show only names of changed files", descriptionJa: "変更されたファイル名のみ表示" },
      { flag: "--format=<format>", descriptionEn: "Use a custom format for output", descriptionJa: "カスタム形式で出力" },
      { flag: "--no-patch", descriptionEn: "Suppress diff output", descriptionJa: "差分出力を抑制" },
    ],
  },
  {
    command: "git blame",
    nameEn: "Show line-by-line history",
    nameJa: "行ごとの変更履歴を表示",
    category: "diff_history",
    descriptionEn: "Show who last modified each line of a file.",
    descriptionJa: "ファイルの各行を最後に変更したのは誰かを表示します。",
    options: [
      { flag: "-L <start>,<end>", descriptionEn: "Annotate only the specified line range", descriptionJa: "指定した行範囲のみ注釈を表示" },
      { flag: "-w", descriptionEn: "Ignore whitespace changes", descriptionJa: "空白の変更を無視" },
      { flag: "-C", descriptionEn: "Detect lines moved/copied within a file", descriptionJa: "ファイル内の行の移動・コピーを検出" },
      { flag: "-C -C", descriptionEn: "Detect lines moved/copied across files", descriptionJa: "ファイル間の行の移動・コピーを検出" },
      { flag: "-e, --show-email", descriptionEn: "Show author email instead of name", descriptionJa: "作成者名の代わりにメールアドレスを表示" },
      { flag: "--since=<date>", descriptionEn: "Show blame from a specific date", descriptionJa: "指定日以降の変更履歴を表示" },
    ],
  },

  // リモート (remote)
  {
    command: "git remote",
    nameEn: "Manage remotes",
    nameJa: "リモートを管理",
    category: "remote",
    descriptionEn: "Manage set of tracked repositories.",
    descriptionJa: "追跡するリモートリポジトリを管理します。",
    options: [
      { flag: "-v, --verbose", descriptionEn: "Show remote URLs", descriptionJa: "リモートURLを表示" },
      { flag: "add <name> <url>", descriptionEn: "Add a new remote", descriptionJa: "新しいリモートを追加" },
      { flag: "remove <name>", descriptionEn: "Remove a remote", descriptionJa: "リモートを削除" },
      { flag: "rename <old> <new>", descriptionEn: "Rename a remote", descriptionJa: "リモート名を変更" },
      { flag: "set-url <name> <url>", descriptionEn: "Change a remote's URL", descriptionJa: "リモートのURLを変更" },
      { flag: "show <name>", descriptionEn: "Show detailed info about a remote", descriptionJa: "リモートの詳細情報を表示" },
      { flag: "prune <name>", descriptionEn: "Remove stale tracking branches", descriptionJa: "古い追跡ブランチを削除" },
      { flag: "get-url <name>", descriptionEn: "Get the URL of a remote", descriptionJa: "リモートのURLを取得" },
      { flag: "update", descriptionEn: "Fetch updates for all remotes", descriptionJa: "すべてのリモートの更新をフェッチ" },
    ],
  },

  // スタッシュ (stash)
  {
    command: "git stash",
    nameEn: "Stash changes",
    nameJa: "変更を一時退避",
    category: "stash",
    descriptionEn: "Stash the changes in a dirty working directory away.",
    descriptionJa: "作業ディレクトリの変更を一時的に退避します。",
    options: [
      { flag: "push", descriptionEn: "Stash current changes (default action)", descriptionJa: "現在の変更をスタッシュ（デフォルト動作）" },
      { flag: "push -m <message>", descriptionEn: "Stash with a descriptive message", descriptionJa: "説明メッセージ付きでスタッシュ" },
      { flag: "push -p, --patch", descriptionEn: "Interactively select hunks to stash", descriptionJa: "対話的にスタッシュする変更を選択" },
      { flag: "push --include-untracked", descriptionEn: "Include untracked files in stash", descriptionJa: "未追跡ファイルもスタッシュに含める" },
      { flag: "push --keep-index", descriptionEn: "Keep staged changes in the working tree", descriptionJa: "ステージング済みの変更を作業ツリーに残す" },
      { flag: "list", descriptionEn: "List all stashes", descriptionJa: "すべてのスタッシュを一覧表示" },
      { flag: "show [stash]", descriptionEn: "Show stash changes summary", descriptionJa: "スタッシュの変更概要を表示" },
      { flag: "show -p [stash]", descriptionEn: "Show stash changes in patch format", descriptionJa: "スタッシュの変更をパッチ形式で表示" },
      { flag: "pop [stash]", descriptionEn: "Apply and remove the stash", descriptionJa: "スタッシュを適用して削除" },
      { flag: "apply [stash]", descriptionEn: "Apply the stash without removing it", descriptionJa: "スタッシュを削除せずに適用" },
      { flag: "drop [stash]", descriptionEn: "Remove a specific stash", descriptionJa: "特定のスタッシュを削除" },
      { flag: "clear", descriptionEn: "Remove all stashes", descriptionJa: "すべてのスタッシュを削除" },
      { flag: "branch <name> [stash]", descriptionEn: "Create a branch from a stash", descriptionJa: "スタッシュからブランチを作成" },
    ],
  },

  // リセット・取り消し (reset_undo)
  {
    command: "git reset",
    nameEn: "Reset commits",
    nameJa: "コミットをリセット",
    category: "reset_undo",
    descriptionEn: "Reset current HEAD to the specified state.",
    descriptionJa: "現在のHEADを指定した状態にリセットします。",
    options: [
      { flag: "--soft <commit>", descriptionEn: "Reset HEAD only, keep staged and working tree", descriptionJa: "HEADのみリセット、ステージングと作業ツリーは保持" },
      { flag: "--mixed <commit>", descriptionEn: "Reset HEAD and staging area (default)", descriptionJa: "HEADとステージングエリアをリセット（デフォルト）" },
      { flag: "--hard <commit>", descriptionEn: "Reset HEAD, staging area, and working tree", descriptionJa: "HEAD、ステージングエリア、作業ツリーをすべてリセット" },
      { flag: "--merge", descriptionEn: "Reset to abort a failed merge", descriptionJa: "失敗したマージを中断するためにリセット" },
      { flag: "--keep", descriptionEn: "Reset HEAD but keep local changes", descriptionJa: "HEADをリセットするがローカルの変更は保持" },
      { flag: "-p, --patch", descriptionEn: "Interactively select hunks to unstage", descriptionJa: "対話的にアンステージする変更を選択" },
    ],
  },
  {
    command: "git revert",
    nameEn: "Revert commits",
    nameJa: "コミットを打ち消し",
    category: "reset_undo",
    descriptionEn: "Create new commits that undo the changes from previous commits.",
    descriptionJa: "以前のコミットの変更を打ち消す新しいコミットを作成します。",
    options: [
      { flag: "-n, --no-commit", descriptionEn: "Revert changes without committing", descriptionJa: "コミットせずに変更を打ち消し" },
      { flag: "--abort", descriptionEn: "Abort the revert operation", descriptionJa: "打ち消し操作を中断" },
      { flag: "--continue", descriptionEn: "Continue after resolving conflicts", descriptionJa: "コンフリクト解決後に続行" },
      { flag: "-m <parent-number>", descriptionEn: "Specify mainline parent for merge commit revert", descriptionJa: "マージコミットの打ち消しで親番号を指定" },
      { flag: "--no-edit", descriptionEn: "Use the default commit message", descriptionJa: "デフォルトのコミットメッセージを使用" },
    ],
  },
  {
    command: "git restore",
    nameEn: "Restore files",
    nameJa: "ファイルを復元",
    category: "reset_undo",
    descriptionEn: "Restore working tree files.",
    descriptionJa: "作業ツリーのファイルを復元します。",
    options: [
      { flag: "--staged", descriptionEn: "Unstage a file (restore from HEAD to staging)", descriptionJa: "ファイルをアンステージ（HEADからステージングに復元）" },
      { flag: "--worktree", descriptionEn: "Restore file in the working tree (default)", descriptionJa: "作業ツリーのファイルを復元（デフォルト）" },
      { flag: "--source=<commit>", descriptionEn: "Restore from a specific commit", descriptionJa: "特定のコミットから復元" },
      { flag: "-p, --patch", descriptionEn: "Interactively select hunks to restore", descriptionJa: "対話的に復元する変更を選択" },
    ],
  },
  {
    command: "git clean",
    nameEn: "Remove untracked files",
    nameJa: "未追跡ファイルを削除",
    category: "reset_undo",
    descriptionEn: "Remove untracked files from the working tree.",
    descriptionJa: "作業ツリーから未追跡ファイルを削除します。",
    options: [
      { flag: "-n, --dry-run", descriptionEn: "Show what would be removed without removing", descriptionJa: "実際に削除せず何が削除されるか表示" },
      { flag: "-f, --force", descriptionEn: "Force removal of untracked files", descriptionJa: "未追跡ファイルを強制削除" },
      { flag: "-d", descriptionEn: "Also remove untracked directories", descriptionJa: "未追跡ディレクトリも削除" },
      { flag: "-x", descriptionEn: "Also remove ignored files", descriptionJa: "無視されたファイルも削除" },
      { flag: "-X", descriptionEn: "Remove only ignored files", descriptionJa: "無視されたファイルのみ削除" },
      { flag: "-i, --interactive", descriptionEn: "Interactive mode", descriptionJa: "対話モード" },
    ],
  },

  // タグ (tag)
  {
    command: "git tag",
    nameEn: "Manage tags",
    nameJa: "タグを管理",
    category: "tag",
    descriptionEn: "Create, list, delete, or verify tags.",
    descriptionJa: "タグの作成、一覧表示、削除、検証を行います。",
    options: [
      { flag: "-a <tagname>", descriptionEn: "Create an annotated tag", descriptionJa: "注釈付きタグを作成" },
      { flag: "-m <message>", descriptionEn: "Set the tag message", descriptionJa: "タグメッセージを設定" },
      { flag: "-d <tagname>", descriptionEn: "Delete a tag", descriptionJa: "タグを削除" },
      { flag: "-l, --list [pattern]", descriptionEn: "List tags matching a pattern", descriptionJa: "パターンに一致するタグを一覧表示" },
      { flag: "-n <num>", descriptionEn: "Show n lines of each tag annotation", descriptionJa: "各タグの注釈をn行表示" },
      { flag: "-f, --force", descriptionEn: "Force create/update a tag", descriptionJa: "タグを強制作成/更新" },
      { flag: "--sort=<key>", descriptionEn: "Sort tags by a key", descriptionJa: "指定したキーでタグをソート" },
      { flag: "-v, --verify", descriptionEn: "Verify the GPG signature of a tag", descriptionJa: "タグのGPG署名を検証" },
      { flag: "--contains <commit>", descriptionEn: "List tags containing the specified commit", descriptionJa: "指定したコミットを含むタグを表示" },
    ],
  },

  // Worktree (worktree)
  {
    command: "git worktree",
    nameEn: "Manage worktrees",
    nameJa: "ワークツリーを管理",
    category: "worktree",
    descriptionEn: "Manage multiple working trees.",
    descriptionJa: "複数の作業ツリーを管理します。",
    options: [
      { flag: "add <path> [branch]", descriptionEn: "Create a new worktree at the given path", descriptionJa: "指定したパスに新しいワークツリーを作成" },
      { flag: "add -b <branch> <path>", descriptionEn: "Create a new branch and worktree", descriptionJa: "新しいブランチとワークツリーを作成" },
      { flag: "list", descriptionEn: "List all worktrees", descriptionJa: "すべてのワークツリーを一覧表示" },
      { flag: "remove <worktree>", descriptionEn: "Remove a worktree", descriptionJa: "ワークツリーを削除" },
      { flag: "move <worktree> <new-path>", descriptionEn: "Move a worktree to a new path", descriptionJa: "ワークツリーを新しいパスに移動" },
      { flag: "prune", descriptionEn: "Remove stale worktree references", descriptionJa: "古いワークツリー参照を削除" },
      { flag: "lock <worktree>", descriptionEn: "Lock a worktree to prevent pruning", descriptionJa: "ワークツリーをロックして削除を防止" },
      { flag: "unlock <worktree>", descriptionEn: "Unlock a worktree", descriptionJa: "ワークツリーのロックを解除" },
      { flag: "repair", descriptionEn: "Repair worktree administrative files", descriptionJa: "ワークツリーの管理ファイルを修復" },
    ],
  },

  // 設定 (config)
  {
    command: "git config",
    nameEn: "Manage configuration",
    nameJa: "設定を管理",
    category: "config",
    descriptionEn: "Get and set repository or global options.",
    descriptionJa: "リポジトリまたはグローバルの設定を取得・設定します。",
    options: [
      { flag: "--global", descriptionEn: "Use global config file", descriptionJa: "グローバル設定ファイルを使用" },
      { flag: "--local", descriptionEn: "Use repository config file", descriptionJa: "リポジトリ設定ファイルを使用" },
      { flag: "--system", descriptionEn: "Use system config file", descriptionJa: "システム設定ファイルを使用" },
      { flag: "--list", descriptionEn: "List all variables set in config", descriptionJa: "設定されているすべての変数を一覧表示" },
      { flag: "--get <key>", descriptionEn: "Get the value for a given key", descriptionJa: "指定したキーの値を取得" },
      { flag: "--unset <key>", descriptionEn: "Remove a variable from config", descriptionJa: "設定から変数を削除" },
      { flag: "-e, --edit", descriptionEn: "Open config file in editor", descriptionJa: "エディタで設定ファイルを開く" },
      { flag: "--show-origin", descriptionEn: "Show the origin of each config entry", descriptionJa: "各設定エントリの出典を表示" },
      { flag: "--show-scope", descriptionEn: "Show the scope of each config entry", descriptionJa: "各設定エントリのスコープを表示" },
    ],
  },
];

// カテゴリごとにグループ化
export function getGitCommandsByCategory(): Map<GitCommandCategory, GitCommand[]> {
  return groupByCategory(GIT_COMMANDS, GIT_CATEGORY_ORDER);
}
