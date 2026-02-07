"use client";

import { SQL_KNOWLEDGE } from "@/lib/data/sql-knowledge";
import { KnowledgeTemplate } from "./KnowledgeTemplate";

export function SqlKnowledge() {
  return <KnowledgeTemplate config={{ items: SQL_KNOWLEDGE }} />;
}
