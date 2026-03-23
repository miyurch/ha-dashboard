import type { LayoutDoc } from "./types";

/** Уникальные `entity_id` из всех блоков типа `entity`. */
export function collectEntityIds(doc: LayoutDoc): string[] {
  const out = new Set<string>();
  for (const b of doc.header.blocks) {
    if (b.type === "entity" && b.entityId?.trim()) out.add(b.entityId.trim());
  }
  for (const b of doc.footer.blocks) {
    if (b.type === "entity" && b.entityId?.trim()) out.add(b.entityId.trim());
  }
  for (const b of doc.body.blocks) {
    if (b.type === "entity" && b.entityId?.trim()) out.add(b.entityId.trim());
  }
  return [...out].sort();
}
