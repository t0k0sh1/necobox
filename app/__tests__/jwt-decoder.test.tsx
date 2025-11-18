import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import JWTDecoderPage from "../jwt-decoder/page";

describe("JWT Decoder Page", () => {
  beforeEach(() => {
    (navigator.clipboard.writeText as jest.Mock).mockClear();
  });

  // Sample valid JWT for testing
  const validJWT =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

  it("renders page title", () => {
    render(<JWTDecoderPage />);

    expect(screen.getByRole("heading", { name: "JWT Decoder" })).toBeInTheDocument();
  });

  it("renders JWT input textarea", () => {
    render(<JWTDecoderPage />);

    expect(
      screen.getByPlaceholderText(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/)
    ).toBeInTheDocument();
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

    const textarea = screen.getByPlaceholderText(
      /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/
    );
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

    const textarea = screen.getByPlaceholderText(
      /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/
    );
    fireEvent.change(textarea, { target: { value: validJWT } });
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

    const textarea = screen.getByPlaceholderText(
      /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/
    );
    fireEvent.change(textarea, { target: { value: validJWT } });
    fireEvent.click(screen.getByRole("button", { name: "Decode" }));

    await waitFor(() => {
      expect(screen.getByText(/"alg": "HS256"/)).toBeInTheDocument();
      expect(screen.getByText(/"typ": "JWT"/)).toBeInTheDocument();
    });
  });

  it("displays decoded payload content", async () => {
    render(<JWTDecoderPage />);

    const textarea = screen.getByPlaceholderText(
      /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/
    );
    fireEvent.change(textarea, { target: { value: validJWT } });
    fireEvent.click(screen.getByRole("button", { name: "Decode" }));

    await waitFor(() => {
      expect(screen.getByText(/"sub": "1234567890"/)).toBeInTheDocument();
      expect(screen.getByText(/"name": "John Doe"/)).toBeInTheDocument();
    });
  });

  it("clears input and results when clear button is clicked", async () => {
    render(<JWTDecoderPage />);

    const textarea = screen.getByPlaceholderText(
      /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/
    );
    fireEvent.change(textarea, { target: { value: validJWT } });
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

    const textarea = screen.getByPlaceholderText(
      /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/
    );
    fireEvent.change(textarea, { target: { value: validJWT } });
    fireEvent.click(screen.getByRole("button", { name: "Decode" }));

    await waitFor(() => {
      expect(
        screen.getByText(/This tool decodes JWT tokens without verifying/)
      ).toBeInTheDocument();
    });
  });

  it("allows copying individual sections", async () => {
    render(<JWTDecoderPage />);

    const textarea = screen.getByPlaceholderText(
      /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/
    );
    fireEvent.change(textarea, { target: { value: validJWT } });
    fireEvent.click(screen.getByRole("button", { name: "Decode" }));

    await waitFor(() => {
      expect(screen.getByText("Decoded Data")).toBeInTheDocument();
    });

    const copyAllButton = screen.getByRole("button", { name: /Copy All/i });
    fireEvent.click(copyAllButton);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
