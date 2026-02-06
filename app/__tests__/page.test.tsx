import { render, screen, fireEvent } from "@testing-library/react";
import Home from "../[locale]/page";

// localStorage モック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

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
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
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
    expect(screen.getByText("ToDo")).toBeInTheDocument();
    expect(screen.getByText("Cheatsheets")).toBeInTheDocument();
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
    expect(screen.getByText("ToDo").closest("a")).toHaveAttribute(
      "href",
      "/matrix-todo"
    );
    expect(screen.getByText("Cheatsheets").closest("a")).toHaveAttribute(
      "href",
      "/cheatsheets"
    );
  });

  it("renders 16 tool links", () => {
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(16);
  });

  it("renders 16 pin toggle buttons", () => {
    const pinButtons = screen.getAllByRole("button");
    expect(pinButtons).toHaveLength(16);
  });

  it("renders 7 category sections", () => {
    expect(screen.getByText("Random Generation")).toBeInTheDocument();
    expect(screen.getByText("Conversion & Calculation")).toBeInTheDocument();
    expect(screen.getByText("Data Editors")).toBeInTheDocument();
    expect(screen.getByText("Task Management")).toBeInTheDocument();
    expect(screen.getByText("Network & Security")).toBeInTheDocument();
    expect(screen.getByText("Viewers")).toBeInTheDocument();
    expect(screen.getByText("References")).toBeInTheDocument();
  });
});

describe("Home Page - Pinned Section", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("ピン留めがある場合にセクションを表示する", () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === "necobox-pinned-tools") {
        return JSON.stringify(["random"]);
      }
      return null;
    });

    render(<Home />);
    expect(screen.getByText("Pinned")).toBeInTheDocument();
  });

  it("ピン留めがない場合にセクションを非表示にする", () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(<Home />);
    expect(screen.queryByText("Pinned")).not.toBeInTheDocument();
  });
});

describe("Home Page - Recent Section", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("使用履歴がある場合にセクションを表示する", () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === "necobox-recent-tools") {
        return JSON.stringify(["random"]);
      }
      return null;
    });

    render(<Home />);
    expect(screen.getByText("Recently Used")).toBeInTheDocument();
  });

  it("使用履歴がない場合にセクションを非表示にする", () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(<Home />);
    expect(screen.queryByText("Recently Used")).not.toBeInTheDocument();
  });
});

describe("Home Page - Pin Toggle", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  it("ピンボタンクリックでピン留めされる", () => {
    render(<Home />);

    // "Pin" aria-label のボタンを取得（最初のもの）
    const pinButtons = screen.getAllByLabelText("Pin");
    fireEvent.click(pinButtons[0]);

    // localStorage にピン留めが保存される
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "necobox-pinned-tools",
      expect.any(String)
    );
  });
});
