import { groupByCategory } from "./utils";

// Shell/Linuxコマンドのカテゴリ
export type ShellCommandCategory =
  | "file_operations"
  | "text_processing"
  | "process_management"
  | "permissions"
  | "networking"
  | "compression"
  | "system_info"
  | "pipe_redirect";

// Shellコマンドオプションの型
export interface ShellCommandOption {
  flag: string;
  descriptionEn: string;
  descriptionJa: string;
}

// Shellコマンドの型
export interface ShellCommand {
  command: string;
  nameEn: string;
  nameJa: string;
  category: ShellCommandCategory;
  descriptionEn: string;
  descriptionJa: string;
  options: ShellCommandOption[];
}

// カテゴリの表示順
export const SHELL_CATEGORY_ORDER: ShellCommandCategory[] = [
  "file_operations",
  "text_processing",
  "process_management",
  "permissions",
  "networking",
  "compression",
  "system_info",
  "pipe_redirect",
];

// Shellコマンド一覧
export const SHELL_COMMANDS: ShellCommand[] = [
  // ファイル操作 (file_operations)
  {
    command: "ls",
    nameEn: "List directory contents",
    nameJa: "ディレクトリの内容を一覧表示",
    category: "file_operations",
    descriptionEn: "List directory contents.",
    descriptionJa: "ディレクトリの内容を一覧表示します。",
    options: [
      { flag: "-l", descriptionEn: "Long listing format", descriptionJa: "詳細表示" },
      { flag: "-a, --all", descriptionEn: "Show hidden files", descriptionJa: "隠しファイルを表示" },
      { flag: "-h, --human-readable", descriptionEn: "Human-readable file sizes", descriptionJa: "人が読みやすいサイズ表記" },
      { flag: "-R, --recursive", descriptionEn: "List subdirectories recursively", descriptionJa: "再帰的にサブディレクトリも表示" },
      { flag: "-t", descriptionEn: "Sort by modification time", descriptionJa: "更新時刻でソート" },
      { flag: "-S", descriptionEn: "Sort by file size", descriptionJa: "ファイルサイズでソート" },
    ],
  },
  {
    command: "cd",
    nameEn: "Change directory",
    nameJa: "ディレクトリを移動",
    category: "file_operations",
    descriptionEn: "Change the current working directory.",
    descriptionJa: "カレントディレクトリを変更します。",
    options: [
      { flag: "-", descriptionEn: "Switch to previous directory", descriptionJa: "前のディレクトリに戻る" },
      { flag: "~", descriptionEn: "Go to home directory", descriptionJa: "ホームディレクトリに移動" },
      { flag: "..", descriptionEn: "Go to parent directory", descriptionJa: "親ディレクトリに移動" },
    ],
  },
  {
    command: "cp",
    nameEn: "Copy files",
    nameJa: "ファイルをコピー",
    category: "file_operations",
    descriptionEn: "Copy files and directories.",
    descriptionJa: "ファイルやディレクトリをコピーします。",
    options: [
      { flag: "-r, -R, --recursive", descriptionEn: "Copy directories recursively", descriptionJa: "ディレクトリを再帰的にコピー" },
      { flag: "-i, --interactive", descriptionEn: "Prompt before overwrite", descriptionJa: "上書き前に確認" },
      { flag: "-v, --verbose", descriptionEn: "Explain what is being done", descriptionJa: "実行内容を表示" },
      { flag: "-p", descriptionEn: "Preserve file attributes", descriptionJa: "ファイル属性を保持" },
    ],
  },
  {
    command: "mv",
    nameEn: "Move / rename files",
    nameJa: "ファイルを移動/名前変更",
    category: "file_operations",
    descriptionEn: "Move or rename files and directories.",
    descriptionJa: "ファイルやディレクトリの移動・名前変更を行います。",
    options: [
      { flag: "-i, --interactive", descriptionEn: "Prompt before overwrite", descriptionJa: "上書き前に確認" },
      { flag: "-v, --verbose", descriptionEn: "Explain what is being done", descriptionJa: "実行内容を表示" },
      { flag: "-n, --no-clobber", descriptionEn: "Do not overwrite existing files", descriptionJa: "既存ファイルを上書きしない" },
    ],
  },
  {
    command: "rm",
    nameEn: "Remove files",
    nameJa: "ファイルを削除",
    category: "file_operations",
    descriptionEn: "Remove files or directories.",
    descriptionJa: "ファイルやディレクトリを削除します。",
    options: [
      { flag: "-r, -R, --recursive", descriptionEn: "Remove directories recursively", descriptionJa: "ディレクトリを再帰的に削除" },
      { flag: "-f, --force", descriptionEn: "Force removal without confirmation", descriptionJa: "確認なしで強制削除" },
      { flag: "-i, --interactive", descriptionEn: "Prompt before every removal", descriptionJa: "削除前に毎回確認" },
      { flag: "-d, --dir", descriptionEn: "Remove empty directories", descriptionJa: "空のディレクトリを削除" },
    ],
  },
  {
    command: "mkdir",
    nameEn: "Create directory",
    nameJa: "ディレクトリを作成",
    category: "file_operations",
    descriptionEn: "Create directories.",
    descriptionJa: "ディレクトリを作成します。",
    options: [
      { flag: "-p, --parents", descriptionEn: "Create parent directories as needed", descriptionJa: "必要に応じて親ディレクトリも作成" },
      { flag: "-v, --verbose", descriptionEn: "Print a message for each created directory", descriptionJa: "作成したディレクトリごとにメッセージを表示" },
    ],
  },
  {
    command: "find",
    nameEn: "Find files",
    nameJa: "ファイルを検索",
    category: "file_operations",
    descriptionEn: "Search for files in a directory hierarchy.",
    descriptionJa: "ディレクトリ階層内でファイルを検索します。",
    options: [
      { flag: "-name <pattern>", descriptionEn: "Search by filename pattern", descriptionJa: "ファイル名パターンで検索" },
      { flag: "-type <type>", descriptionEn: "File type (f=file, d=dir, l=link)", descriptionJa: "ファイルタイプ（f=ファイル, d=ディレクトリ, l=リンク）" },
      { flag: "-mtime <n>", descriptionEn: "Modified n days ago", descriptionJa: "n日前に更新されたファイル" },
      { flag: "-size <n>", descriptionEn: "File size (e.g., +100M)", descriptionJa: "ファイルサイズ（例: +100M）" },
      { flag: "-exec <cmd> {} \\;", descriptionEn: "Execute command on each file", descriptionJa: "各ファイルに対してコマンドを実行" },
      { flag: "-maxdepth <n>", descriptionEn: "Descend at most n directory levels", descriptionJa: "最大n階層まで検索" },
    ],
  },
  {
    command: "ln",
    nameEn: "Create links",
    nameJa: "リンクを作成",
    category: "file_operations",
    descriptionEn: "Create hard and symbolic links.",
    descriptionJa: "ハードリンクやシンボリックリンクを作成します。",
    options: [
      { flag: "-s, --symbolic", descriptionEn: "Create symbolic (soft) link", descriptionJa: "シンボリック（ソフト）リンクを作成" },
      { flag: "-f, --force", descriptionEn: "Remove existing destination files", descriptionJa: "既存の宛先ファイルを削除" },
    ],
  },

  // テキスト処理 (text_processing)
  {
    command: "grep",
    nameEn: "Search text patterns",
    nameJa: "テキストパターンを検索",
    category: "text_processing",
    descriptionEn: "Search for patterns in files.",
    descriptionJa: "ファイル内のパターンを検索します。",
    options: [
      { flag: "-r, -R, --recursive", descriptionEn: "Search recursively", descriptionJa: "再帰的に検索" },
      { flag: "-i, --ignore-case", descriptionEn: "Case-insensitive search", descriptionJa: "大文字小文字を区別しない" },
      { flag: "-n, --line-number", descriptionEn: "Show line numbers", descriptionJa: "行番号を表示" },
      { flag: "-v, --invert-match", descriptionEn: "Invert match (exclude)", descriptionJa: "マッチしない行を表示" },
      { flag: "-c, --count", descriptionEn: "Count matching lines", descriptionJa: "マッチした行数を表示" },
      { flag: "-l, --files-with-matches", descriptionEn: "Print only filenames", descriptionJa: "ファイル名のみ表示" },
      { flag: "-E, --extended-regexp", descriptionEn: "Use extended regex", descriptionJa: "拡張正規表現を使用" },
      { flag: "-A <n>", descriptionEn: "Print n lines after match", descriptionJa: "マッチ後のn行を表示" },
      { flag: "-B <n>", descriptionEn: "Print n lines before match", descriptionJa: "マッチ前のn行を表示" },
    ],
  },
  {
    command: "sed",
    nameEn: "Stream editor",
    nameJa: "ストリームエディタ",
    category: "text_processing",
    descriptionEn: "Stream editor for filtering and transforming text.",
    descriptionJa: "テキストのフィルタリングと変換を行うストリームエディタ。",
    options: [
      { flag: "-i [suffix]", descriptionEn: "Edit files in place", descriptionJa: "ファイルを直接編集" },
      { flag: "-n", descriptionEn: "Suppress automatic printing", descriptionJa: "自動出力を抑制" },
      { flag: "-e <script>", descriptionEn: "Add script to commands", descriptionJa: "コマンドにスクリプトを追加" },
      { flag: "s/old/new/g", descriptionEn: "Substitute old with new globally", descriptionJa: "oldをnewにグローバル置換" },
    ],
  },
  {
    command: "awk",
    nameEn: "Pattern scanning",
    nameJa: "パターン走査と処理",
    category: "text_processing",
    descriptionEn: "Pattern scanning and text processing language.",
    descriptionJa: "パターン走査とテキスト処理言語。",
    options: [
      { flag: "-F <sep>", descriptionEn: "Set field separator", descriptionJa: "フィールド区切り文字を設定" },
      { flag: "{print $N}", descriptionEn: "Print Nth field", descriptionJa: "N番目のフィールドを表示" },
      { flag: "NR", descriptionEn: "Current record (line) number", descriptionJa: "現在のレコード（行）番号" },
      { flag: "NF", descriptionEn: "Number of fields in current record", descriptionJa: "現在のレコードのフィールド数" },
    ],
  },
  {
    command: "sort",
    nameEn: "Sort lines",
    nameJa: "行をソート",
    category: "text_processing",
    descriptionEn: "Sort lines of text files.",
    descriptionJa: "テキストファイルの行をソートします。",
    options: [
      { flag: "-r, --reverse", descriptionEn: "Reverse the result of comparisons", descriptionJa: "逆順でソート" },
      { flag: "-n, --numeric-sort", descriptionEn: "Numeric sort", descriptionJa: "数値としてソート" },
      { flag: "-u, --unique", descriptionEn: "Output only unique lines", descriptionJa: "重複行を除いて出力" },
      { flag: "-k <key>", descriptionEn: "Sort by specified field", descriptionJa: "指定フィールドでソート" },
      { flag: "-t <sep>", descriptionEn: "Use sep as field separator", descriptionJa: "フィールド区切り文字を指定" },
    ],
  },
  {
    command: "uniq",
    nameEn: "Remove duplicates",
    nameJa: "重複行を除去",
    category: "text_processing",
    descriptionEn: "Report or omit repeated lines.",
    descriptionJa: "連続する重複行を報告または除去します。",
    options: [
      { flag: "-c, --count", descriptionEn: "Prefix lines by the number of occurrences", descriptionJa: "出現回数を行頭に表示" },
      { flag: "-d, --repeated", descriptionEn: "Only print duplicate lines", descriptionJa: "重複行のみ表示" },
      { flag: "-u, --unique", descriptionEn: "Only print unique lines", descriptionJa: "一意な行のみ表示" },
    ],
  },
  {
    command: "wc",
    nameEn: "Word count",
    nameJa: "文字数・行数カウント",
    category: "text_processing",
    descriptionEn: "Print newline, word, and byte counts for each file.",
    descriptionJa: "ファイルの改行数、単語数、バイト数を表示します。",
    options: [
      { flag: "-l, --lines", descriptionEn: "Print the newline counts", descriptionJa: "行数を表示" },
      { flag: "-w, --words", descriptionEn: "Print the word counts", descriptionJa: "単語数を表示" },
      { flag: "-c, --bytes", descriptionEn: "Print the byte counts", descriptionJa: "バイト数を表示" },
      { flag: "-m, --chars", descriptionEn: "Print the character counts", descriptionJa: "文字数を表示" },
    ],
  },
  {
    command: "head",
    nameEn: "Output first lines",
    nameJa: "先頭行を表示",
    category: "text_processing",
    descriptionEn: "Output the first part of files.",
    descriptionJa: "ファイルの先頭部分を出力します。",
    options: [
      { flag: "-n <num>", descriptionEn: "Print first num lines", descriptionJa: "先頭num行を表示" },
      { flag: "-c <num>", descriptionEn: "Print first num bytes", descriptionJa: "先頭numバイトを表示" },
    ],
  },
  {
    command: "tail",
    nameEn: "Output last lines",
    nameJa: "末尾行を表示",
    category: "text_processing",
    descriptionEn: "Output the last part of files.",
    descriptionJa: "ファイルの末尾部分を出力します。",
    options: [
      { flag: "-n <num>", descriptionEn: "Print last num lines", descriptionJa: "末尾num行を表示" },
      { flag: "-f, --follow", descriptionEn: "Follow file changes in real time", descriptionJa: "リアルタイムでファイルの変更を追跡" },
      { flag: "-c <num>", descriptionEn: "Print last num bytes", descriptionJa: "末尾numバイトを表示" },
    ],
  },

  // プロセス管理 (process_management)
  {
    command: "ps",
    nameEn: "List processes",
    nameJa: "プロセス一覧",
    category: "process_management",
    descriptionEn: "Report a snapshot of current processes.",
    descriptionJa: "現在のプロセスのスナップショットを表示します。",
    options: [
      { flag: "aux", descriptionEn: "Show all processes with details", descriptionJa: "すべてのプロセスの詳細を表示" },
      { flag: "-ef", descriptionEn: "Show all processes in full format", descriptionJa: "すべてのプロセスを完全な形式で表示" },
      { flag: "--sort=<key>", descriptionEn: "Sort by key (e.g., -%mem, -%cpu)", descriptionJa: "キーでソート（例: -%mem, -%cpu）" },
    ],
  },
  {
    command: "kill",
    nameEn: "Send signal to process",
    nameJa: "プロセスにシグナル送信",
    category: "process_management",
    descriptionEn: "Send a signal to a process.",
    descriptionJa: "プロセスにシグナルを送信します。",
    options: [
      { flag: "-9 (SIGKILL)", descriptionEn: "Force kill the process", descriptionJa: "プロセスを強制終了" },
      { flag: "-15 (SIGTERM)", descriptionEn: "Graceful termination (default)", descriptionJa: "正常終了（デフォルト）" },
      { flag: "-l", descriptionEn: "List all signal names", descriptionJa: "すべてのシグナル名を一覧表示" },
    ],
  },
  {
    command: "top",
    nameEn: "System monitor",
    nameJa: "システムモニター",
    category: "process_management",
    descriptionEn: "Display and update sorted information about processes.",
    descriptionJa: "プロセスの情報をソートしてリアルタイム表示します。",
    options: [
      { flag: "-d <sec>", descriptionEn: "Update interval in seconds", descriptionJa: "更新間隔（秒）" },
      { flag: "-p <pid>", descriptionEn: "Monitor specific process", descriptionJa: "特定のプロセスを監視" },
      { flag: "-u <user>", descriptionEn: "Show processes for a user", descriptionJa: "指定ユーザーのプロセスを表示" },
    ],
  },
  {
    command: "nohup",
    nameEn: "Run immune to hangups",
    nameJa: "ハングアップ無視で実行",
    category: "process_management",
    descriptionEn: "Run a command immune to hangups, with output to a non-tty.",
    descriptionJa: "ハングアップシグナルを無視してコマンドを実行します。",
    options: [],
  },
  {
    command: "bg / fg / jobs",
    nameEn: "Job control",
    nameJa: "ジョブ制御",
    category: "process_management",
    descriptionEn: "Manage background and foreground jobs.",
    descriptionJa: "バックグラウンドとフォアグラウンドのジョブを管理します。",
    options: [
      { flag: "bg %<n>", descriptionEn: "Resume job in background", descriptionJa: "ジョブをバックグラウンドで再開" },
      { flag: "fg %<n>", descriptionEn: "Resume job in foreground", descriptionJa: "ジョブをフォアグラウンドで再開" },
      { flag: "jobs -l", descriptionEn: "List jobs with PIDs", descriptionJa: "PID付きでジョブ一覧表示" },
    ],
  },

  // パーミッション (permissions)
  {
    command: "chmod",
    nameEn: "Change permissions",
    nameJa: "パーミッションを変更",
    category: "permissions",
    descriptionEn: "Change file mode bits.",
    descriptionJa: "ファイルのアクセス権限を変更します。",
    options: [
      { flag: "-R, --recursive", descriptionEn: "Change permissions recursively", descriptionJa: "再帰的に権限を変更" },
      { flag: "755", descriptionEn: "rwxr-xr-x (owner: rwx, group/other: rx)", descriptionJa: "rwxr-xr-x（所有者: rwx, グループ/その他: rx）" },
      { flag: "644", descriptionEn: "rw-r--r-- (owner: rw, group/other: r)", descriptionJa: "rw-r--r--（所有者: rw, グループ/その他: r）" },
      { flag: "+x", descriptionEn: "Add execute permission", descriptionJa: "実行権限を追加" },
    ],
  },
  {
    command: "chown",
    nameEn: "Change owner",
    nameJa: "所有者を変更",
    category: "permissions",
    descriptionEn: "Change file owner and group.",
    descriptionJa: "ファイルの所有者とグループを変更します。",
    options: [
      { flag: "-R, --recursive", descriptionEn: "Operate on files and directories recursively", descriptionJa: "再帰的にファイルとディレクトリに適用" },
      { flag: "user:group", descriptionEn: "Set user and group owner", descriptionJa: "ユーザーとグループの所有者を設定" },
    ],
  },
  {
    command: "sudo",
    nameEn: "Execute as superuser",
    nameJa: "スーパーユーザーとして実行",
    category: "permissions",
    descriptionEn: "Execute a command as another user (typically root).",
    descriptionJa: "他のユーザー（通常はroot）としてコマンドを実行します。",
    options: [
      { flag: "-u <user>", descriptionEn: "Run as specified user", descriptionJa: "指定ユーザーとして実行" },
      { flag: "-i", descriptionEn: "Simulate initial login", descriptionJa: "初期ログインをシミュレート" },
      { flag: "-s", descriptionEn: "Run a shell", descriptionJa: "シェルを実行" },
    ],
  },

  // ネットワーク (networking)
  {
    command: "curl",
    nameEn: "Transfer data",
    nameJa: "データ転送",
    category: "networking",
    descriptionEn: "Transfer data from or to a server.",
    descriptionJa: "サーバーとの間でデータを転送します。",
    options: [
      { flag: "-X <method>", descriptionEn: "Specify request method", descriptionJa: "リクエストメソッドを指定" },
      { flag: "-H <header>", descriptionEn: "Set custom header", descriptionJa: "カスタムヘッダーを設定" },
      { flag: "-d <data>", descriptionEn: "Send data in POST request", descriptionJa: "POSTリクエストでデータを送信" },
      { flag: "-o <file>", descriptionEn: "Write output to file", descriptionJa: "出力をファイルに書き込み" },
      { flag: "-s, --silent", descriptionEn: "Silent mode", descriptionJa: "サイレントモード" },
      { flag: "-v, --verbose", descriptionEn: "Verbose output", descriptionJa: "詳細出力" },
      { flag: "-L, --location", descriptionEn: "Follow redirects", descriptionJa: "リダイレクトに追従" },
      { flag: "-k, --insecure", descriptionEn: "Allow insecure connections", descriptionJa: "安全でない接続を許可" },
    ],
  },
  {
    command: "ssh",
    nameEn: "Secure shell",
    nameJa: "セキュアシェル",
    category: "networking",
    descriptionEn: "OpenSSH remote login client.",
    descriptionJa: "OpenSSHリモートログインクライアント。",
    options: [
      { flag: "-p <port>", descriptionEn: "Port to connect to", descriptionJa: "接続先ポート" },
      { flag: "-i <keyfile>", descriptionEn: "Identity file (private key)", descriptionJa: "秘密鍵ファイル" },
      { flag: "-L <local:host:remote>", descriptionEn: "Local port forwarding", descriptionJa: "ローカルポートフォワーディング" },
      { flag: "-N", descriptionEn: "Do not execute remote command", descriptionJa: "リモートコマンドを実行しない" },
      { flag: "-v", descriptionEn: "Verbose mode", descriptionJa: "詳細モード" },
    ],
  },
  {
    command: "scp",
    nameEn: "Secure copy",
    nameJa: "セキュアコピー",
    category: "networking",
    descriptionEn: "Copy files between hosts over SSH.",
    descriptionJa: "SSH経由でホスト間でファイルをコピーします。",
    options: [
      { flag: "-r", descriptionEn: "Recursively copy directories", descriptionJa: "ディレクトリを再帰的にコピー" },
      { flag: "-P <port>", descriptionEn: "Port to connect to", descriptionJa: "接続先ポート" },
      { flag: "-i <keyfile>", descriptionEn: "Identity file (private key)", descriptionJa: "秘密鍵ファイル" },
    ],
  },
  {
    command: "ping",
    nameEn: "Test connectivity",
    nameJa: "接続テスト",
    category: "networking",
    descriptionEn: "Send ICMP ECHO_REQUEST to network hosts.",
    descriptionJa: "ネットワークホストにICMP ECHO_REQUESTを送信します。",
    options: [
      { flag: "-c <count>", descriptionEn: "Stop after sending count packets", descriptionJa: "指定パケット数で停止" },
      { flag: "-i <interval>", descriptionEn: "Interval between packets in seconds", descriptionJa: "パケット間隔（秒）" },
      { flag: "-t <ttl>", descriptionEn: "Set Time To Live", descriptionJa: "TTLを設定" },
    ],
  },
  {
    command: "netstat / ss",
    nameEn: "Network statistics",
    nameJa: "ネットワーク統計",
    category: "networking",
    descriptionEn: "Print network connections, routing tables, interface statistics.",
    descriptionJa: "ネットワーク接続、ルーティングテーブル、インターフェース統計を表示します。",
    options: [
      { flag: "-t (ss -t)", descriptionEn: "Show TCP connections", descriptionJa: "TCP接続を表示" },
      { flag: "-u (ss -u)", descriptionEn: "Show UDP connections", descriptionJa: "UDP接続を表示" },
      { flag: "-l (ss -l)", descriptionEn: "Show listening sockets", descriptionJa: "リスニング中のソケットを表示" },
      { flag: "-p (ss -p)", descriptionEn: "Show process using the socket", descriptionJa: "ソケットを使用しているプロセスを表示" },
      { flag: "-n (ss -n)", descriptionEn: "Don't resolve service names", descriptionJa: "サービス名を解決しない" },
    ],
  },

  // 圧縮 (compression)
  {
    command: "tar",
    nameEn: "Archive files",
    nameJa: "アーカイブ操作",
    category: "compression",
    descriptionEn: "Store, list, or extract files in an archive.",
    descriptionJa: "アーカイブの作成、一覧表示、展開を行います。",
    options: [
      { flag: "-c", descriptionEn: "Create a new archive", descriptionJa: "新しいアーカイブを作成" },
      { flag: "-x", descriptionEn: "Extract files from archive", descriptionJa: "アーカイブからファイルを展開" },
      { flag: "-z", descriptionEn: "Compress with gzip", descriptionJa: "gzipで圧縮" },
      { flag: "-j", descriptionEn: "Compress with bzip2", descriptionJa: "bzip2で圧縮" },
      { flag: "-f <file>", descriptionEn: "Use archive file", descriptionJa: "アーカイブファイルを指定" },
      { flag: "-v", descriptionEn: "Verbose output", descriptionJa: "詳細出力" },
      { flag: "-t", descriptionEn: "List contents of archive", descriptionJa: "アーカイブの内容を一覧表示" },
      { flag: "-C <dir>", descriptionEn: "Change to directory before operation", descriptionJa: "操作前にディレクトリを変更" },
    ],
  },
  {
    command: "gzip / gunzip",
    nameEn: "Compress / decompress",
    nameJa: "gzip圧縮/解凍",
    category: "compression",
    descriptionEn: "Compress or expand files using gzip.",
    descriptionJa: "gzipを使用してファイルの圧縮・展開を行います。",
    options: [
      { flag: "-d", descriptionEn: "Decompress", descriptionJa: "解凍" },
      { flag: "-k, --keep", descriptionEn: "Keep original file", descriptionJa: "元ファイルを保持" },
      { flag: "-r, --recursive", descriptionEn: "Operate recursively", descriptionJa: "再帰的に操作" },
      { flag: "-9", descriptionEn: "Best compression", descriptionJa: "最高圧縮率" },
    ],
  },
  {
    command: "zip / unzip",
    nameEn: "ZIP compression",
    nameJa: "ZIP圧縮/解凍",
    category: "compression",
    descriptionEn: "Package and compress (archive) files.",
    descriptionJa: "ファイルのパッケージ化と圧縮（アーカイブ）を行います。",
    options: [
      { flag: "-r", descriptionEn: "Recurse into directories", descriptionJa: "ディレクトリを再帰的に含む" },
      { flag: "-d <dir>", descriptionEn: "Extract to directory (unzip)", descriptionJa: "指定ディレクトリに展開（unzip）" },
      { flag: "-l", descriptionEn: "List contents (unzip)", descriptionJa: "内容を一覧表示（unzip）" },
      { flag: "-e", descriptionEn: "Encrypt (zip)", descriptionJa: "暗号化（zip）" },
    ],
  },

  // システム情報 (system_info)
  {
    command: "df",
    nameEn: "Disk space usage",
    nameJa: "ディスク使用量",
    category: "system_info",
    descriptionEn: "Report file system disk space usage.",
    descriptionJa: "ファイルシステムのディスク使用量を表示します。",
    options: [
      { flag: "-h, --human-readable", descriptionEn: "Human-readable sizes", descriptionJa: "人が読みやすいサイズ表記" },
      { flag: "-T, --print-type", descriptionEn: "Print file system type", descriptionJa: "ファイルシステムタイプを表示" },
    ],
  },
  {
    command: "du",
    nameEn: "Directory size",
    nameJa: "ディレクトリサイズ",
    category: "system_info",
    descriptionEn: "Estimate file space usage.",
    descriptionJa: "ファイルのディスク使用量を推定します。",
    options: [
      { flag: "-h, --human-readable", descriptionEn: "Human-readable sizes", descriptionJa: "人が読みやすいサイズ表記" },
      { flag: "-s, --summarize", descriptionEn: "Display only a total", descriptionJa: "合計のみ表示" },
      { flag: "-d, --max-depth <n>", descriptionEn: "Print total for n levels", descriptionJa: "n階層まで合計を表示" },
      { flag: "--sort=size", descriptionEn: "Sort by size", descriptionJa: "サイズでソート" },
    ],
  },
  {
    command: "uname",
    nameEn: "System information",
    nameJa: "システム情報",
    category: "system_info",
    descriptionEn: "Print system information.",
    descriptionJa: "システム情報を表示します。",
    options: [
      { flag: "-a, --all", descriptionEn: "Print all information", descriptionJa: "すべての情報を表示" },
      { flag: "-r, --kernel-release", descriptionEn: "Print kernel release", descriptionJa: "カーネルリリースを表示" },
      { flag: "-m, --machine", descriptionEn: "Print machine hardware name", descriptionJa: "マシンのハードウェア名を表示" },
    ],
  },
  {
    command: "free",
    nameEn: "Memory usage",
    nameJa: "メモリ使用量",
    category: "system_info",
    descriptionEn: "Display amount of free and used memory.",
    descriptionJa: "空きメモリと使用メモリの量を表示します。",
    options: [
      { flag: "-h, --human", descriptionEn: "Human-readable output", descriptionJa: "人が読みやすい出力" },
      { flag: "-m", descriptionEn: "Display in megabytes", descriptionJa: "メガバイト単位で表示" },
      { flag: "-g", descriptionEn: "Display in gigabytes", descriptionJa: "ギガバイト単位で表示" },
    ],
  },
  {
    command: "env / printenv",
    nameEn: "Environment variables",
    nameJa: "環境変数",
    category: "system_info",
    descriptionEn: "Print or set environment variables.",
    descriptionJa: "環境変数の表示または設定を行います。",
    options: [],
  },

  // パイプ・リダイレクト (pipe_redirect)
  {
    command: "| (pipe)",
    nameEn: "Pipe output",
    nameJa: "パイプ",
    category: "pipe_redirect",
    descriptionEn: "Send the output of one command to another.",
    descriptionJa: "あるコマンドの出力を別のコマンドに渡します。",
    options: [
      { flag: "cmd1 | cmd2", descriptionEn: "Pipe stdout of cmd1 to stdin of cmd2", descriptionJa: "cmd1のstdoutをcmd2のstdinにパイプ" },
      { flag: "cmd1 |& cmd2", descriptionEn: "Pipe stdout and stderr", descriptionJa: "stdoutとstderrの両方をパイプ" },
    ],
  },
  {
    command: "> / >> (redirect)",
    nameEn: "Output redirect",
    nameJa: "出力リダイレクト",
    category: "pipe_redirect",
    descriptionEn: "Redirect output to a file.",
    descriptionJa: "出力をファイルにリダイレクトします。",
    options: [
      { flag: ">", descriptionEn: "Redirect stdout (overwrite)", descriptionJa: "stdoutをリダイレクト（上書き）" },
      { flag: ">>", descriptionEn: "Redirect stdout (append)", descriptionJa: "stdoutをリダイレクト（追記）" },
      { flag: "2>", descriptionEn: "Redirect stderr", descriptionJa: "stderrをリダイレクト" },
      { flag: "&>", descriptionEn: "Redirect stdout and stderr", descriptionJa: "stdoutとstderrをリダイレクト" },
      { flag: "/dev/null", descriptionEn: "Discard output", descriptionJa: "出力を破棄" },
    ],
  },
  {
    command: "< (input redirect)",
    nameEn: "Input redirect",
    nameJa: "入力リダイレクト",
    category: "pipe_redirect",
    descriptionEn: "Redirect input from a file.",
    descriptionJa: "ファイルからの入力をリダイレクトします。",
    options: [
      { flag: "<", descriptionEn: "Redirect stdin from file", descriptionJa: "ファイルからstdinをリダイレクト" },
      { flag: "<< EOF", descriptionEn: "Here document", descriptionJa: "ヒアドキュメント" },
      { flag: "<<< 'string'", descriptionEn: "Here string", descriptionJa: "ヒアストリング" },
    ],
  },
  {
    command: "xargs",
    nameEn: "Build command lines",
    nameJa: "コマンドライン構築",
    category: "pipe_redirect",
    descriptionEn: "Build and execute command lines from standard input.",
    descriptionJa: "標準入力からコマンドラインを構築して実行します。",
    options: [
      { flag: "-I {}", descriptionEn: "Replace string for each input", descriptionJa: "各入力に対して文字列を置換" },
      { flag: "-n <num>", descriptionEn: "Use at most num arguments per command", descriptionJa: "コマンドあたり最大num個の引数を使用" },
      { flag: "-P <num>", descriptionEn: "Run up to num processes at a time", descriptionJa: "最大num個のプロセスを同時実行" },
      { flag: "-0", descriptionEn: "Use NUL as delimiter", descriptionJa: "NULを区切り文字として使用" },
    ],
  },
  {
    command: "tee",
    nameEn: "Duplicate output",
    nameJa: "出力を複製",
    category: "pipe_redirect",
    descriptionEn: "Read from standard input and write to standard output and files.",
    descriptionJa: "標準入力を読み、標準出力とファイルの両方に書き込みます。",
    options: [
      { flag: "-a, --append", descriptionEn: "Append to files instead of overwriting", descriptionJa: "上書きではなく追記" },
    ],
  },
];

// カテゴリごとにグループ化
export function getShellCommandsByCategory(): Map<ShellCommandCategory, ShellCommand[]> {
  return groupByCategory(SHELL_COMMANDS, SHELL_CATEGORY_ORDER);
}
