import { render, screen } from "@testing-library/react";
import Home from "../[locale]/page";

// Mock next/link
jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("Home Page", () => {
  beforeEach(() => {
    render(<Home />);
  });

  it("renders all tool links", () => {
    expect(screen.getByText("Password Generator")).toBeInTheDocument();
    expect(screen.getByText("Random Integer Generator")).toBeInTheDocument();
    expect(screen.getByText("Dummy Text Generator")).toBeInTheDocument();
    expect(screen.getByText("Show Global IP")).toBeInTheDocument();
    expect(screen.getByText("JWT Decoder")).toBeInTheDocument();
    expect(screen.getByText("Time Zone Converter")).toBeInTheDocument();
    expect(screen.getByText("Image Format Converter")).toBeInTheDocument();
    expect(screen.getByText("IP/Hostname Info")).toBeInTheDocument();
  });

  it("has correct links for each tool", () => {
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
    expect(
      screen.getByText("Time Zone Converter").closest("a")
    ).toHaveAttribute("href", "/time-zone-converter");
    expect(
      screen.getByText("Image Format Converter").closest("a")
    ).toHaveAttribute("href", "/image-converter");
    expect(screen.getByText("IP/Hostname Info").closest("a")).toHaveAttribute(
      "href",
      "/ip-info"
    );
  });

  it("renders 8 tool buttons", () => {
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(8);
  });

  it("displays buttons with correct styling", () => {
    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toHaveClass("h-32");
    });
  });
});
