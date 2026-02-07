"use client";

import { JAVA_STREAM_KNOWLEDGE } from "@/lib/data/java-stream-knowledge";
import { KnowledgeTemplate } from "./KnowledgeTemplate";

export function JavaStreamKnowledge() {
  return <KnowledgeTemplate config={{ items: JAVA_STREAM_KNOWLEDGE }} />;
}
