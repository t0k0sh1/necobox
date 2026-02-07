"use client";

import { GitCheatsheet } from "@/app/components/GitCheatsheet";
import { HttpStatusCheatsheet } from "@/app/components/HttpStatusCheatsheet";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";

export default function CheatsheetsPage() {
  const t = useTranslations("cheatsheets");

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

          <Tabs defaultValue="httpStatus">
            <TabsList className="w-full">
              <TabsTrigger value="httpStatus" className="flex-1">
                {t("tabs.httpStatus")}
              </TabsTrigger>
              <TabsTrigger value="gitCommands" className="flex-1">
                {t("tabs.gitCommands")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="httpStatus" className="mt-4">
              <HttpStatusCheatsheet />
            </TabsContent>
            <TabsContent value="gitCommands" className="mt-4">
              <GitCheatsheet />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
