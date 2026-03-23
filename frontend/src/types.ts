export type BlockType = "text" | "entity" | "spacer" | "markdown";

export interface BaseBlock {
  id: string;
  type: BlockType;
  title?: string;
}

export interface StripBlock extends BaseBlock {
  /** Порядок слева направо в шапке/подвале */
  order: number;
  entityId?: string;
  content?: string;
}

export interface GridBlock extends BaseBlock {
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  /** entity_id для type === "entity" */
  entityId?: string;
  /** текст / markdown */
  content?: string;
}

export interface LayoutDoc {
  version: number;
  theme: { density: string; accent: string };
  header: { enabled: boolean; heightPx: number; blocks: StripBlock[] };
  body: {
    columns: number;
    rowHeightPx: number;
    gapPx: number;
    blocks: GridBlock[];
  };
  footer: { enabled: boolean; heightPx: number; blocks: StripBlock[] };
}

export function newId(): string {
  return crypto.randomUUID();
}

export const defaultLayout = (): LayoutDoc => ({
  version: 1,
  theme: { density: "comfortable", accent: "#03a9f4" },
  header: { enabled: true, heightPx: 56, blocks: [] },
  body: { columns: 12, rowHeightPx: 72, gapPx: 8, blocks: [] },
  footer: { enabled: false, heightPx: 48, blocks: [] },
});
