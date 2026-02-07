import { act, fireEvent, render, screen } from "@testing-library/react";
import { KnowledgeTemplate } from "../components/KnowledgeTemplate";
import type { KnowledgeConfig } from "@/lib/types/knowledge";

const MOCK_CONFIG: KnowledgeConfig = {
  items: [
    {
      id: "item-1",
      situationEn: "How to do thing A",
      situationJa: "Aのやり方",
      explanationEn: "Explanation for thing A in English.",
      explanationJa: "Aの解説（日本語）。",
      snippets: [
        {
          labelEn: "Basic command",
          labelJa: "基本コマンド",
          code: "do-thing-a",
        },
        {
          labelEn: "With option",
          labelJa: "オプション付き",
          code: "do-thing-a --flag <value>",
          noteEn: "Specify a value",
          noteJa: "値を指定",
        },
      ],
      hasRelatedCheatsheet: true,
      tags: ["tagA", "tagB"],
    },
    {
      id: "item-2",
      situationEn: "How to do thing B",
      situationJa: "Bのやり方",
      explanationEn: "Explanation for thing B.",
      explanationJa: "Bの解説。",
      snippets: [
        {
          labelEn: "Multi-line example",
          labelJa: "複数行の例",
          code: "SELECT *\nFROM table\nWHERE id = 1;",
        },
      ],
      tags: ["tagC"],
    },
  ],
};

describe("KnowledgeTemplate", () => {
  beforeEach(() => {
    (navigator.clipboard.writeText as jest.Mock).mockClear();
  });

  it("renders all items", () => {
    render(<KnowledgeTemplate config={MOCK_CONFIG} />);
    expect(screen.getByText("How to do thing A")).toBeInTheDocument();
    expect(screen.getByText("How to do thing B")).toBeInTheDocument();
  });

  it("renders search bar", () => {
    render(<KnowledgeTemplate config={MOCK_CONFIG} />);
    expect(
      screen.getByPlaceholderText("Search by situation, tag, or command...")
    ).toBeInTheDocument();
  });

  it("renders tags", () => {
    render(<KnowledgeTemplate config={MOCK_CONFIG} />);
    expect(screen.getByText("tagA")).toBeInTheDocument();
    expect(screen.getByText("tagB")).toBeInTheDocument();
    expect(screen.getByText("tagC")).toBeInTheDocument();
  });

  it("expands and collapses items", () => {
    render(<KnowledgeTemplate config={MOCK_CONFIG} />);

    const button = screen.getByText("How to do thing A").closest("button")!;
    fireEvent.click(button);

    expect(screen.getByText("Basic command")).toBeInTheDocument();
    expect(screen.getByText("do-thing-a")).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByText("do-thing-a")).not.toBeInTheDocument();
  });

  it("filters items by search query", () => {
    render(<KnowledgeTemplate config={MOCK_CONFIG} />);

    const input = screen.getByPlaceholderText(
      "Search by situation, tag, or command..."
    );
    fireEvent.change(input, { target: { value: "thing B" } });

    expect(screen.getByText("How to do thing B")).toBeInTheDocument();
    expect(
      screen.queryByText("How to do thing A")
    ).not.toBeInTheDocument();
  });

  it("filters items by tag", () => {
    render(<KnowledgeTemplate config={MOCK_CONFIG} />);

    const input = screen.getByPlaceholderText(
      "Search by situation, tag, or command..."
    );
    fireEvent.change(input, { target: { value: "tagC" } });

    expect(screen.getByText("How to do thing B")).toBeInTheDocument();
    expect(
      screen.queryByText("How to do thing A")
    ).not.toBeInTheDocument();
  });

  it("shows no results message", () => {
    render(<KnowledgeTemplate config={MOCK_CONFIG} />);

    const input = screen.getByPlaceholderText(
      "Search by situation, tag, or command..."
    );
    fireEvent.change(input, { target: { value: "zzzzzzz" } });

    expect(
      screen.getByText("No matching knowledge items found")
    ).toBeInTheDocument();
  });

  it("copies code without placeholder directly", async () => {
    render(<KnowledgeTemplate config={MOCK_CONFIG} />);

    const button = screen.getByText("How to do thing A").closest("button")!;
    fireEvent.click(button);

    const copyBtn = screen.getByLabelText("Copy do-thing-a");
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("do-thing-a");
  });

  it("opens placeholder dialog for code with placeholders", () => {
    render(<KnowledgeTemplate config={MOCK_CONFIG} />);

    const button = screen.getByText("How to do thing A").closest("button")!;
    fireEvent.click(button);

    const copyBtn = screen.getByLabelText("Copy do-thing-a --flag <value>");
    fireEvent.click(copyBtn);

    expect(screen.getByText("Fill in placeholders")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("<value>")).toBeInTheDocument();
  });

  it("fills placeholder and copies built command", async () => {
    render(<KnowledgeTemplate config={MOCK_CONFIG} />);

    const button = screen.getByText("How to do thing A").closest("button")!;
    fireEvent.click(button);

    const copyBtn = screen.getByLabelText("Copy do-thing-a --flag <value>");
    fireEvent.click(copyBtn);

    const input = screen.getByPlaceholderText("<value>");
    fireEvent.change(input, { target: { value: "myval" } });

    expect(
      screen.getByText("do-thing-a --flag myval")
    ).toBeInTheDocument();

    const dialogCopyBtn = screen.getByText("Copy command");
    await act(async () => {
      fireEvent.click(dialogCopyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "do-thing-a --flag myval"
    );
  });

  it("renders multi-line code in pre/code block", () => {
    render(<KnowledgeTemplate config={MOCK_CONFIG} />);

    const button = screen.getByText("How to do thing B").closest("button")!;
    fireEvent.click(button);

    const codeEl = screen.getByText(/SELECT \*/);
    expect(codeEl.tagName).toBe("CODE");
    expect(codeEl.parentElement?.tagName).toBe("PRE");
  });

  it("shows cheatsheet link for items with hasRelatedCheatsheet", () => {
    render(<KnowledgeTemplate config={MOCK_CONFIG} />);

    const button = screen.getByText("How to do thing A").closest("button")!;
    fireEvent.click(button);

    expect(
      screen.getByText("View related commands in Cheatsheets →")
    ).toBeInTheDocument();
  });

  it("does not show cheatsheet link for items without hasRelatedCheatsheet", () => {
    render(<KnowledgeTemplate config={MOCK_CONFIG} />);

    const button = screen.getByText("How to do thing B").closest("button")!;
    fireEvent.click(button);

    // Item B has no hasRelatedCheatsheet, so no link
    const links = screen.queryAllByText(
      "View related commands in Cheatsheets →"
    );
    expect(links.length).toBe(0);
  });

  it("uses custom cheatsheetPath", () => {
    const config: KnowledgeConfig = {
      ...MOCK_CONFIG,
      cheatsheetPath: "/custom-path",
    };
    render(<KnowledgeTemplate config={config} />);

    const button = screen.getByText("How to do thing A").closest("button")!;
    fireEvent.click(button);

    const link = screen.getByText("View related commands in Cheatsheets →");
    expect(link.closest("a")).toHaveAttribute("href", "/custom-path");
  });
});
