// Dockerコマンドのカテゴリ
export type DockerCommandCategory =
  | "container"
  | "image"
  | "network"
  | "volume"
  | "compose"
  | "system"
  | "registry";

// Dockerコマンドオプションの型
export interface DockerCommandOption {
  flag: string;
  descriptionEn: string;
  descriptionJa: string;
}

// Dockerコマンドの型
export interface DockerCommand {
  command: string;
  nameEn: string;
  nameJa: string;
  category: DockerCommandCategory;
  descriptionEn: string;
  descriptionJa: string;
  options: DockerCommandOption[];
}

// カテゴリの表示順
export const DOCKER_CATEGORY_ORDER: DockerCommandCategory[] = [
  "container",
  "image",
  "network",
  "volume",
  "compose",
  "system",
  "registry",
];

// Dockerコマンド一覧
export const DOCKER_COMMANDS: DockerCommand[] = [
  // コンテナ (container)
  {
    command: "docker run",
    nameEn: "Run a container",
    nameJa: "コンテナを実行",
    category: "container",
    descriptionEn: "Create and start a new container from an image.",
    descriptionJa: "イメージから新しいコンテナを作成して起動します。",
    options: [
      { flag: "-d, --detach", descriptionEn: "Run container in background", descriptionJa: "バックグラウンドで実行" },
      { flag: "-it", descriptionEn: "Interactive mode with TTY", descriptionJa: "対話モード（TTY付き）" },
      { flag: "--name <name>", descriptionEn: "Assign a name to the container", descriptionJa: "コンテナに名前を付ける" },
      { flag: "-p, --publish <host:container>", descriptionEn: "Publish a container's port to the host", descriptionJa: "コンテナのポートをホストに公開" },
      { flag: "-v, --volume <host:container>", descriptionEn: "Bind mount a volume", descriptionJa: "ボリュームをバインドマウント" },
      { flag: "-e, --env <KEY=VALUE>", descriptionEn: "Set environment variables", descriptionJa: "環境変数を設定" },
      { flag: "--rm", descriptionEn: "Remove container when it stops", descriptionJa: "停止時にコンテナを自動削除" },
      { flag: "--network <name>", descriptionEn: "Connect to a network", descriptionJa: "ネットワークに接続" },
      { flag: "--restart <policy>", descriptionEn: "Restart policy (no/always/on-failure/unless-stopped)", descriptionJa: "再起動ポリシー（no/always/on-failure/unless-stopped）" },
      { flag: "-w, --workdir <dir>", descriptionEn: "Set working directory inside the container", descriptionJa: "コンテナ内の作業ディレクトリを設定" },
    ],
  },
  {
    command: "docker ps",
    nameEn: "List containers",
    nameJa: "コンテナ一覧",
    category: "container",
    descriptionEn: "List running containers.",
    descriptionJa: "実行中のコンテナを一覧表示します。",
    options: [
      { flag: "-a, --all", descriptionEn: "Show all containers (including stopped)", descriptionJa: "すべてのコンテナを表示（停止中を含む）" },
      { flag: "-q, --quiet", descriptionEn: "Only display container IDs", descriptionJa: "コンテナIDのみ表示" },
      { flag: "--format <template>", descriptionEn: "Format output using Go template", descriptionJa: "Goテンプレートで出力をフォーマット" },
      { flag: "-f, --filter <key=value>", descriptionEn: "Filter output based on conditions", descriptionJa: "条件に基づいて出力をフィルタ" },
    ],
  },
  {
    command: "docker stop",
    nameEn: "Stop container",
    nameJa: "コンテナを停止",
    category: "container",
    descriptionEn: "Stop one or more running containers.",
    descriptionJa: "1つ以上の実行中のコンテナを停止します。",
    options: [
      { flag: "-t, --time <seconds>", descriptionEn: "Seconds to wait before killing", descriptionJa: "強制停止までの待機秒数" },
    ],
  },
  {
    command: "docker start",
    nameEn: "Start container",
    nameJa: "コンテナを起動",
    category: "container",
    descriptionEn: "Start one or more stopped containers.",
    descriptionJa: "1つ以上の停止中のコンテナを起動します。",
    options: [
      { flag: "-a, --attach", descriptionEn: "Attach to container's STDOUT/STDERR", descriptionJa: "コンテナのSTDOUT/STDERRにアタッチ" },
      { flag: "-i, --interactive", descriptionEn: "Attach to container's STDIN", descriptionJa: "コンテナのSTDINにアタッチ" },
    ],
  },
  {
    command: "docker exec",
    nameEn: "Execute in container",
    nameJa: "コンテナ内でコマンド実行",
    category: "container",
    descriptionEn: "Execute a command in a running container.",
    descriptionJa: "実行中のコンテナでコマンドを実行します。",
    options: [
      { flag: "-it", descriptionEn: "Interactive mode with TTY", descriptionJa: "対話モード（TTY付き）" },
      { flag: "-d, --detach", descriptionEn: "Run command in background", descriptionJa: "バックグラウンドでコマンドを実行" },
      { flag: "-e, --env <KEY=VALUE>", descriptionEn: "Set environment variables", descriptionJa: "環境変数を設定" },
      { flag: "-w, --workdir <dir>", descriptionEn: "Working directory inside the container", descriptionJa: "コンテナ内の作業ディレクトリ" },
      { flag: "-u, --user <user>", descriptionEn: "Username or UID", descriptionJa: "ユーザー名またはUID" },
    ],
  },
  {
    command: "docker rm",
    nameEn: "Remove container",
    nameJa: "コンテナを削除",
    category: "container",
    descriptionEn: "Remove one or more containers.",
    descriptionJa: "1つ以上のコンテナを削除します。",
    options: [
      { flag: "-f, --force", descriptionEn: "Force remove running container", descriptionJa: "実行中のコンテナを強制削除" },
      { flag: "-v, --volumes", descriptionEn: "Remove associated anonymous volumes", descriptionJa: "関連する匿名ボリュームも削除" },
    ],
  },
  {
    command: "docker logs",
    nameEn: "View container logs",
    nameJa: "コンテナのログを表示",
    category: "container",
    descriptionEn: "Fetch the logs of a container.",
    descriptionJa: "コンテナのログを取得します。",
    options: [
      { flag: "-f, --follow", descriptionEn: "Follow log output", descriptionJa: "ログ出力をフォロー" },
      { flag: "--tail <n>", descriptionEn: "Show last n lines", descriptionJa: "末尾n行を表示" },
      { flag: "--since <time>", descriptionEn: "Show logs since timestamp", descriptionJa: "指定タイムスタンプ以降のログを表示" },
      { flag: "-t, --timestamps", descriptionEn: "Show timestamps", descriptionJa: "タイムスタンプを表示" },
    ],
  },
  {
    command: "docker inspect",
    nameEn: "Inspect object",
    nameJa: "オブジェクトを検査",
    category: "container",
    descriptionEn: "Return low-level information on Docker objects.",
    descriptionJa: "Dockerオブジェクトの詳細情報を返します。",
    options: [
      { flag: "-f, --format <template>", descriptionEn: "Format output using Go template", descriptionJa: "Goテンプレートで出力をフォーマット" },
    ],
  },
  {
    command: "docker cp",
    nameEn: "Copy files",
    nameJa: "ファイルをコピー",
    category: "container",
    descriptionEn: "Copy files/folders between a container and the local filesystem.",
    descriptionJa: "コンテナとローカルファイルシステム間でファイル/フォルダをコピーします。",
    options: [
      { flag: "-a, --archive", descriptionEn: "Archive mode (copy UID/GID)", descriptionJa: "アーカイブモード（UID/GIDをコピー）" },
    ],
  },

  // イメージ (image)
  {
    command: "docker build",
    nameEn: "Build image",
    nameJa: "イメージをビルド",
    category: "image",
    descriptionEn: "Build an image from a Dockerfile.",
    descriptionJa: "Dockerfileからイメージをビルドします。",
    options: [
      { flag: "-t, --tag <name:tag>", descriptionEn: "Name and optionally tag the image", descriptionJa: "イメージに名前とタグを付ける" },
      { flag: "-f, --file <path>", descriptionEn: "Path to Dockerfile", descriptionJa: "Dockerfileのパス" },
      { flag: "--no-cache", descriptionEn: "Do not use cache when building", descriptionJa: "ビルド時にキャッシュを使用しない" },
      { flag: "--build-arg <key=value>", descriptionEn: "Set build-time variables", descriptionJa: "ビルド時の変数を設定" },
      { flag: "--target <stage>", descriptionEn: "Set the target build stage", descriptionJa: "ターゲットのビルドステージを設定" },
      { flag: "--platform <os/arch>", descriptionEn: "Set target platform", descriptionJa: "ターゲットプラットフォームを設定" },
    ],
  },
  {
    command: "docker images",
    nameEn: "List images",
    nameJa: "イメージ一覧",
    category: "image",
    descriptionEn: "List images on the local system.",
    descriptionJa: "ローカルシステム上のイメージを一覧表示します。",
    options: [
      { flag: "-a, --all", descriptionEn: "Show all images (including intermediate)", descriptionJa: "すべてのイメージを表示（中間イメージ含む）" },
      { flag: "-q, --quiet", descriptionEn: "Only display image IDs", descriptionJa: "イメージIDのみ表示" },
      { flag: "--filter <key=value>", descriptionEn: "Filter output based on conditions", descriptionJa: "条件に基づいて出力をフィルタ" },
    ],
  },
  {
    command: "docker rmi",
    nameEn: "Remove image",
    nameJa: "イメージを削除",
    category: "image",
    descriptionEn: "Remove one or more images.",
    descriptionJa: "1つ以上のイメージを削除します。",
    options: [
      { flag: "-f, --force", descriptionEn: "Force removal of the image", descriptionJa: "イメージを強制削除" },
    ],
  },
  {
    command: "docker tag",
    nameEn: "Tag an image",
    nameJa: "イメージにタグ付け",
    category: "image",
    descriptionEn: "Create a tag TARGET_IMAGE that refers to SOURCE_IMAGE.",
    descriptionJa: "SOURCE_IMAGEを参照するタグTARGET_IMAGEを作成します。",
    options: [],
  },
  {
    command: "docker history",
    nameEn: "Image history",
    nameJa: "イメージの履歴",
    category: "image",
    descriptionEn: "Show the history of an image.",
    descriptionJa: "イメージの履歴を表示します。",
    options: [
      { flag: "--no-trunc", descriptionEn: "Don't truncate output", descriptionJa: "出力を省略しない" },
      { flag: "-q, --quiet", descriptionEn: "Only show image IDs", descriptionJa: "イメージIDのみ表示" },
    ],
  },

  // ネットワーク (network)
  {
    command: "docker network create",
    nameEn: "Create network",
    nameJa: "ネットワークを作成",
    category: "network",
    descriptionEn: "Create a network.",
    descriptionJa: "ネットワークを作成します。",
    options: [
      { flag: "-d, --driver <driver>", descriptionEn: "Driver to manage the network (bridge/overlay/host)", descriptionJa: "ネットワークドライバ（bridge/overlay/host）" },
      { flag: "--subnet <CIDR>", descriptionEn: "Subnet in CIDR format", descriptionJa: "CIDR形式のサブネット" },
      { flag: "--gateway <IP>", descriptionEn: "IPv4 or IPv6 Gateway", descriptionJa: "IPv4またはIPv6ゲートウェイ" },
    ],
  },
  {
    command: "docker network ls",
    nameEn: "List networks",
    nameJa: "ネットワーク一覧",
    category: "network",
    descriptionEn: "List networks.",
    descriptionJa: "ネットワークを一覧表示します。",
    options: [
      { flag: "-f, --filter <key=value>", descriptionEn: "Filter output", descriptionJa: "出力をフィルタ" },
      { flag: "-q, --quiet", descriptionEn: "Only display network IDs", descriptionJa: "ネットワークIDのみ表示" },
    ],
  },
  {
    command: "docker network connect",
    nameEn: "Connect to network",
    nameJa: "ネットワークに接続",
    category: "network",
    descriptionEn: "Connect a container to a network.",
    descriptionJa: "コンテナをネットワークに接続します。",
    options: [
      { flag: "--alias <name>", descriptionEn: "Add network-scoped alias", descriptionJa: "ネットワークスコープのエイリアスを追加" },
      { flag: "--ip <address>", descriptionEn: "IPv4 address", descriptionJa: "IPv4アドレス" },
    ],
  },
  {
    command: "docker network rm",
    nameEn: "Remove network",
    nameJa: "ネットワークを削除",
    category: "network",
    descriptionEn: "Remove one or more networks.",
    descriptionJa: "1つ以上のネットワークを削除します。",
    options: [],
  },

  // ボリューム (volume)
  {
    command: "docker volume create",
    nameEn: "Create volume",
    nameJa: "ボリュームを作成",
    category: "volume",
    descriptionEn: "Create a volume.",
    descriptionJa: "ボリュームを作成します。",
    options: [
      { flag: "--name <name>", descriptionEn: "Specify volume name", descriptionJa: "ボリューム名を指定" },
      { flag: "-d, --driver <driver>", descriptionEn: "Specify volume driver", descriptionJa: "ボリュームドライバを指定" },
    ],
  },
  {
    command: "docker volume ls",
    nameEn: "List volumes",
    nameJa: "ボリューム一覧",
    category: "volume",
    descriptionEn: "List volumes.",
    descriptionJa: "ボリュームを一覧表示します。",
    options: [
      { flag: "-f, --filter <key=value>", descriptionEn: "Filter output", descriptionJa: "出力をフィルタ" },
      { flag: "-q, --quiet", descriptionEn: "Only display volume names", descriptionJa: "ボリューム名のみ表示" },
    ],
  },
  {
    command: "docker volume rm",
    nameEn: "Remove volume",
    nameJa: "ボリュームを削除",
    category: "volume",
    descriptionEn: "Remove one or more volumes.",
    descriptionJa: "1つ以上のボリュームを削除します。",
    options: [
      { flag: "-f, --force", descriptionEn: "Force removal", descriptionJa: "強制削除" },
    ],
  },
  {
    command: "docker volume prune",
    nameEn: "Remove unused volumes",
    nameJa: "未使用ボリュームを削除",
    category: "volume",
    descriptionEn: "Remove unused local volumes.",
    descriptionJa: "未使用のローカルボリュームを削除します。",
    options: [
      { flag: "-f, --force", descriptionEn: "Do not prompt for confirmation", descriptionJa: "確認プロンプトなしで実行" },
    ],
  },

  // Docker Compose (compose)
  {
    command: "docker compose up",
    nameEn: "Start services",
    nameJa: "サービスを起動",
    category: "compose",
    descriptionEn: "Create and start containers defined in compose file.",
    descriptionJa: "composeファイルで定義されたコンテナを作成して起動します。",
    options: [
      { flag: "-d, --detach", descriptionEn: "Run in background", descriptionJa: "バックグラウンドで実行" },
      { flag: "--build", descriptionEn: "Build images before starting", descriptionJa: "起動前にイメージをビルド" },
      { flag: "--force-recreate", descriptionEn: "Recreate containers even if unchanged", descriptionJa: "変更がなくてもコンテナを再作成" },
      { flag: "--scale <service=num>", descriptionEn: "Scale a service to num instances", descriptionJa: "サービスを指定数にスケール" },
    ],
  },
  {
    command: "docker compose down",
    nameEn: "Stop services",
    nameJa: "サービスを停止",
    category: "compose",
    descriptionEn: "Stop and remove containers, networks created by up.",
    descriptionJa: "upで作成されたコンテナとネットワークを停止・削除します。",
    options: [
      { flag: "-v, --volumes", descriptionEn: "Remove named volumes", descriptionJa: "名前付きボリュームも削除" },
      { flag: "--rmi <all|local>", descriptionEn: "Remove images", descriptionJa: "イメージを削除" },
      { flag: "--remove-orphans", descriptionEn: "Remove containers not defined in compose file", descriptionJa: "composeファイルに定義されていないコンテナを削除" },
    ],
  },
  {
    command: "docker compose logs",
    nameEn: "View service logs",
    nameJa: "サービスのログを表示",
    category: "compose",
    descriptionEn: "View output from containers.",
    descriptionJa: "コンテナからの出力を表示します。",
    options: [
      { flag: "-f, --follow", descriptionEn: "Follow log output", descriptionJa: "ログ出力をフォロー" },
      { flag: "--tail <n>", descriptionEn: "Number of lines to show", descriptionJa: "表示する行数" },
    ],
  },
  {
    command: "docker compose ps",
    nameEn: "List compose containers",
    nameJa: "Composeコンテナ一覧",
    category: "compose",
    descriptionEn: "List containers in the compose project.",
    descriptionJa: "Composeプロジェクトのコンテナを一覧表示します。",
    options: [
      { flag: "-a, --all", descriptionEn: "Show all containers", descriptionJa: "すべてのコンテナを表示" },
      { flag: "-q, --quiet", descriptionEn: "Only display container IDs", descriptionJa: "コンテナIDのみ表示" },
    ],
  },
  {
    command: "docker compose build",
    nameEn: "Build services",
    nameJa: "サービスをビルド",
    category: "compose",
    descriptionEn: "Build or rebuild services.",
    descriptionJa: "サービスをビルドまたは再ビルドします。",
    options: [
      { flag: "--no-cache", descriptionEn: "Do not use cache", descriptionJa: "キャッシュを使用しない" },
      { flag: "--pull", descriptionEn: "Always pull newer version of the image", descriptionJa: "常に新しいバージョンのイメージをプル" },
    ],
  },

  // システム (system)
  {
    command: "docker system prune",
    nameEn: "Clean up system",
    nameJa: "システムをクリーンアップ",
    category: "system",
    descriptionEn: "Remove unused data (containers, networks, images, build cache).",
    descriptionJa: "未使用データ（コンテナ、ネットワーク、イメージ、ビルドキャッシュ）を削除します。",
    options: [
      { flag: "-a, --all", descriptionEn: "Remove all unused images, not just dangling ones", descriptionJa: "ダングリングだけでなく未使用の全イメージを削除" },
      { flag: "--volumes", descriptionEn: "Prune anonymous volumes", descriptionJa: "匿名ボリュームも削除" },
      { flag: "-f, --force", descriptionEn: "Do not prompt for confirmation", descriptionJa: "確認プロンプトなしで実行" },
    ],
  },
  {
    command: "docker system df",
    nameEn: "Disk usage",
    nameJa: "ディスク使用量",
    category: "system",
    descriptionEn: "Show Docker disk usage.",
    descriptionJa: "Dockerのディスク使用量を表示します。",
    options: [
      { flag: "-v, --verbose", descriptionEn: "Show detailed information", descriptionJa: "詳細情報を表示" },
    ],
  },
  {
    command: "docker stats",
    nameEn: "Resource usage",
    nameJa: "リソース使用状況",
    category: "system",
    descriptionEn: "Display a live stream of container resource usage statistics.",
    descriptionJa: "コンテナのリソース使用統計をリアルタイム表示します。",
    options: [
      { flag: "--no-stream", descriptionEn: "Disable streaming stats", descriptionJa: "ストリーミングを無効化（1回のみ表示）" },
      { flag: "--format <template>", descriptionEn: "Format output using Go template", descriptionJa: "Goテンプレートで出力をフォーマット" },
    ],
  },

  // レジストリ (registry)
  {
    command: "docker pull",
    nameEn: "Pull image",
    nameJa: "イメージをプル",
    category: "registry",
    descriptionEn: "Download an image from a registry.",
    descriptionJa: "レジストリからイメージをダウンロードします。",
    options: [
      { flag: "--platform <os/arch>", descriptionEn: "Set target platform", descriptionJa: "ターゲットプラットフォームを設定" },
      { flag: "-a, --all-tags", descriptionEn: "Download all tagged images", descriptionJa: "すべてのタグ付きイメージをダウンロード" },
    ],
  },
  {
    command: "docker push",
    nameEn: "Push image",
    nameJa: "イメージをプッシュ",
    category: "registry",
    descriptionEn: "Upload an image to a registry.",
    descriptionJa: "レジストリにイメージをアップロードします。",
    options: [
      { flag: "-a, --all-tags", descriptionEn: "Push all tagged images", descriptionJa: "すべてのタグ付きイメージをプッシュ" },
    ],
  },
  {
    command: "docker login",
    nameEn: "Log in to registry",
    nameJa: "レジストリにログイン",
    category: "registry",
    descriptionEn: "Log in to a container registry.",
    descriptionJa: "コンテナレジストリにログインします。",
    options: [
      { flag: "-u, --username <user>", descriptionEn: "Username", descriptionJa: "ユーザー名" },
      { flag: "-p, --password <pass>", descriptionEn: "Password", descriptionJa: "パスワード" },
      { flag: "--password-stdin", descriptionEn: "Take password from stdin", descriptionJa: "標準入力からパスワードを取得" },
    ],
  },
];

// カテゴリごとにグループ化
export function getDockerCommandsByCategory(): Map<DockerCommandCategory, DockerCommand[]> {
  const grouped = new Map<DockerCommandCategory, DockerCommand[]>();

  for (const category of DOCKER_CATEGORY_ORDER) {
    grouped.set(category, []);
  }

  for (const cmd of DOCKER_COMMANDS) {
    const list = grouped.get(cmd.category);
    if (list) {
      list.push(cmd);
    }
  }

  return grouped;
}
