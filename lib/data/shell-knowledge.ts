import type { KnowledgeItem } from "@/lib/types/knowledge";

// Shell/CLIノウハウデータ
export const SHELL_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: "text-search-replace",
    situationEn: "Searching and replacing text in files",
    situationJa: "テキストの検索・置換がしたい",
    explanationEn:
      "grep searches file contents for patterns, sed does in-place replacements, and awk processes structured text. Use grep -r for recursive search and sed -i for in-place editing.",
    explanationJa:
      "grep はファイル内容からパターンを検索、sed は置換、awk は構造化テキストの処理に使います。grep -r で再帰検索、sed -i でファイルを直接編集できます。",
    snippets: [
      {
        labelEn: "Recursive search with grep",
        labelJa: "grep で再帰検索",
        code: "grep -rn 'pattern' /path/to/dir",
        noteEn: "-r recursive, -n show line numbers",
        noteJa: "-r 再帰、-n 行番号表示",
      },
      {
        labelEn: "In-place replace with sed",
        labelJa: "sed でファイルを直接置換",
        code: "sed -i 's/old/new/g' file.txt",
        noteEn: "On macOS use: sed -i '' 's/old/new/g' file.txt",
        noteJa: "macOSでは: sed -i '' 's/old/new/g' file.txt",
      },
      {
        labelEn: "Extract specific column with awk",
        labelJa: "awk で特定カラムを抽出",
        code: "awk '{print $2}' file.txt",
        noteEn: "$2 means the second column (space-delimited)",
        noteJa: "$2 は2列目を意味する（スペース区切り）",
      },
      {
        labelEn: "grep with regex",
        labelJa: "grep で正規表現検索",
        code: "grep -E '[0-9]{3}-[0-9]{4}' file.txt",
        noteEn: "-E enables extended regular expressions",
        noteJa: "-E で拡張正規表現を有効化",
      },
    ],
    tags: ["grep", "sed", "awk"],
  },
  {
    id: "process-management",
    situationEn: "Managing processes",
    situationJa: "プロセスの確認・停止をしたい",
    explanationEn:
      "Use ps to list processes, kill to terminate them, and jobs/bg/fg to manage background tasks. kill -9 (SIGKILL) is a last resort; try kill (SIGTERM) first to allow graceful shutdown.",
    explanationJa:
      "ps でプロセス一覧、kill で終了、jobs/bg/fg でバックグラウンドタスクを管理します。kill -9（SIGKILL）は最後の手段で、まず kill（SIGTERM）でグレースフルシャットダウンを試みてください。",
    snippets: [
      {
        labelEn: "List all processes",
        labelJa: "全プロセスを表示",
        code: "ps aux",
      },
      {
        labelEn: "Find process by name",
        labelJa: "プロセス名で検索",
        code: "ps aux | grep <process-name>",
      },
      {
        labelEn: "Kill a process gracefully",
        labelJa: "プロセスをグレースフルに終了",
        code: "kill <PID>",
        noteEn: "Sends SIGTERM (allows cleanup). Use kill -9 only as last resort",
        noteJa: "SIGTERM送信（クリーンアップ可能）。kill -9 は最後の手段",
      },
      {
        labelEn: "Kill process by port number",
        labelJa: "ポート番号でプロセスを終了",
        code: "lsof -ti :<port> | xargs kill",
        noteEn: "Useful when a dev server is stuck on a port",
        noteJa: "開発サーバーがポートを占有している時に便利",
      },
      {
        labelEn: "Background / Foreground jobs",
        labelJa: "バックグラウンド / フォアグラウンド",
        code: "Ctrl+Z  # 停止\nbg      # バックグラウンドで再開\nfg      # フォアグラウンドに戻す\njobs    # ジョブ一覧",
      },
    ],
    tags: ["ps", "kill", "jobs", "bg", "fg"],
  },
  {
    id: "find-xargs",
    situationEn: "Finding files and batch processing them",
    situationJa: "ファイルを検索して一括処理したい",
    explanationEn:
      "find searches for files by name, type, size, or modification time. Combine with -exec or xargs for batch processing. xargs is generally faster than -exec for large file sets.",
    explanationJa:
      "find はファイル名・種類・サイズ・更新日時で検索します。-exec や xargs と組み合わせて一括処理できます。大量ファイルの場合、xargs は -exec より一般的に高速です。",
    snippets: [
      {
        labelEn: "Find files by name pattern",
        labelJa: "名前パターンでファイル検索",
        code: "find . -name '*.log' -type f",
      },
      {
        labelEn: "Find and delete",
        labelJa: "検索して削除",
        code: "find . -name '*.tmp' -type f -delete",
        noteEn: "Be careful: -delete is permanent. Test with -print first",
        noteJa: "注意: -delete は元に戻せない。先に -print で確認",
      },
      {
        labelEn: "Find and process with xargs",
        labelJa: "xargs で一括処理",
        code: "find . -name '*.js' | xargs grep 'TODO'",
        noteEn: "Use -print0 / xargs -0 for filenames with spaces",
        noteJa: "スペース含むファイル名は -print0 / xargs -0 を使用",
      },
      {
        labelEn: "Find recently modified files",
        labelJa: "最近更新されたファイルを検索",
        code: "find . -mtime -1 -type f",
        noteEn: "-mtime -1 means modified within the last 24 hours",
        noteJa: "-mtime -1 は直近24時間以内に更新されたファイル",
      },
    ],
    tags: ["find", "xargs", "exec"],
  },
  {
    id: "pipe-redirect",
    situationEn: "Mastering pipes and redirections",
    situationJa: "パイプとリダイレクトを使いこなしたい",
    explanationEn:
      "Pipe (|) sends output of one command to another. > redirects stdout to a file (overwrites), >> appends. 2> redirects stderr. tee writes to both file and stdout simultaneously.",
    explanationJa:
      "パイプ（|）はコマンドの出力を別コマンドに渡します。> は stdout をファイルに出力（上書き）、>> は追記。2> は stderr をリダイレクト。tee はファイルと stdout に同時出力します。",
    snippets: [
      {
        labelEn: "Pipe output to another command",
        labelJa: "パイプで別コマンドに渡す",
        code: "cat access.log | grep 'ERROR' | sort | uniq -c | sort -rn",
      },
      {
        labelEn: "Redirect stdout and stderr",
        labelJa: "stdout と stderr をリダイレクト",
        code: "command > output.log 2>&1",
        noteEn: "2>&1 redirects stderr to the same place as stdout",
        noteJa: "2>&1 で stderr を stdout と同じ場所にリダイレクト",
      },
      {
        labelEn: "Write to file and display with tee",
        labelJa: "tee でファイルと画面に同時出力",
        code: "command | tee output.log",
        noteEn: "Use tee -a to append instead of overwrite",
        noteJa: "tee -a で上書きではなく追記",
      },
      {
        labelEn: "Discard output (send to /dev/null)",
        labelJa: "出力を破棄（/dev/null へ）",
        code: "command > /dev/null 2>&1",
      },
    ],
    tags: ["pipe", "redirect", "tee", "stderr"],
  },
  {
    id: "shell-variables",
    situationEn: "Understanding shell and environment variables",
    situationJa: "シェル変数と環境変数の違いと使い方",
    explanationEn:
      "Shell variables are local to the current shell session. Environment variables (created with export) are inherited by child processes. Use $VAR or ${VAR} to reference them.",
    explanationJa:
      "シェル変数は現在のシェルセッションにローカルです。環境変数（export で作成）は子プロセスに継承されます。$VAR または ${VAR} で参照します。",
    snippets: [
      {
        labelEn: "Set and export a variable",
        labelJa: "変数の設定とエクスポート",
        code: "MY_VAR=\"hello\"\nexport MY_VAR",
      },
      {
        labelEn: "View all environment variables",
        labelJa: "全環境変数を表示",
        code: "env",
      },
      {
        labelEn: "Use variable with default value",
        labelJa: "デフォルト値付きの変数参照",
        code: "echo ${MY_VAR:-default_value}",
        noteEn: "Returns 'default_value' if MY_VAR is unset or empty",
        noteJa: "MY_VAR が未設定または空の場合に 'default_value' を返す",
      },
      {
        labelEn: "Set variable for single command only",
        labelJa: "1コマンドだけに変数を設定",
        code: "NODE_ENV=production node app.js",
        noteEn: "Variable is only set for this specific command execution",
        noteJa: "この特定のコマンド実行時のみ変数が設定される",
      },
    ],
    tags: ["export", "env", "variable"],
  },
  {
    id: "ssh-tunnel",
    situationEn: "Setting up SSH connections and tunnels",
    situationJa: "SSH接続とトンネルを設定したい",
    explanationEn:
      "SSH tunnels forward traffic through an encrypted connection. Local forwarding (-L) accesses remote services through your local port. Remote forwarding (-R) exposes your local service to the remote server.",
    explanationJa:
      "SSHトンネルは暗号化された接続を通じてトラフィックを転送します。ローカルフォワーディング（-L）はリモートサービスにローカルポート経由でアクセスします。リモートフォワーディング（-R）はローカルサービスをリモートサーバーに公開します。",
    snippets: [
      {
        labelEn: "Basic SSH connection",
        labelJa: "基本的なSSH接続",
        code: "ssh <user>@<host>",
      },
      {
        labelEn: "SSH with key file",
        labelJa: "鍵ファイル指定でSSH接続",
        code: "ssh -i ~/.ssh/<key-file> <user>@<host>",
      },
      {
        labelEn: "Local port forwarding",
        labelJa: "ローカルポートフォワーディング",
        code: "ssh -L <local-port>:localhost:<remote-port> <user>@<host>",
        noteEn: "Access remote service at localhost:<local-port>",
        noteJa: "localhost:<local-port> でリモートサービスにアクセス",
      },
      {
        labelEn: "SSH config for shortcuts",
        labelJa: "SSH config でショートカット設定",
        code: "# ~/.ssh/config\nHost myserver\n  HostName 192.168.1.100\n  User deploy\n  IdentityFile ~/.ssh/id_rsa",
        noteEn: "Then connect with just: ssh myserver",
        noteJa: "以降は ssh myserver だけで接続可能",
      },
    ],
    tags: ["ssh", "tunnel", "port-forward"],
  },
  {
    id: "cron-scheduling",
    situationEn: "Scheduling tasks with cron",
    situationJa: "cronでタスクをスケジューリングしたい",
    explanationEn:
      "Cron schedules recurring tasks using a five-field format: minute, hour, day-of-month, month, day-of-week. Use crontab -e to edit. Always redirect output to avoid mail flooding.",
    explanationJa:
      "cron は5つのフィールド（分、時、日、月、曜日）で定期タスクをスケジューリングします。crontab -e で編集します。出力は必ずリダイレクトして、メール通知の洪水を防いでください。",
    snippets: [
      {
        labelEn: "Edit crontab",
        labelJa: "crontab を編集",
        code: "crontab -e",
      },
      {
        labelEn: "List current crontab entries",
        labelJa: "現在のcrontabを表示",
        code: "crontab -l",
      },
      {
        labelEn: "Run daily at 3:00 AM",
        labelJa: "毎日午前3時に実行",
        code: "0 3 * * * /path/to/script.sh >> /var/log/myjob.log 2>&1",
        noteEn: "Format: minute hour day month weekday command",
        noteJa: "形式: 分 時 日 月 曜日 コマンド",
      },
      {
        labelEn: "Run every 5 minutes",
        labelJa: "5分ごとに実行",
        code: "*/5 * * * * /path/to/check.sh",
      },
    ],
    tags: ["cron", "crontab", "schedule"],
  },
];
