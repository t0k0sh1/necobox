import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DecodedSection } from "../DecodedSection";

// Mock clipboard API
const mockWriteText = jest.fn();
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
});

describe("DecodedSection", () => {
  beforeEach(() => {
    mockWriteText.mockClear();
    mockWriteText.mockResolvedValue(undefined);
  });

  it("renders title correctly", () => {
    render(<DecodedSection title="Header" content='{"alg": "HS256"}' />);

    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  it("renders content in code block", () => {
    const content = '{"alg": "HS256"}';
    render(<DecodedSection title="Header" content={content} />);

    expect(screen.getByText(content)).toBeInTheDocument();
  });

  it("renders copy button", () => {
    render(<DecodedSection title="Header" content='{"alg": "HS256"}' />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("copies content when copy button is clicked", () => {
    const content = '{"alg": "HS256"}';
    render(<DecodedSection title="Header" content={content} />);

    fireEvent.click(screen.getByRole("button"));

    expect(mockWriteText).toHaveBeenCalledWith(content);
  });

  it("calls onCopy callback when provided", async () => {
    const onCopy = jest.fn();
    render(
      <DecodedSection
        title="Header"
        content='{"alg": "HS256"}'
        onCopy={onCopy}
      />
    );

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(onCopy).toHaveBeenCalled();
    });
  });

  it("applies break-all class when codeStyle is false", () => {
    render(
      <DecodedSection
        title="Signature"
        content="longsignaturestring"
        codeStyle={false}
      />
    );

    const codeElement = screen.getByText("longsignaturestring");
    expect(codeElement).toHaveClass("break-all");
  });

  it("does not apply break-all class by default", () => {
    render(<DecodedSection title="Header" content='{"alg": "HS256"}' />);

    const codeElement = screen.getByText('{"alg": "HS256"}');
    expect(codeElement).not.toHaveClass("break-all");
  });
});
