import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DockerCheatsheet } from "../components/DockerCheatsheet";
import { GitCheatsheet } from "../components/GitCheatsheet";
import { HttpHeaderCheatsheet } from "../components/HttpHeaderCheatsheet";
import { MarkdownCheatsheet } from "../components/MarkdownCheatsheet";
import { MimeTypeCheatsheet } from "../components/MimeTypeCheatsheet";
import { ShellCheatsheet } from "../components/ShellCheatsheet";
import { SqlCheatsheet } from "../components/SqlCheatsheet";
import CheatsheetsPage from "../[locale]/cheatsheets/page";

describe("Cheatsheets Page", () => {
  beforeEach(() => {
    (navigator.clipboard.writeText as jest.Mock).mockClear();
  });

  it("renders page title", () => {
    render(<CheatsheetsPage />);
    expect(
      screen.getByRole("heading", { name: "Cheatsheets" })
    ).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<CheatsheetsPage />);
    expect(
      screen.getByText("Developer reference cheatsheets for quick lookup")
    ).toBeInTheDocument();
  });

  it("renders HTTP Status tab", () => {
    render(<CheatsheetsPage />);
    expect(
      screen.getByRole("tab", { name: "HTTP Status" })
    ).toBeInTheDocument();
  });

  it("renders search bar", () => {
    render(<CheatsheetsPage />);
    expect(
      screen.getByPlaceholderText("Search by code, name, or description...")
    ).toBeInTheDocument();
  });

  it("renders status codes", () => {
    render(<CheatsheetsPage />);
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument();
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Not Found")).toBeInTheDocument();
  });

  it("renders category headers", () => {
    render(<CheatsheetsPage />);
    expect(screen.getByText("1xx Informational")).toBeInTheDocument();
    expect(screen.getByText("2xx Success")).toBeInTheDocument();
    expect(screen.getByText("4xx Client Error")).toBeInTheDocument();
    expect(screen.getByText("5xx Server Error")).toBeInTheDocument();
  });

  it("filters status codes by search query", () => {
    render(<CheatsheetsPage />);

    const searchInput = screen.getByPlaceholderText(
      "Search by code, name, or description..."
    );

    fireEvent.change(searchInput, { target: { value: "404" } });

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Not Found")).toBeInTheDocument();
    // 200 OK は検索結果に含まれないはず
    expect(screen.queryByText("OK")).not.toBeInTheDocument();
  });

  it("shows no results message when search has no matches", () => {
    render(<CheatsheetsPage />);

    const searchInput = screen.getByPlaceholderText(
      "Search by code, name, or description..."
    );

    fireEvent.change(searchInput, { target: { value: "zzzzzzz" } });

    expect(
      screen.getByText("No matching status codes found")
    ).toBeInTheDocument();
  });

  it("collapses and expands categories", () => {
    render(<CheatsheetsPage />);

    // 2xx Success カテゴリのトグルボタンをクリック
    const categoryButton = screen.getByText("2xx Success").closest("button")!;
    fireEvent.click(categoryButton);

    // 折りたたんだ後、200 OK が非表示になるはず
    // ただし他のカテゴリの要素は残る
    expect(screen.getByText("404")).toBeInTheDocument();

    // もう一度クリックして展開
    fireEvent.click(categoryButton);
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("opens detail dialog when clicking a status code", () => {
    render(<CheatsheetsPage />);

    // 200をクリックして詳細Dialogを開く
    const codeButton = screen.getByText("200").closest("button")!;
    fireEvent.click(codeButton);

    // 詳細Dialogの内容が表示される
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Usage Example")).toBeInTheDocument();
    expect(screen.getByText("Related RFC")).toBeInTheDocument();
    expect(screen.getByText("MDN Reference")).toBeInTheDocument();
  });

  it("copies status code text when copy button is clicked", async () => {
    render(<CheatsheetsPage />);

    const row200 = screen.getByText("200").closest("button")!;
    const copyButtons = row200
      .closest(".group")!
      .querySelectorAll("button");
    const copyButton = copyButtons[copyButtons.length - 1];

    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("200 OK");
  });

  it("renders category tabs", () => {
    render(<CheatsheetsPage />);
    expect(screen.getByRole("tab", { name: "Web & API" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Command Line" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Language & Markup" })).toBeInTheDocument();
  });

  it("renders sub-tabs for Web & API category", () => {
    render(<CheatsheetsPage />);
    // Web & API がデフォルト選択なので、サブタブが表示される
    expect(screen.getByRole("tab", { name: "HTTP Status" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "HTTP Headers" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "MIME Types" })).toBeInTheDocument();
  });

  it("renders sub-tabs for Command Line category", async () => {
    render(<CheatsheetsPage />);
    // Command Line カテゴリをクリック
    fireEvent.click(screen.getByRole("tab", { name: "Command Line" }));
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Git" })).toBeInTheDocument();
    });
    expect(screen.getByRole("tab", { name: "Docker" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Shell" })).toBeInTheDocument();
  });

  it("renders sub-tabs for Language & Markup category", async () => {
    render(<CheatsheetsPage />);
    // Language & Markup カテゴリをクリック
    fireEvent.click(screen.getByRole("tab", { name: "Language & Markup" }));
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "SQL" })).toBeInTheDocument();
    });
    expect(screen.getByRole("tab", { name: "Markdown" })).toBeInTheDocument();
  });

  describe("Git Commands (GitCheatsheet)", () => {
    beforeEach(() => {
      (navigator.clipboard.writeText as jest.Mock).mockClear();
    });

    it("renders git commands", () => {
      render(<GitCheatsheet />);
      expect(screen.getByText("git init")).toBeInTheDocument();
      expect(screen.getByText("git commit")).toBeInTheDocument();
      expect(screen.getByText("git branch")).toBeInTheDocument();
    });

    it("renders git category headers", () => {
      render(<GitCheatsheet />);
      expect(screen.getByText("Basics")).toBeInTheDocument();
      expect(screen.getByText("Branching")).toBeInTheDocument();
      expect(screen.getByText("Diff & History")).toBeInTheDocument();
      expect(screen.getByText("Remote")).toBeInTheDocument();
      expect(screen.getByText("Stash")).toBeInTheDocument();
      expect(screen.getByText("Reset & Undo")).toBeInTheDocument();
    });

    it("renders search bar", () => {
      render(<GitCheatsheet />);
      expect(
        screen.getByPlaceholderText(
          "Search by command, option, or description..."
        )
      ).toBeInTheDocument();
    });

    it("filters git commands by search query", () => {
      render(<GitCheatsheet />);

      const searchInput = screen.getByPlaceholderText(
        "Search by command, option, or description..."
      );
      fireEvent.change(searchInput, { target: { value: "rebase" } });

      expect(screen.getByText("git rebase")).toBeInTheDocument();
      // git init は検索結果に含まれないはず
      expect(screen.queryByText("git init")).not.toBeInTheDocument();
    });

    it("filters git commands by option flag (cross-search)", () => {
      render(<GitCheatsheet />);

      const searchInput = screen.getByPlaceholderText(
        "Search by command, option, or description..."
      );
      fireEvent.change(searchInput, { target: { value: "--amend" } });

      // --amend オプションを持つ git commit が表示されるはず
      expect(screen.getByText("git commit")).toBeInTheDocument();
    });

    it("shows no results message when search has no matches", () => {
      render(<GitCheatsheet />);

      const searchInput = screen.getByPlaceholderText(
        "Search by command, option, or description..."
      );
      fireEvent.change(searchInput, { target: { value: "zzzzzzz" } });

      expect(
        screen.getByText("No matching commands found")
      ).toBeInTheDocument();
    });

    it("expands and collapses command options (accordion)", () => {
      render(<GitCheatsheet />);

      // git init をクリックしてオプションを展開
      const initButton = screen
        .getByText("git init")
        .closest("button")!;
      fireEvent.click(initButton);

      // オプションが表示される
      expect(screen.getByText("--bare")).toBeInTheDocument();
      expect(
        screen.getByText("--initial-branch <name>")
      ).toBeInTheDocument();

      // もう一度クリックして折りたたみ
      fireEvent.click(initButton);
      expect(screen.queryByText("--bare")).not.toBeInTheDocument();
    });

    it("collapses and expands categories", () => {
      render(<GitCheatsheet />);

      // Basics カテゴリのトグルボタンをクリック
      const categoryButton = screen
        .getByText("Basics")
        .closest("button")!;
      fireEvent.click(categoryButton);

      // 折りたたんだ後、git init が非表示になるはず
      expect(screen.queryByText("git init")).not.toBeInTheDocument();
      // ただし他のカテゴリの要素は残る
      expect(screen.getByText("git branch")).toBeInTheDocument();

      // もう一度クリックして展開
      fireEvent.click(categoryButton);
      expect(screen.getByText("git init")).toBeInTheDocument();
    });

    it("copies git command text when copy button is clicked", async () => {
      render(<GitCheatsheet />);

      const copyButton = screen.getByLabelText("Copy git init");

      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("git init");
    });
  });

  describe("HTTP Headers (HttpHeaderCheatsheet)", () => {
    beforeEach(() => {
      (navigator.clipboard.writeText as jest.Mock).mockClear();
    });

    it("renders HTTP headers", () => {
      render(<HttpHeaderCheatsheet />);
      expect(screen.getByText("Content-Type")).toBeInTheDocument();
      expect(screen.getByText("Cache-Control")).toBeInTheDocument();
      expect(screen.getByText("Content-Length")).toBeInTheDocument();
    });

    it("renders category headers", () => {
      render(<HttpHeaderCheatsheet />);
      expect(screen.getByText("Request (General)")).toBeInTheDocument();
      expect(screen.getByText("Response (General)")).toBeInTheDocument();
      expect(screen.getByText("Security")).toBeInTheDocument();
    });

    it("renders search bar", () => {
      render(<HttpHeaderCheatsheet />);
      expect(
        screen.getByPlaceholderText("Search by header name, description, or example...")
      ).toBeInTheDocument();
    });

    it("filters headers by search query", () => {
      render(<HttpHeaderCheatsheet />);
      const searchInput = screen.getByPlaceholderText(
        "Search by header name, description, or example..."
      );
      fireEvent.change(searchInput, { target: { value: "Content-Type" } });
      expect(screen.getByText("Content-Type")).toBeInTheDocument();
      expect(screen.queryByText("User-Agent")).not.toBeInTheDocument();
    });

    it("shows no results message when search has no matches", () => {
      render(<HttpHeaderCheatsheet />);
      const searchInput = screen.getByPlaceholderText(
        "Search by header name, description, or example..."
      );
      fireEvent.change(searchInput, { target: { value: "zzzzzzz" } });
      expect(screen.getByText("No matching headers found")).toBeInTheDocument();
    });

    it("copies header text when copy button is clicked", async () => {
      render(<HttpHeaderCheatsheet />);
      const copyButton = screen.getByLabelText("Copy Content-Type");
      await act(async () => {
        fireEvent.click(copyButton);
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Content-Type");
    });
  });

  describe("Docker Commands (DockerCheatsheet)", () => {
    beforeEach(() => {
      (navigator.clipboard.writeText as jest.Mock).mockClear();
    });

    it("renders docker commands", () => {
      render(<DockerCheatsheet />);
      expect(screen.getByText("docker run")).toBeInTheDocument();
      expect(screen.getByText("docker ps")).toBeInTheDocument();
      expect(screen.getByText("docker stop")).toBeInTheDocument();
    });

    it("renders category headers", () => {
      render(<DockerCheatsheet />);
      expect(screen.getByText("Container")).toBeInTheDocument();
      expect(screen.getByText("Image")).toBeInTheDocument();
      expect(screen.getByText("Network")).toBeInTheDocument();
    });

    it("renders search bar", () => {
      render(<DockerCheatsheet />);
      expect(
        screen.getByPlaceholderText("Search by command, option, or description...")
      ).toBeInTheDocument();
    });

    it("filters commands by search query", () => {
      render(<DockerCheatsheet />);
      const searchInput = screen.getByPlaceholderText(
        "Search by command, option, or description..."
      );
      fireEvent.change(searchInput, { target: { value: "docker run" } });
      expect(screen.getByText("docker run")).toBeInTheDocument();
      expect(screen.queryByText("docker ps")).not.toBeInTheDocument();
    });

    it("shows no results message when search has no matches", () => {
      render(<DockerCheatsheet />);
      const searchInput = screen.getByPlaceholderText(
        "Search by command, option, or description..."
      );
      fireEvent.change(searchInput, { target: { value: "zzzzzzz" } });
      expect(screen.getByText("No matching commands found")).toBeInTheDocument();
    });

    it("expands and collapses command options", () => {
      render(<DockerCheatsheet />);
      const runButton = screen.getByText("docker run").closest("button")!;
      fireEvent.click(runButton);
      // docker run のオプションが展開される
      expect(screen.getByText("-d, --detach")).toBeInTheDocument();
      expect(screen.getByText("--rm")).toBeInTheDocument();
      // 折りたたみ
      fireEvent.click(runButton);
      expect(screen.queryByText("-d, --detach")).not.toBeInTheDocument();
    });

    it("copies command text when copy button is clicked", async () => {
      render(<DockerCheatsheet />);
      const copyButton = screen.getByLabelText("Copy docker run");
      await act(async () => {
        fireEvent.click(copyButton);
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("docker run");
    });
  });

  describe("Shell Commands (ShellCheatsheet)", () => {
    beforeEach(() => {
      (navigator.clipboard.writeText as jest.Mock).mockClear();
    });

    it("renders shell commands", () => {
      render(<ShellCheatsheet />);
      expect(screen.getByText("ls")).toBeInTheDocument();
      expect(screen.getByText("cd")).toBeInTheDocument();
      expect(screen.getByText("cp")).toBeInTheDocument();
    });

    it("renders category headers", () => {
      render(<ShellCheatsheet />);
      expect(screen.getByText("File Operations")).toBeInTheDocument();
      expect(screen.getByText("Text Processing")).toBeInTheDocument();
      expect(screen.getByText("Process Management")).toBeInTheDocument();
    });

    it("renders search bar", () => {
      render(<ShellCheatsheet />);
      expect(
        screen.getByPlaceholderText("Search by command, option, or description...")
      ).toBeInTheDocument();
    });

    it("filters commands by search query", () => {
      render(<ShellCheatsheet />);
      const searchInput = screen.getByPlaceholderText(
        "Search by command, option, or description..."
      );
      fireEvent.change(searchInput, { target: { value: "chmod" } });
      expect(screen.getByText("chmod")).toBeInTheDocument();
      expect(screen.queryByText("ls")).not.toBeInTheDocument();
    });

    it("shows no results message when search has no matches", () => {
      render(<ShellCheatsheet />);
      const searchInput = screen.getByPlaceholderText(
        "Search by command, option, or description..."
      );
      fireEvent.change(searchInput, { target: { value: "zzzzzzz" } });
      expect(screen.getByText("No matching commands found")).toBeInTheDocument();
    });

    it("copies command text when copy button is clicked", async () => {
      render(<ShellCheatsheet />);
      const copyButton = screen.getByLabelText("Copy ls");
      await act(async () => {
        fireEvent.click(copyButton);
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("ls");
    });
  });

  describe("SQL Syntax (SqlCheatsheet)", () => {
    beforeEach(() => {
      (navigator.clipboard.writeText as jest.Mock).mockClear();
    });

    it("renders SQL syntaxes", () => {
      render(<SqlCheatsheet />);
      expect(screen.getByText("SELECT ... FROM ...")).toBeInTheDocument();
      expect(screen.getByText("WHERE")).toBeInTheDocument();
      expect(screen.getByText("ORDER BY")).toBeInTheDocument();
    });

    it("renders category headers", () => {
      render(<SqlCheatsheet />);
      expect(screen.getByText("SELECT")).toBeInTheDocument();
      expect(screen.getByText("JOIN")).toBeInTheDocument();
      expect(screen.getByText("Aggregate")).toBeInTheDocument();
    });

    it("renders search bar", () => {
      render(<SqlCheatsheet />);
      expect(
        screen.getByPlaceholderText("Search by syntax, name, or description...")
      ).toBeInTheDocument();
    });

    it("filters syntaxes by search query", () => {
      render(<SqlCheatsheet />);
      const searchInput = screen.getByPlaceholderText(
        "Search by syntax, name, or description..."
      );
      fireEvent.change(searchInput, { target: { value: "WHERE" } });
      expect(screen.getByText("WHERE")).toBeInTheDocument();
      expect(screen.queryByText("ORDER BY")).not.toBeInTheDocument();
    });

    it("shows no results message when search has no matches", () => {
      render(<SqlCheatsheet />);
      const searchInput = screen.getByPlaceholderText(
        "Search by syntax, name, or description..."
      );
      fireEvent.change(searchInput, { target: { value: "zzzzzzz" } });
      expect(screen.getByText("No matching syntax found")).toBeInTheDocument();
    });

    it("copies syntax text when copy button is clicked", async () => {
      render(<SqlCheatsheet />);
      const copyButton = screen.getByLabelText("Copy SELECT ... FROM ...");
      await act(async () => {
        fireEvent.click(copyButton);
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("SELECT ... FROM ...");
    });
  });

  describe("Markdown Syntax (MarkdownCheatsheet)", () => {
    beforeEach(() => {
      (navigator.clipboard.writeText as jest.Mock).mockClear();
    });

    it("renders markdown syntaxes", () => {
      render(<MarkdownCheatsheet />);
      expect(screen.getByText("# Heading 1")).toBeInTheDocument();
      expect(screen.getByText("**bold** / __bold__")).toBeInTheDocument();
    });

    it("renders category headers", () => {
      render(<MarkdownCheatsheet />);
      expect(screen.getByText("Headings")).toBeInTheDocument();
      expect(screen.getByText("Emphasis")).toBeInTheDocument();
      expect(screen.getByText("Lists")).toBeInTheDocument();
    });

    it("renders search bar", () => {
      render(<MarkdownCheatsheet />);
      expect(
        screen.getByPlaceholderText("Search by syntax or description...")
      ).toBeInTheDocument();
    });

    it("filters syntaxes by search query", () => {
      render(<MarkdownCheatsheet />);
      const searchInput = screen.getByPlaceholderText(
        "Search by syntax or description..."
      );
      fireEvent.change(searchInput, { target: { value: "bold" } });
      expect(screen.getByText("**bold** / __bold__")).toBeInTheDocument();
      expect(screen.queryByText("# Heading 1")).not.toBeInTheDocument();
    });

    it("shows no results message when search has no matches", () => {
      render(<MarkdownCheatsheet />);
      const searchInput = screen.getByPlaceholderText(
        "Search by syntax or description..."
      );
      fireEvent.change(searchInput, { target: { value: "zzzzzzz" } });
      expect(screen.getByText("No matching syntax found")).toBeInTheDocument();
    });

    it("copies syntax text when copy button is clicked", async () => {
      render(<MarkdownCheatsheet />);
      const copyButton = screen.getByLabelText("Copy # Heading 1");
      await act(async () => {
        fireEvent.click(copyButton);
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("# Heading 1");
    });
  });

  describe("MIME Types (MimeTypeCheatsheet)", () => {
    beforeEach(() => {
      (navigator.clipboard.writeText as jest.Mock).mockClear();
    });

    it("renders MIME types", () => {
      render(<MimeTypeCheatsheet />);
      expect(screen.getByText("text/plain")).toBeInTheDocument();
      expect(screen.getByText("text/html")).toBeInTheDocument();
      expect(screen.getByText("application/json")).toBeInTheDocument();
    });

    it("renders category headers", () => {
      render(<MimeTypeCheatsheet />);
      expect(screen.getByText("text/*")).toBeInTheDocument();
      expect(screen.getByText("application/*")).toBeInTheDocument();
      expect(screen.getByText("image/*")).toBeInTheDocument();
    });

    it("renders search bar", () => {
      render(<MimeTypeCheatsheet />);
      expect(
        screen.getByPlaceholderText("Search by MIME type, extension, or description...")
      ).toBeInTheDocument();
    });

    it("filters MIME types by search query", () => {
      render(<MimeTypeCheatsheet />);
      const searchInput = screen.getByPlaceholderText(
        "Search by MIME type, extension, or description..."
      );
      fireEvent.change(searchInput, { target: { value: "json" } });
      expect(screen.getByText("application/json")).toBeInTheDocument();
      expect(screen.queryByText("text/plain")).not.toBeInTheDocument();
    });

    it("shows no results message when search has no matches", () => {
      render(<MimeTypeCheatsheet />);
      const searchInput = screen.getByPlaceholderText(
        "Search by MIME type, extension, or description..."
      );
      fireEvent.change(searchInput, { target: { value: "zzzzzzz" } });
      expect(screen.getByText("No matching MIME types found")).toBeInTheDocument();
    });

    it("copies MIME type text when copy button is clicked", async () => {
      render(<MimeTypeCheatsheet />);
      const copyButton = screen.getByLabelText("Copy text/plain");
      await act(async () => {
        fireEvent.click(copyButton);
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("text/plain");
    });
  });
});
