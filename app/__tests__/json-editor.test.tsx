import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import JsonEditorPage from "../[locale]/json-editor/page";

describe("JSON Editor Page", () => {
  beforeEach(() => {
    (navigator.clipboard.writeText as jest.Mock).mockClear();
  });

  it("renders page title", () => {
    render(<JsonEditorPage />);

    expect(
      screen.getByRole("heading", { name: "JSON Editor" })
    ).toBeInTheDocument();
  });

  it("renders JSON input textarea", () => {
    render(<JsonEditorPage />);

    expect(screen.getByPlaceholderText(/Enter JSON here/)).toBeInTheDocument();
  });

  it("renders format toggle buttons", () => {
    render(<JsonEditorPage />);

    expect(screen.getByRole("radio", { name: "Pretty" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Minify" })).toBeInTheDocument();
  });

  it("renders toolbar buttons", () => {
    render(<JsonEditorPage />);

    expect(screen.getByRole("button", { name: /Copy/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Clear/i })).toBeInTheDocument();
  });

  it("shows empty state message when no input", () => {
    render(<JsonEditorPage />);

    expect(screen.getByText("Please enter JSON")).toBeInTheDocument();
  });

  it("validates valid JSON and shows success message", async () => {
    render(<JsonEditorPage />);

    const textarea = screen.getByPlaceholderText(/Enter JSON here/);
    fireEvent.change(textarea, { target: { value: '{"name": "test"}' } });

    await waitFor(() => {
      expect(screen.getByText("Valid JSON")).toBeInTheDocument();
    });
  });

  it("validates invalid JSON and shows error message", async () => {
    render(<JsonEditorPage />);

    const textarea = screen.getByPlaceholderText(/Enter JSON here/);
    fireEvent.change(textarea, { target: { value: '{"name": }' } });

    await waitFor(() => {
      expect(screen.queryByText("Valid JSON")).not.toBeInTheDocument();
    });
  });

  it("formats JSON to pretty mode when input is valid", async () => {
    render(<JsonEditorPage />);

    const textarea = screen.getByPlaceholderText(
      /Enter JSON here/
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"a":1,"b":2}' } });

    await waitFor(() => {
      expect(screen.getByText("Valid JSON")).toBeInTheDocument();
    });

    // 'Pretty' モードがデフォルトで選択されている状態でトグルすると整形される
    const prettyButton = screen.getByRole("radio", { name: "Pretty" });
    fireEvent.click(prettyButton);

    await waitFor(() => {
      expect(textarea.value).toContain("  ");
    });
  });

  it("minifies JSON when minify mode is selected", async () => {
    render(<JsonEditorPage />);

    const textarea = screen.getByPlaceholderText(
      /Enter JSON here/
    ) as HTMLTextAreaElement;
    const prettyJson = `{
  "name": "test",
  "value": 123
}`;
    fireEvent.change(textarea, { target: { value: prettyJson } });

    await waitFor(() => {
      expect(screen.getByText("Valid JSON")).toBeInTheDocument();
    });

    const minifyButton = screen.getByRole("radio", { name: "Minify" });
    fireEvent.click(minifyButton);

    await waitFor(() => {
      expect(textarea.value).toBe('{"name":"test","value":123}');
    });
  });

  it("clears input when clear button is clicked", async () => {
    render(<JsonEditorPage />);

    const textarea = screen.getByPlaceholderText(
      /Enter JSON here/
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"test": true}' } });

    await waitFor(() => {
      expect(screen.getByText("Valid JSON")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Clear/i }));

    expect(textarea.value).toBe("");
    expect(screen.queryByText("Valid JSON")).not.toBeInTheDocument();
    expect(screen.getByText("Please enter JSON")).toBeInTheDocument();
  });

  it("allows copying JSON to clipboard", async () => {
    render(<JsonEditorPage />);

    const textarea = screen.getByPlaceholderText(/Enter JSON here/);
    fireEvent.change(textarea, { target: { value: '{"test": true}' } });

    await waitFor(() => {
      expect(screen.getByText("Valid JSON")).toBeInTheDocument();
    });

    const copyButton = screen.getByRole("button", { name: /Copy/i });
    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('{"test": true}');
  });

  it("disables download button for invalid JSON", async () => {
    render(<JsonEditorPage />);

    const textarea = screen.getByPlaceholderText(/Enter JSON here/);
    fireEvent.change(textarea, { target: { value: '{"invalid": }' } });

    await waitFor(() => {
      const downloadButton = screen.getByRole("button", { name: /Download/i });
      expect(downloadButton).toBeDisabled();
    });
  });

  it("enables download button for valid JSON", async () => {
    render(<JsonEditorPage />);

    const textarea = screen.getByPlaceholderText(/Enter JSON here/);
    fireEvent.change(textarea, { target: { value: '{"valid": true}' } });

    await waitFor(() => {
      expect(screen.getByText("Valid JSON")).toBeInTheDocument();
      const downloadButton = screen.getByRole("button", { name: /Download/i });
      expect(downloadButton).not.toBeDisabled();
    });
  });

  it("shows indent selector only in pretty mode", async () => {
    render(<JsonEditorPage />);

    // Pretty モードではインデント選択が表示される
    expect(screen.getByText("Indent:")).toBeInTheDocument();

    // Minify モードに切り替え
    const minifyButton = screen.getByRole("radio", { name: "Minify" });
    fireEvent.click(minifyButton);

    await waitFor(() => {
      expect(screen.queryByText("Indent:")).not.toBeInTheDocument();
    });

    // Pretty モードに戻す
    const prettyButton = screen.getByRole("radio", { name: "Pretty" });
    fireEvent.click(prettyButton);

    await waitFor(() => {
      expect(screen.getByText("Indent:")).toBeInTheDocument();
    });
  });

  it("shows warning for duplicate keys", async () => {
    render(<JsonEditorPage />);

    const textarea = screen.getByPlaceholderText(/Enter JSON here/);
    fireEvent.change(textarea, {
      target: { value: '{"name": "first", "name": "second"}' },
    });

    await waitFor(() => {
      expect(screen.getByText("Valid JSON with warnings")).toBeInTheDocument();
    });
  });

  it("shows duplicate key warning message with line number", async () => {
    render(<JsonEditorPage />);

    const textarea = screen.getByPlaceholderText(/Enter JSON here/);
    const jsonWithDuplicate = `{
  "name": "first",
  "name": "second"
}`;
    fireEvent.change(textarea, { target: { value: jsonWithDuplicate } });

    await waitFor(() => {
      expect(screen.getByText(/Line 3.*Duplicate key/)).toBeInTheDocument();
    });
  });
});
