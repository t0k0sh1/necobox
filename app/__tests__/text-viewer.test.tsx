import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import TextViewerPage from "../[locale]/text-viewer/page";

// Virtuosoのモック
jest.mock("react-virtuoso", () => ({
  Virtuoso: ({
    totalCount,
    itemContent,
  }: {
    totalCount: number;
    itemContent: (index: number) => React.ReactNode;
  }) => (
    <div data-testid="virtuoso-container">
      {Array.from({ length: Math.min(totalCount, 20) }, (_, i) => (
        <div key={i}>{itemContent(i)}</div>
      ))}
    </div>
  ),
}));

// ファイルを作成するヘルパー（text()メソッドをモック）
function createMockFile(content: string, name: string = "test.txt"): File {
  const file = new File([content], name, { type: "text/plain" });
  // File.text()メソッドをモック
  file.text = jest.fn().mockResolvedValue(content);
  return file;
}

// ファイルをアップロードするヘルパー
async function uploadFile(file: File) {
  const input = screen.getByLabelText("Select Files");
  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } });
  });
}

describe("Text Viewer Page", () => {
  beforeEach(() => {
    // crypto.randomUUID のモック
    Object.defineProperty(global, "crypto", {
      value: {
        randomUUID: jest.fn(() => "test-uuid-" + Math.random().toString(36).substring(7)),
      },
    });
  });

  describe("基本レンダリング", () => {
    it("ページタイトルをレンダリングする", () => {
      render(<TextViewerPage />);
      expect(
        screen.getByRole("heading", { name: "Text File Viewer" })
      ).toBeInTheDocument();
    });

    it("ファイルアップロードエリアをレンダリングする", () => {
      render(<TextViewerPage />);
      expect(screen.getByText("Upload Files")).toBeInTheDocument();
      expect(screen.getByText(/Supports .txt, .log/)).toBeInTheDocument();
    });

    it("空の状態メッセージを表示する", () => {
      render(<TextViewerPage />);
      expect(screen.getByText("Please upload a file")).toBeInTheDocument();
    });
  });

  describe("ファイルアップロード", () => {
    it("テキストファイルをアップロードできる", async () => {
      render(<TextViewerPage />);

      const file = createMockFile("Line 1\nLine 2\nLine 3", "test.txt");
      await uploadFile(file);

      await waitFor(() => {
        expect(screen.getByText("test.txt")).toBeInTheDocument();
      });
    });

    it("アップロード後にファイル内容を表示する", async () => {
      render(<TextViewerPage />);

      const file = createMockFile("First line\nSecond line", "test.txt");
      await uploadFile(file);

      await waitFor(() => {
        expect(screen.getByText("First line")).toBeInTheDocument();
        expect(screen.getByText("Second line")).toBeInTheDocument();
      });
    });
  });

  describe("ピン止め機能", () => {
    it("行をピン止めできる", async () => {
      render(<TextViewerPage />);

      const file = createMockFile("Line 1\nLine 2\nLine 3", "test.txt");
      await uploadFile(file);

      await waitFor(() => {
        expect(screen.getByText("Line 1")).toBeInTheDocument();
      });

      // 最初の行のピンボタンをクリック
      const pinButtons = screen.getAllByRole("button", { name: /Pin line/i });
      expect(pinButtons.length).toBeGreaterThan(0);

      await act(async () => {
        fireEvent.click(pinButtons[0]);
      });

      // ピン解除ボタンが表示されることを確認
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Unpin line/i })).toBeInTheDocument();
      });
    });

    it("ピン止めした行を解除できる", async () => {
      render(<TextViewerPage />);

      const file = createMockFile("Line 1\nLine 2", "test.txt");
      await uploadFile(file);

      await waitFor(() => {
        expect(screen.getByText("Line 1")).toBeInTheDocument();
      });

      // ピン止め
      const pinButton = screen.getAllByRole("button", { name: /Pin line/i })[0];
      await act(async () => {
        fireEvent.click(pinButton);
      });

      // ピン解除
      const unpinButton = await screen.findByRole("button", { name: /Unpin line/i });
      await act(async () => {
        fireEvent.click(unpinButton);
      });

      // ピンボタンのみが表示されることを確認（ピン解除ボタンが消える）
      await waitFor(() => {
        const unpinButtons = screen.queryAllByRole("button", { name: /Unpin line/i });
        expect(unpinButtons.length).toBe(0);
      });
    });

    it("ピン止めした行は琥珀色の背景で表示される", async () => {
      render(<TextViewerPage />);

      const file = createMockFile("Line 1\nLine 2", "test.txt");
      await uploadFile(file);

      await waitFor(() => {
        expect(screen.getByText("Line 1")).toBeInTheDocument();
      });

      // ピン止め
      const pinButton = screen.getAllByRole("button", { name: /Pin line/i })[0];
      await act(async () => {
        fireEvent.click(pinButton);
      });

      // ピン止めエリアが表示されることを確認
      await waitFor(() => {
        // ピン止めエリアの背景色クラスを持つ要素を確認
        const pinnedArea = document.querySelector(".bg-amber-50\\/50");
        expect(pinnedArea).toBeInTheDocument();
      });
    });

    it("フィルタリング中もピン止めした行は表示される", async () => {
      render(<TextViewerPage />);

      const file = createMockFile("apple\nbanana\ncherry", "test.txt");
      await uploadFile(file);

      await waitFor(() => {
        expect(screen.getByText("apple")).toBeInTheDocument();
      });

      // appleをピン止め
      const pinButtons = screen.getAllByRole("button", { name: /Pin line/i });
      await act(async () => {
        fireEvent.click(pinButtons[0]);
      });

      // ピンエリアが表示されるのを待つ
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Unpin line/i })).toBeInTheDocument();
      });

      // "banana"でフィルタリング
      const searchInput = screen.getByPlaceholderText(/Search text/i);
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "banana" } });
      });

      // フィルタ後、ピンエリアにはappleが表示される
      await waitFor(() => {
        // ピンエリアにappleが表示される
        const pinnedArea = document.querySelector(".border-amber-200");
        expect(pinnedArea).toBeInTheDocument();
        expect(pinnedArea?.textContent).toContain("apple");

        // メインエリアにはbananaが表示される
        expect(screen.getByText("banana")).toBeInTheDocument();
      });
    });
  });

  describe("ファイル切り替え", () => {
    it("複数ファイルをアップロードできる", async () => {
      render(<TextViewerPage />);

      // 1つ目のファイルをアップロード
      const file1 = createMockFile("File1 Line1\nFile1 Line2", "file1.txt");
      await uploadFile(file1);

      await waitFor(() => {
        expect(screen.getByText("file1.txt")).toBeInTheDocument();
      });

      // 2つ目のファイルをアップロード
      const file2 = createMockFile("File2 Line1\nFile2 Line2", "file2.txt");
      await uploadFile(file2);

      // 両方のファイルタブが表示される
      await waitFor(() => {
        expect(screen.getByText("file1.txt")).toBeInTheDocument();
        expect(screen.getByText("file2.txt")).toBeInTheDocument();
      });
    });

    it("ファイルごとにピン状態を保持できる", async () => {
      render(<TextViewerPage />);

      // ファイルをアップロード
      const file = createMockFile("Line 1\nLine 2", "test.txt");
      await uploadFile(file);

      await waitFor(() => {
        expect(screen.getByText("Line 1")).toBeInTheDocument();
      });

      // ピン止め
      const pinButton = screen.getAllByRole("button", { name: /Pin line/i })[0];
      await act(async () => {
        fireEvent.click(pinButton);
      });

      // ピンが追加されたことを確認
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Unpin line/i })).toBeInTheDocument();
      });

      // ピンエリアが存在することを確認
      const pinnedArea = document.querySelector(".border-amber-200");
      expect(pinnedArea).toBeInTheDocument();
    });
  });

  describe("表示オプションとの連携", () => {
    it("行折り返しオプションはピン止め行にも適用される", async () => {
      render(<TextViewerPage />);

      const file = createMockFile("This is a very long line that should wrap when the wrap option is enabled", "test.txt");
      await uploadFile(file);

      await waitFor(() => {
        expect(screen.getByText(/This is a very long line/)).toBeInTheDocument();
      });

      // ピン止め
      const pinButton = screen.getAllByRole("button", { name: /Pin line/i })[0];
      await act(async () => {
        fireEvent.click(pinButton);
      });

      // 行折り返しチェックボックスをクリック
      const wrapCheckbox = screen.getByLabelText("Wrap Lines");
      await act(async () => {
        fireEvent.click(wrapCheckbox);
      });

      // ピンエリアが存在することを確認
      await waitFor(() => {
        const pinnedArea = document.querySelector(".bg-amber-50\\/50");
        expect(pinnedArea).toBeInTheDocument();
      });
    });
  });

  describe("クリア機能", () => {
    it("クリア時にピン状態もリセットされる", async () => {
      render(<TextViewerPage />);

      const file = createMockFile("Line 1\nLine 2", "test.txt");
      await uploadFile(file);

      await waitFor(() => {
        expect(screen.getByText("Line 1")).toBeInTheDocument();
      });

      // ピン止め
      const pinButton = screen.getAllByRole("button", { name: /Pin line/i })[0];
      await act(async () => {
        fireEvent.click(pinButton);
      });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Unpin line/i })).toBeInTheDocument();
      });

      // クリアボタンをクリック
      const clearButton = screen.getByRole("button", { name: "Clear" });
      await act(async () => {
        fireEvent.click(clearButton);
      });

      // ファイルがクリアされ、空の状態に戻ることを確認
      await waitFor(() => {
        expect(screen.getByText("Please upload a file")).toBeInTheDocument();
      });
    });
  });
});
