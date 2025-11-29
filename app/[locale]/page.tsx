"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { Clock, Dices, Globe, Key, Lock, Type } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("home");

  return (
    <div className="flex flex-1 items-start justify-center py-4 px-4">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          <Link href="/random" className="block">
            <Button
              variant="outline"
              className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <Lock className="w-10 h-10" />
              <span className="text-sm">{t("passwordGenerator")}</span>
            </Button>
          </Link>
          <Link href="/random-integer" className="block">
            <Button
              variant="outline"
              className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <Dices className="w-10 h-10" />
              <span className="text-sm">{t("randomIntegerGenerator")}</span>
            </Button>
          </Link>
          <Link href="/dummy-text" className="block">
            <Button
              variant="outline"
              className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <Type className="w-10 h-10" />
              <span className="text-sm">{t("dummyTextGenerator")}</span>
            </Button>
          </Link>
          <Link href="/show-gip" className="block">
            <Button
              variant="outline"
              className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <Globe className="w-10 h-10" />
              <span className="text-sm">{t("showGlobalIP")}</span>
            </Button>
          </Link>
          <Link href="/jwt-decoder" className="block">
            <Button
              variant="outline"
              className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <Key className="w-10 h-10" />
              <span className="text-sm">{t("jwtDecoder")}</span>
            </Button>
          </Link>
          <Link href="/time-zone-converter" className="block">
            <Button
              variant="outline"
              className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <Clock className="w-10 h-10" />
              <span className="text-sm">{t("timeZoneConverter")}</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
