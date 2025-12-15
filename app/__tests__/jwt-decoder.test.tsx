import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import JWTDecoderPage from "../[locale]/jwt-decoder/page";

function createTestJWTToken(): string {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const payload = {
    sub: "1234567890",
    name: "John Doe",
    iat: 1516239022,
  };

  const base64UrlEncode = (obj: Record<string, unknown>): string => {
    const json = JSON.stringify(obj);
    const base64 = Buffer.from(json).toString("base64");
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const signature = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

describe("JWT Decoder Page", () => {
  beforeEach(() => {
    (navigator.clipboard.writeText as jest.Mock).mockClear();
  });

  const TEST_JWT_TOKEN = createTestJWTToken();

  it("renders page title", () => {
    render(<JWTDecoderPage />);

    expect(
      screen.getByRole("heading", { name: "JWT Decoder" })
    ).toBeInTheDocument();
  });

  it("renders JWT input textarea", () => {
    render(<JWTDecoderPage />);

    expect(screen.getByPlaceholderText(/Enter JWT token/)).toBeInTheDocument();
  });

  it("renders decode and clear buttons", () => {
    render(<JWTDecoderPage />);

    expect(screen.getByRole("button", { name: "Decode" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });

  it("shows error for empty input", () => {
    render(<JWTDecoderPage />);

    fireEvent.click(screen.getByRole("button", { name: "Decode" }));

    expect(screen.getByText("Please enter a JWT token")).toBeInTheDocument();
  });

  it("shows error for invalid JWT format", () => {
    render(<JWTDecoderPage />);

    const textarea = screen.getByPlaceholderText(/Enter JWT token/);
    fireEvent.change(textarea, { target: { value: "invalid.jwt" } });
    fireEvent.click(screen.getByRole("button", { name: "Decode" }));

    expect(
      screen.getByText(
        "Invalid JWT format. Expected format: header.payload.signature"
      )
    ).toBeInTheDocument();
  });

  it("decodes valid JWT and displays results", async () => {
    render(<JWTDecoderPage />);

    const textarea = screen.getByPlaceholderText(/Enter JWT token/);
    fireEvent.change(textarea, { target: { value: TEST_JWT_TOKEN } });
    fireEvent.click(screen.getByRole("button", { name: "Decode" }));

    await waitFor(() => {
      expect(screen.getByText("Decoded Data")).toBeInTheDocument();
      expect(screen.getByText("Header")).toBeInTheDocument();
      expect(screen.getByText("Payload")).toBeInTheDocument();
      expect(screen.getByText("Signature")).toBeInTheDocument();
    });
  });

  it("displays decoded header content", async () => {
    render(<JWTDecoderPage />);

    const textarea = screen.getByPlaceholderText(/Enter JWT token/);
    fireEvent.change(textarea, { target: { value: TEST_JWT_TOKEN } });
    fireEvent.click(screen.getByRole("button", { name: "Decode" }));

    await waitFor(() => {
      expect(screen.getByText(/"alg": "HS256"/)).toBeInTheDocument();
      expect(screen.getByText(/"typ": "JWT"/)).toBeInTheDocument();
    });
  });

  it("displays decoded payload content", async () => {
    render(<JWTDecoderPage />);

    const textarea = screen.getByPlaceholderText(/Enter JWT token/);
    fireEvent.change(textarea, { target: { value: TEST_JWT_TOKEN } });
    fireEvent.click(screen.getByRole("button", { name: "Decode" }));

    await waitFor(() => {
      expect(screen.getByText(/"sub": "1234567890"/)).toBeInTheDocument();
      expect(screen.getByText(/"name": "John Doe"/)).toBeInTheDocument();
    });
  });

  it("clears input and results when clear button is clicked", async () => {
    render(<JWTDecoderPage />);

    const textarea = screen.getByPlaceholderText(/Enter JWT token/);
    fireEvent.change(textarea, { target: { value: TEST_JWT_TOKEN } });
    fireEvent.click(screen.getByRole("button", { name: "Decode" }));

    await waitFor(() => {
      expect(screen.getByText("Decoded Data")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(textarea).toHaveValue("");
    expect(screen.queryByText("Decoded Data")).not.toBeInTheDocument();
  });

  it("displays warning about signature verification", async () => {
    render(<JWTDecoderPage />);

    const textarea = screen.getByPlaceholderText(/Enter JWT token/);
    fireEvent.change(textarea, { target: { value: TEST_JWT_TOKEN } });
    fireEvent.click(screen.getByRole("button", { name: "Decode" }));

    await waitFor(() => {
      expect(
        screen.getByText(/This tool decodes JWT tokens without verifying/)
      ).toBeInTheDocument();
    });
  });

  it("allows copying individual sections", async () => {
    render(<JWTDecoderPage />);

    const textarea = screen.getByPlaceholderText(/Enter JWT token/);
    fireEvent.change(textarea, { target: { value: TEST_JWT_TOKEN } });
    fireEvent.click(screen.getByRole("button", { name: "Decode" }));

    await waitFor(() => {
      expect(screen.getByText("Decoded Data")).toBeInTheDocument();
    });

    const copyAllButton = screen.getByRole("button", { name: /Copy All/i });
    await act(async () => {
      fireEvent.click(copyAllButton);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
