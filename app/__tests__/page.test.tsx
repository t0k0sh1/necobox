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
    expect(screen.getByText("Japanese Era Converter")).toBeInTheDocument();
    expect(screen.getByText("Age Calculator")).toBeInTheDocument();
    expect(screen.getByText("IP/Hostname Info")).toBeInTheDocument();
    expect(screen.getByText("Service Status")).toBeInTheDocument();
    expect(screen.getByText("Text Viewer")).toBeInTheDocument();
    expect(screen.getByText("JSON Editor")).toBeInTheDocument();
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
    expect(screen.getByText("Service Status").closest("a")).toHaveAttribute(
      "href",
      "/service-status"
    );
    expect(screen.getByText("Text Viewer").closest("a")).toHaveAttribute(
      "href",
      "/text-viewer"
    );
    expect(screen.getByText("CSV Editor").closest("a")).toHaveAttribute(
      "href",
      "/csv-editor"
    );
    expect(
      screen.getByText("Japanese Era Converter").closest("a")
    ).toHaveAttribute("href", "/wareki-converter");
    expect(screen.getByText("Age Calculator").closest("a")).toHaveAttribute(
      "href",
      "/age-calculator"
    );
    expect(screen.getByText("JSON Editor").closest("a")).toHaveAttribute(
      "href",
      "/json-editor"
    );
  });

  it("renders 14 tool buttons", () => {
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(14);
  });

  it("displays buttons with correct styling", () => {
    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toHaveClass("h-32");
    });
  });
});
