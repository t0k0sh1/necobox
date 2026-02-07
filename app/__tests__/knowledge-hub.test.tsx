import { act, fireEvent, render, screen } from "@testing-library/react";
import { GitKnowledge } from "../components/GitKnowledge";
import KnowledgeHubPage from "../[locale]/knowledge-hub/page";

describe("Knowledge Hub Page", () => {
  beforeEach(() => {
    (navigator.clipboard.writeText as jest.Mock).mockClear();
  });

  it("renders page title", () => {
    render(<KnowledgeHubPage />);
    expect(
      screen.getByRole("heading", { name: "Knowledge Hub" })
    ).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<KnowledgeHubPage />);
    expect(
      screen.getByText("Practical Git guides organized by situation")
    ).toBeInTheDocument();
  });

  it("renders Git tab", () => {
    render(<KnowledgeHubPage />);
    expect(screen.getByRole("tab", { name: "Git" })).toBeInTheDocument();
  });

  it("renders link to cheatsheets", () => {
    render(<KnowledgeHubPage />);
    expect(
      screen.getByText("View Cheatsheets →")
    ).toBeInTheDocument();
  });
});

describe("GitKnowledge Component", () => {
  beforeEach(() => {
    (navigator.clipboard.writeText as jest.Mock).mockClear();
  });

  it("renders knowledge items", () => {
    render(<GitKnowledge />);
    expect(
      screen.getByText("Creating a new branch and switching to it")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Undoing or reverting commits")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Comparing changes with git diff")
    ).toBeInTheDocument();
  });

  it("renders search bar", () => {
    render(<GitKnowledge />);
    expect(
      screen.getByPlaceholderText(
        "Search by situation, tag, or command..."
      )
    ).toBeInTheDocument();
  });

  it("renders tags on cards", () => {
    render(<GitKnowledge />);
    expect(screen.getByText("branch")).toBeInTheDocument();
    expect(screen.getByText("switch")).toBeInTheDocument();
    expect(screen.getByText("reset")).toBeInTheDocument();
    expect(screen.getByText("diff")).toBeInTheDocument();
  });

  it("expands and collapses cards", () => {
    render(<GitKnowledge />);

    // カードをクリックして展開
    const cardButton = screen
      .getByText("Creating a new branch and switching to it")
      .closest("button")!;
    fireEvent.click(cardButton);

    // 解説テキストとスニペットが表示される
    expect(
      screen.getByText(/git switch -c.*is the recommended way/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText("git switch -c <branch-name>")
    ).toBeInTheDocument();

    // もう一度クリックして折りたたみ
    fireEvent.click(cardButton);
    expect(
      screen.queryByText("git switch -c <branch-name>")
    ).not.toBeInTheDocument();
  });

  it("shows snippet labels when expanded", () => {
    render(<GitKnowledge />);

    const cardButton = screen
      .getByText("Creating a new branch and switching to it")
      .closest("button")!;
    fireEvent.click(cardButton);

    expect(
      screen.getByText("Create and switch (recommended)")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Create and switch (old way)")
    ).toBeInTheDocument();
  });

  it("shows cheatsheet link when expanded", () => {
    render(<GitKnowledge />);

    const cardButton = screen
      .getByText("Creating a new branch and switching to it")
      .closest("button")!;
    fireEvent.click(cardButton);

    expect(
      screen.getByText("View related commands in Cheatsheets →")
    ).toBeInTheDocument();
  });

  it("filters items by search query", () => {
    render(<GitKnowledge />);

    const searchInput = screen.getByPlaceholderText(
      "Search by situation, tag, or command..."
    );
    fireEvent.change(searchInput, { target: { value: "revert" } });

    expect(
      screen.getByText("Undoing or reverting commits")
    ).toBeInTheDocument();
    // ブランチ作成のカードは表示されないはず
    expect(
      screen.queryByText("Creating a new branch and switching to it")
    ).not.toBeInTheDocument();
  });

  it("filters items by tag", () => {
    render(<GitKnowledge />);

    const searchInput = screen.getByPlaceholderText(
      "Search by situation, tag, or command..."
    );
    fireEvent.change(searchInput, { target: { value: "undo" } });

    expect(
      screen.getByText("Undoing or reverting commits")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Creating a new branch and switching to it")
    ).not.toBeInTheDocument();
  });

  it("filters items by code snippet", () => {
    render(<GitKnowledge />);

    const searchInput = screen.getByPlaceholderText(
      "Search by situation, tag, or command..."
    );
    fireEvent.change(searchInput, { target: { value: "--staged" } });

    // git diff のカードが表示されるはず（--staged スニペットを含む）
    expect(
      screen.getByText("Comparing changes with git diff")
    ).toBeInTheDocument();
  });

  it("shows no results message when search has no matches", () => {
    render(<GitKnowledge />);

    const searchInput = screen.getByPlaceholderText(
      "Search by situation, tag, or command..."
    );
    fireEvent.change(searchInput, { target: { value: "zzzzzzz" } });

    expect(
      screen.getByText("No matching knowledge items found")
    ).toBeInTheDocument();
  });

  it("copies code snippet directly when no placeholders", async () => {
    render(<GitKnowledge />);

    // diff カードを展開（git diff はプレースホルダーなし）
    const cardButton = screen
      .getByText("Comparing changes with git diff")
      .closest("button")!;
    fireEvent.click(cardButton);

    // コピーボタンをクリック（プレースホルダーなし → 直接コピー）
    const copyButton = screen.getByLabelText("Copy git diff");
    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("git diff");
  });

  it("opens placeholder dialog when code has placeholders", () => {
    render(<GitKnowledge />);

    // undo-commits カードを展開（git revert <commit-hash> を含む）
    const cardButton = screen
      .getByText("Undoing or reverting commits")
      .closest("button")!;
    fireEvent.click(cardButton);

    // git revert <commit-hash> のコピーボタンをクリック
    const copyButton = screen.getByLabelText(
      "Copy git revert <commit-hash>"
    );
    fireEvent.click(copyButton);

    // モーダルが表示される
    expect(screen.getByText("Fill in placeholders")).toBeInTheDocument();
    expect(screen.getByText("commit-hash")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("<commit-hash>")).toBeInTheDocument();
  });

  it("fills placeholder and copies the built command", async () => {
    render(<GitKnowledge />);

    // カード展開
    const cardButton = screen
      .getByText("Undoing or reverting commits")
      .closest("button")!;
    fireEvent.click(cardButton);

    // モーダルを開く
    const copyButton = screen.getByLabelText(
      "Copy git revert <commit-hash>"
    );
    fireEvent.click(copyButton);

    // プレースホルダーに値を入力
    const input = screen.getByPlaceholderText("<commit-hash>");
    fireEvent.change(input, { target: { value: "abc1234" } });

    // プレビューが更新される
    expect(screen.getByText("git revert abc1234")).toBeInTheDocument();

    // コマンドをコピー
    const dialogCopyButton = screen.getByText("Copy command");
    await act(async () => {
      fireEvent.click(dialogCopyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "git revert abc1234"
    );
  });

  it("keeps placeholders in preview when input is empty", () => {
    render(<GitKnowledge />);

    // diff カード展開（git diff <commit1> <commit2> を含む）
    const cardButton = screen
      .getByText("Comparing changes with git diff")
      .closest("button")!;
    fireEvent.click(cardButton);

    // モーダルを開く
    const copyButton = screen.getByLabelText(
      "Copy git diff <commit1> <commit2>"
    );
    fireEvent.click(copyButton);

    // 複数プレースホルダーが表示される
    expect(screen.getByPlaceholderText("<commit1>")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("<commit2>")).toBeInTheDocument();

    // 片方だけ入力
    fireEvent.change(screen.getByPlaceholderText("<commit1>"), {
      target: { value: "HEAD~3" },
    });

    // 未入力のプレースホルダーはそのまま残る
    expect(
      screen.getByText("git diff HEAD~3 <commit2>")
    ).toBeInTheDocument();
  });

  it("closes placeholder dialog on cancel", () => {
    render(<GitKnowledge />);

    const cardButton = screen
      .getByText("Undoing or reverting commits")
      .closest("button")!;
    fireEvent.click(cardButton);

    const copyButton = screen.getByLabelText(
      "Copy git revert <commit-hash>"
    );
    fireEvent.click(copyButton);

    // モーダルが開いている
    expect(screen.getByText("Fill in placeholders")).toBeInTheDocument();

    // キャンセル
    fireEvent.click(screen.getByText("Cancel"));

    // モーダルが閉じる
    expect(
      screen.queryByText("Fill in placeholders")
    ).not.toBeInTheDocument();
  });
});
