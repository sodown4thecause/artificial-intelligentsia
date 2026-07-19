import { NativeClipboard } from "./bridge.js";

export type DocumentSelection = string | { text?: string; toString(): string };

export class ClipboardService {
  constructor(private readonly clipboard = new NativeClipboard()) {}

  readText(): string | null {
    return this.clipboard.readText();
  }

  writeText(text: string): boolean {
    return this.clipboard.writeText(text);
  }

  copyFromDocument(selection: DocumentSelection): boolean {
    const text = typeof selection === "string" ? selection : (selection.text ?? selection.toString());
    return this.writeText(text);
  }
}
