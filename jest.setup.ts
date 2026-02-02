import "@testing-library/jest-dom";
import React from "react";

// Polyfill TextEncoder/TextDecoder for jsdom
import { TextDecoder, TextEncoder } from "util";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => "",
}));

// Mock next-intl
import enMessages from "./messages/en.json";

type Messages = typeof enMessages;
type MessageValue = string | Record<string, unknown>;

jest.mock("next-intl", () => {
  const actualMessages: Messages = enMessages;
  return {
    useTranslations: (namespace?: string) => {
      const messages = namespace
        ? (actualMessages[namespace as keyof Messages] as Record<
            string,
            MessageValue
          >)
        : (actualMessages as Record<string, MessageValue>);
      return (key: string, values?: Record<string, string | number>) => {
        // Handle nested keys like "error.enterToken"
        const keys = key.split(".");
        let value: MessageValue = messages;
        for (const k of keys) {
          if (value && typeof value === "object" && k in value) {
            value = value[k] as MessageValue;
          } else {
            return key; // Return key if not found
          }
        }
        // Handle interpolation if values are provided
        if (values && typeof value === "string") {
          return value.replace(/\{(\w+)\}/g, (match, key) => {
            return values[key] !== undefined ? String(values[key]) : match;
          });
        }
        return typeof value === "string" ? value : key;
      };
    },
    useLocale: () => "en",
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
      children,
  };
});

jest.mock("next-intl/server", () => ({
  getMessages: jest.fn().mockResolvedValue({}),
  getRequestConfig: jest.fn((fn) => fn),
}));

jest.mock("next-intl/routing", () => ({
  defineRouting: jest.fn(() => ({
    locales: ["en", "ja"],
    defaultLocale: "en",
  })),
}));

jest.mock("next-intl/navigation", () => ({
  createNavigation: jest.fn(() => ({
    Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
      React.createElement("a", { href }, children),
    redirect: jest.fn(),
    usePathname: jest.fn(() => ""),
    useRouter: jest.fn(() => ({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    })),
  })),
}));

// Mock clipboard API
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(""),
  },
  writable: true,
});
