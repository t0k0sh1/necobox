"use client";

import { usePathname, useRouter } from "@/i18n/routing";
import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = React.useCallback(
    (newLocale: string) => {
      try {
        router.replace(pathname, { locale: newLocale });
      } catch (error) {
        console.error("Error changing locale:", error);
        // Fallback to window.location if router fails
        const currentPath = window.location.pathname;
        const newPath = currentPath.replace(`/${locale}`, `/${newLocale}`);
        window.location.href = newPath;
      }
    },
    [router, pathname, locale]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Toggle language">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleLocaleChange("en")}
          className={locale === "en" ? "bg-accent" : ""}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLocaleChange("ja")}
          className={locale === "ja" ? "bg-accent" : ""}
        >
          日本語
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
