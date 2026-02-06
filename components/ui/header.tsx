"use client";

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ModeToggle } from "./mode-toggle";
import { LanguageToggle } from "./language-toggle";
import { ToolNavigationMenu } from "./tool-navigation-menu";

export function Header() {
  const t = useTranslations('common');

  return (
    <header className="w-full border-b bg-white dark:bg-black sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ToolNavigationMenu />
          <Link href="/" className="text-2xl font-semibold hover:opacity-70 transition-opacity">
            {t('siteName')}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
