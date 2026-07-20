import type { DocumentBlock, DocumentContent } from "../documents/types.js";
import type { ProtectedRange, ProtectedRangeKind } from "./types.js";

const DETECTORS: readonly [ProtectedRangeKind, RegExp][] = [
  ["link", /https?:\/\/[^\s)>\]]+/g],
  ["citation", /\[(?:\d+(?:\s*,\s*\d+)*)\]|\([A-Z][A-Za-z-]+,\s*\d{4}\)/g],
  ["name", /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g],
  ["number", /\b\d+(?:[.,]\d+)?%?\b/g],
];

export interface UserProtectedRange {
  readonly blockIndex: number;
  readonly start: number;
  readonly end: number;
  readonly authorized?: boolean;
}

function textForBlock(block: DocumentBlock): string {
  if (block.type === "list") return block.items.join("\n");
  if (block.type === "table") return block.rows.map((row) => row.join(" | ")).join("\n");
  if (block.type === "attachment") return block.caption ?? "";
  return block.text;
}

function range(blockIndex: number, start: number, end: number, kind: ProtectedRangeKind, text: string, authorized = false): ProtectedRange {
  return { blockIndex, start, end, kind, text, authorized };
}

/** Finds values which should not be changed by a rewrite without explicit approval. */
export function detectProtectedRanges(content: DocumentContent, terminology: readonly string[] = []): readonly ProtectedRange[] {
  const found: ProtectedRange[] = [];
  content.blocks.forEach((block, blockIndex) => {
    if (block.type === "attachment") return;
    const text = textForBlock(block);
    for (const [kind, detector] of DETECTORS) {
      detector.lastIndex = 0;
      for (let match = detector.exec(text); match !== null; match = detector.exec(text)) {
        found.push(range(blockIndex, match.index, match.index + match[0].length, kind, match[0]));
      }
    }
    for (const term of terminology.filter((candidate) => candidate.length > 0)) {
      let start = text.indexOf(term);
      while (start !== -1) {
        found.push(range(blockIndex, start, start + term.length, "terminology", term));
        start = text.indexOf(term, start + term.length);
      }
    }
  });
  return uniqueRanges(found);
}

/** Converts a user selection into a verified, block-local protected range. */
export function createUserProtectedRange(content: DocumentContent, selection: UserProtectedRange): ProtectedRange {
  const block = content.blocks[selection.blockIndex];
  if (block === undefined || block.type === "attachment") throw new Error("Protected ranges must refer to an editable block.");
  const text = textForBlock(block);
  if (!Number.isInteger(selection.start) || !Number.isInteger(selection.end) || selection.start < 0 || selection.end <= selection.start || selection.end > text.length) {
    throw new Error("Protected range is outside the selected block.");
  }
  return range(selection.blockIndex, selection.start, selection.end, "user", text.slice(selection.start, selection.end), selection.authorized ?? false);
}

export function uniqueRanges(ranges: readonly ProtectedRange[]): readonly ProtectedRange[] {
  const seen = new Set<string>();
  return ranges.filter((item) => {
    const key = `${item.blockIndex}:${item.start}:${item.end}:${item.kind}:${item.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((left, right) => left.blockIndex - right.blockIndex || left.start - right.start || left.end - right.end);
}
