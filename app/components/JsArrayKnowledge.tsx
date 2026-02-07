"use client";

import { JS_ARRAY_KNOWLEDGE } from "@/lib/data/js-array-knowledge";
import { KnowledgeTemplate } from "./KnowledgeTemplate";

export function JsArrayKnowledge() {
  return <KnowledgeTemplate config={{ items: JS_ARRAY_KNOWLEDGE }} />;
}
