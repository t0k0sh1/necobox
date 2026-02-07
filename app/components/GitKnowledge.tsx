"use client";

import { GIT_KNOWLEDGE } from "@/lib/data/git-knowledge";
import { KnowledgeTemplate } from "./KnowledgeTemplate";

export function GitKnowledge() {
  return <KnowledgeTemplate config={{ items: GIT_KNOWLEDGE }} />;
}
