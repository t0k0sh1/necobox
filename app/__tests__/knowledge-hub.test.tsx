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
      screen.getByText("Practical guides organized by situation for developers")
    ).toBeInTheDocument();
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
      screen.getByText("Check if the last commit has been pushed")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Undo last commit, keep changes staged")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Undo last commit, keep changes in working tree")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Undo last commit, discard changes completely")
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
    expect(screen.getAllByText("reset").length).toBeGreaterThanOrEqual(1);
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
      screen.getByText(/is the recommended way/i)
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
      screen.getByText("Create and switch")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Create from a specific branch")
    ).toBeInTheDocument();
  });

  it("filters items by search query", () => {
    render(<GitKnowledge />);

    const searchInput = screen.getByPlaceholderText(
      "Search by situation, tag, or command..."
    );
    fireEvent.change(searchInput, { target: { value: "revert" } });

    expect(
      screen.getByText("Undo last commit, discard changes completely")
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
    fireEvent.change(searchInput, { target: { value: "soft" } });

    expect(
      screen.getByText("Undo last commit, keep changes staged")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Creating a new branch and switching to it")
    ).not.toBeInTheDocument();
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

    // undo-soft カードを展開（git reset --soft HEAD~1 はプレースホルダーなし）
    const cardButton = screen
      .getByText("Undo last commit, keep changes staged")
      .closest("button")!;
    fireEvent.click(cardButton);

    // コピーボタンをクリック（プレースホルダーなし → 直接コピー）
    const copyButton = screen.getByLabelText("Copy Undo last commit, keep changes staged");
    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("git reset --soft HEAD~1");
  });

  it("opens placeholder dialog when code has placeholders", () => {
    render(<GitKnowledge />);

    // undo-hard カードを展開（git revert <commit-hash> を含む）
    const cardButton = screen
      .getByText("Undo last commit, discard changes completely")
      .closest("button")!;
    fireEvent.click(cardButton);

    // git revert <commit-hash> のコピーボタンをクリック
    const copyButton = screen.getByLabelText(
      "Copy Revert a pushed commit (safe for shared branches)"
    );
    fireEvent.click(copyButton);

    // モーダルが表示される
    expect(screen.getByText("Fill in placeholders")).toBeInTheDocument();
    expect(screen.getByText("Hash of the commit to revert")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("<commit-hash>")).toBeInTheDocument();
  });

  it("fills placeholder and copies the built command", async () => {
    render(<GitKnowledge />);

    // カード展開
    const cardButton = screen
      .getByText("Undo last commit, discard changes completely")
      .closest("button")!;
    fireEvent.click(cardButton);

    // モーダルを開く
    const copyButton = screen.getByLabelText(
      "Copy Revert a pushed commit (safe for shared branches)"
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

  it("closes placeholder dialog on cancel", () => {
    render(<GitKnowledge />);

    const cardButton = screen
      .getByText("Undo last commit, discard changes completely")
      .closest("button")!;
    fireEvent.click(cardButton);

    const copyButton = screen.getByLabelText(
      "Copy Revert a pushed commit (safe for shared branches)"
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
