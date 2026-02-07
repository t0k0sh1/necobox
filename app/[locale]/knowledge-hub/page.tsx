"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/routing";
import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

const GitKnowledge = dynamic(
  () =>
    import("@/app/components/GitKnowledge").then((mod) => mod.GitKnowledge),
  { ssr: false }
);

export default function KnowledgeHubPage() {
  const t = useTranslations("knowledgeHub");

  return (
    <div className="flex h-full items-start justify-center py-4 px-4">
      <div className="w-full max-w-4xl">
        <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
        <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border mt-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">{t("title")}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("description")}
            </p>
          </div>

          {/* チートシートへの相互リンクバナー */}
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">
              {t("relatedCheatsheets")}{" "}
              <Link
                href="/cheatsheets"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {t("viewCheatsheets")}
              </Link>
            </span>
          </div>

          <Tabs defaultValue="git">
            <TabsList className="w-full">
              <TabsTrigger value="git" className="font-bold text-base">
                {t("tabs.git")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="git" className="mt-4">
              <GitKnowledge />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
