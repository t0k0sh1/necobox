"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

const HttpStatusCheatsheet = dynamic(
  () =>
    import("@/app/components/HttpStatusCheatsheet").then(
      (mod) => mod.HttpStatusCheatsheet
    ),
  { ssr: false }
);
const HttpHeaderCheatsheet = dynamic(
  () =>
    import("@/app/components/HttpHeaderCheatsheet").then(
      (mod) => mod.HttpHeaderCheatsheet
    ),
  { ssr: false }
);
const MimeTypeCheatsheet = dynamic(
  () =>
    import("@/app/components/MimeTypeCheatsheet").then(
      (mod) => mod.MimeTypeCheatsheet
    ),
  { ssr: false }
);
const GitCheatsheet = dynamic(
  () =>
    import("@/app/components/GitCheatsheet").then(
      (mod) => mod.GitCheatsheet
    ),
  { ssr: false }
);
const DockerCheatsheet = dynamic(
  () =>
    import("@/app/components/DockerCheatsheet").then(
      (mod) => mod.DockerCheatsheet
    ),
  { ssr: false }
);
const ShellCheatsheet = dynamic(
  () =>
    import("@/app/components/ShellCheatsheet").then(
      (mod) => mod.ShellCheatsheet
    ),
  { ssr: false }
);
const SqlCheatsheet = dynamic(
  () =>
    import("@/app/components/SqlCheatsheet").then(
      (mod) => mod.SqlCheatsheet
    ),
  { ssr: false }
);
const MarkdownCheatsheet = dynamic(
  () =>
    import("@/app/components/MarkdownCheatsheet").then(
      (mod) => mod.MarkdownCheatsheet
    ),
  { ssr: false }
);

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

          <Tabs defaultValue="webApi">
            <TabsList className="w-full">
              <TabsTrigger value="webApi" className="font-bold text-base">
                {t("categories.webApi")}
              </TabsTrigger>
              <TabsTrigger value="commandLine" className="font-bold text-base">
                {t("categories.commandLine")}
              </TabsTrigger>
              <TabsTrigger value="languageMarkup" className="font-bold text-base">
                {t("categories.languageMarkup")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="webApi" className="mt-4">
              <Tabs defaultValue="httpStatus">
                <TabsList className="w-full flex overflow-x-auto">
                  <TabsTrigger value="httpStatus" className="shrink-0 px-3">
                    {t("tabs.httpStatus")}
                  </TabsTrigger>
                  <TabsTrigger value="httpHeaders" className="shrink-0 px-3">
                    {t("tabs.httpHeaders")}
                  </TabsTrigger>
                  <TabsTrigger value="mimeTypes" className="shrink-0 px-3">
                    {t("tabs.mimeTypes")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="httpStatus" className="mt-4">
                  <HttpStatusCheatsheet />
                </TabsContent>
                <TabsContent value="httpHeaders" className="mt-4">
                  <HttpHeaderCheatsheet />
                </TabsContent>
                <TabsContent value="mimeTypes" className="mt-4">
                  <MimeTypeCheatsheet />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="commandLine" forceMount className="mt-4 data-[state=inactive]:hidden">
              <Tabs defaultValue="gitCommands">
                <TabsList className="w-full flex overflow-x-auto">
                  <TabsTrigger value="gitCommands" className="shrink-0 px-3">
                    {t("tabs.gitCommands")}
                  </TabsTrigger>
                  <TabsTrigger value="dockerCommands" className="shrink-0 px-3">
                    {t("tabs.dockerCommands")}
                  </TabsTrigger>
                  <TabsTrigger value="shellCommands" className="shrink-0 px-3">
                    {t("tabs.shellCommands")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="gitCommands" className="mt-4">
                  <GitCheatsheet />
                </TabsContent>
                <TabsContent value="dockerCommands" className="mt-4">
                  <DockerCheatsheet />
                </TabsContent>
                <TabsContent value="shellCommands" className="mt-4">
                  <ShellCheatsheet />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="languageMarkup" forceMount className="mt-4 data-[state=inactive]:hidden">
              <Tabs defaultValue="sqlSyntax">
                <TabsList className="w-full flex overflow-x-auto">
                  <TabsTrigger value="sqlSyntax" className="shrink-0 px-3">
                    {t("tabs.sqlSyntax")}
                  </TabsTrigger>
                  <TabsTrigger value="markdownSyntax" className="shrink-0 px-3">
                    {t("tabs.markdownSyntax")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="sqlSyntax" className="mt-4">
                  <SqlCheatsheet />
                </TabsContent>
                <TabsContent value="markdownSyntax" className="mt-4">
                  <MarkdownCheatsheet />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
