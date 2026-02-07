"use client";

import { SHELL_KNOWLEDGE } from "@/lib/data/shell-knowledge";
import { KnowledgeTemplate } from "./KnowledgeTemplate";

export function ShellKnowledge() {
  return <KnowledgeTemplate config={{ items: SHELL_KNOWLEDGE }} />;
}
