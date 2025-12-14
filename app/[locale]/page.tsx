"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import {
  ArrowRightLeft,
  Clock,
  Dices,
  Globe,
  Image,
  Key,
  Lock,
  Search,
  Sparkles,
  Type,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("home");

  return (
    <div className="flex flex-1 items-start justify-center py-4 px-4">
      <div className="w-full max-w-6xl space-y-8">
        {/* 生成ツール */}
        <section className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-white dark:bg-gray-950">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {t("sectionGenerators")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            <Link href="/random" className="block">
              <Button
                variant="outline"
                className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <Lock className="size-10" />
                <span className="text-sm">{t("passwordGenerator")}</span>
              </Button>
            </Link>
            <Link href="/random-integer" className="block">
              <Button
                variant="outline"
                className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <Dices className="size-10" />
                <span className="text-sm">{t("randomIntegerGenerator")}</span>
              </Button>
            </Link>
            <Link href="/dummy-text" className="block">
              <Button
                variant="outline"
                className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <Type className="size-10" />
                <span className="text-sm">{t("dummyTextGenerator")}</span>
              </Button>
            </Link>
          </div>
        </section>

        {/* 変換ツール */}
        <section className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-white dark:bg-gray-950">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            {t("sectionConverters")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            <Link href="/time-zone-converter" className="block">
              <Button
                variant="outline"
                className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <Clock className="size-10" />
                <span className="text-sm">{t("timeZoneConverter")}</span>
              </Button>
            </Link>
            <Link href="/image-converter" className="block">
              <Button
                variant="outline"
                className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <Image className="size-10" />
                <span className="text-sm">{t("imageConverter")}</span>
              </Button>
            </Link>
          </div>
        </section>

        {/* 解析・情報ツール */}
        <section className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-white dark:bg-gray-950">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Search className="w-5 h-5" />
            {t("sectionAnalyzers")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            <Link href="/jwt-decoder" className="block">
              <Button
                variant="outline"
                className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <Key className="size-10" />
                <span className="text-sm">{t("jwtDecoder")}</span>
              </Button>
            </Link>
            <Link href="/show-gip" className="block">
              <Button
                variant="outline"
                className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <Globe className="size-10" />
                <span className="text-sm">{t("showGlobalIP")}</span>
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
