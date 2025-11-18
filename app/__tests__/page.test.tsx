import { render, screen } from "@testing-library/react";
import Home from "../page";

// Mock next/link
jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("Home Page", () => {
  it("renders all tool links", () => {
    render(<Home />);

    expect(screen.getByText("Password Generator")).toBeInTheDocument();
    expect(screen.getByText("Random Integer Generator")).toBeInTheDocument();
    expect(screen.getByText("Dummy Text Generator")).toBeInTheDocument();
    expect(screen.getByText("Show Global IP")).toBeInTheDocument();
    expect(screen.getByText("JWT Decoder")).toBeInTheDocument();
    expect(screen.getByText("Time Zone Converter")).toBeInTheDocument();
  });

  it("has correct links for each tool", () => {
    render(<Home />);

    expect(screen.getByText("Password Generator").closest("a")).toHaveAttribute(
      "href",
      "/random"
    );
    expect(
      screen.getByText("Random Integer Generator").closest("a")
    ).toHaveAttribute("href", "/random-integer");
    expect(
      screen.getByText("Dummy Text Generator").closest("a")
    ).toHaveAttribute("href", "/dummy-text");
    expect(screen.getByText("Show Global IP").closest("a")).toHaveAttribute(
      "href",
      "/show-gip"
    );
    expect(screen.getByText("JWT Decoder").closest("a")).toHaveAttribute(
      "href",
      "/jwt-decoder"
    );
    expect(screen.getByText("Time Zone Converter").closest("a")).toHaveAttribute(
      "href",
      "/time-zone-converter"
    );
  });

  it("renders 6 tool buttons", () => {
    render(<Home />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(6);
  });

  it("displays buttons with correct styling", () => {
    render(<Home />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toHaveClass("h-32");
    });
  });
});
