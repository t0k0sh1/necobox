import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToolNavigationMenu } from "../ui/tool-navigation-menu";

// Mock usePathname from i18n/routing
jest.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) => React.createElement("a", { href, onClick }, children),
  usePathname: () => "/random",
}));

// Mock radix-ui Dialog (Sheet の内部実装)
jest.mock("radix-ui", () => ({
  Dialog: {
    Root: ({
      children,
      open,
      onOpenChange,
    }: {
      children: React.ReactNode;
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
    }) =>
      React.createElement(
        "div",
        { "data-slot": "sheet", "data-state": open ? "open" : "closed" },
        React.Children.map(children, (child: React.ReactNode) =>
          React.isValidElement(child)
            ? React.cloneElement(child, {
                "data-open": open,
                onOpenChange,
              } as Record<string, unknown>)
            : child
        )
      ),
    Trigger: ({
      children,
      asChild,
      onOpenChange,
      ...props
    }: {
      children: React.ReactNode;
      asChild?: boolean;
      onOpenChange?: (open: boolean) => void;
    }) => {
      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
          onClick: () => onOpenChange?.(true),
        } as Record<string, unknown>);
      }
      return React.createElement(
        "button",
        { ...props, onClick: () => onOpenChange?.(true) },
        children
      );
    },
    Portal: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", { "data-slot": "portal" }, children),
    Overlay: (props: Record<string, unknown>) =>
      React.createElement("div", { ...props }),
    Content: ({
      children,
      "data-open": dataOpen,
    }: {
      children: React.ReactNode;
      "data-open"?: boolean;
    }) =>
      dataOpen
        ? React.createElement("div", { role: "dialog" }, children)
        : null,
    Title: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
    }) => React.createElement("h2", props, children),
    Description: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
    }) => React.createElement("p", props, children),
    Close: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
    }) => React.createElement("button", props, children),
  },
}));

describe("ToolNavigationMenu", () => {
  it("メニューのトリガーボタンが表示される", () => {
    render(<ToolNavigationMenu />);
    const button = screen.getByLabelText("Tools");
    expect(button).toBeInTheDocument();
  });

  it("メニューを開くとツールリンクが表示される", () => {
    render(<ToolNavigationMenu />);

    fireEvent.click(screen.getByLabelText("Tools"));

    expect(screen.getByText("Password Generator")).toBeInTheDocument();
    expect(screen.getByText("JWT Decoder")).toBeInTheDocument();
    expect(screen.getByText("Time Zone Converter")).toBeInTheDocument();
    expect(screen.getByText("CSV Editor")).toBeInTheDocument();
  });

  it("メニューを開くとカテゴリラベルが表示される", () => {
    render(<ToolNavigationMenu />);

    fireEvent.click(screen.getByLabelText("Tools"));

    expect(screen.getByText("Random Generation")).toBeInTheDocument();
    expect(screen.getByText("Conversion & Calculation")).toBeInTheDocument();
    expect(screen.getByText("Data Editors")).toBeInTheDocument();
    expect(screen.getByText("Task Management")).toBeInTheDocument();
    expect(screen.getByText("Network & Security")).toBeInTheDocument();
    expect(screen.getByText("Viewer")).toBeInTheDocument();
    expect(screen.getByText("References")).toBeInTheDocument();
  });

  it("メニューを開くと16個のツールリンクが表示される", () => {
    render(<ToolNavigationMenu />);

    fireEvent.click(screen.getByLabelText("Tools"));

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(16);
  });

  it("ツールリンクに正しいhrefが設定される", () => {
    render(<ToolNavigationMenu />);

    fireEvent.click(screen.getByLabelText("Tools"));

    expect(
      screen.getByText("Password Generator").closest("a")
    ).toHaveAttribute("href", "/random");
    expect(screen.getByText("JWT Decoder").closest("a")).toHaveAttribute(
      "href",
      "/jwt-decoder"
    );
  });

  it("ナビゲーション要素にaria-labelが設定される", () => {
    render(<ToolNavigationMenu />);

    fireEvent.click(screen.getByLabelText("Tools"));

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("aria-label", "Navigate to other tools");
  });
});
