export interface NativeLibrary {
  dialogOpen(title: string, defaultPath: string, extensions: string, allowMultiple: boolean, output: Uint8Array, length: number): number;
  dialogSave(title: string, defaultPath: string, extensions: string, output: Uint8Array, length: number): number;
  clipboardRead(output: Uint8Array, length: number): number;
  clipboardWrite(text: string): number;
}

export interface NativeDialogOptions {
  title?: string;
  defaultPath?: string;
  allowedExtensions?: readonly string[];
  allowMultiple?: boolean;
}

const decoder = new TextDecoder();
const BUFFER_SIZE = 16 * 1024;
let mockClipboard: string | null = null;

function decodeOutput(output: Uint8Array, length: number): string | null {
  if (length <= 0 || length > output.length) return null;
  return decoder.decode(output.subarray(0, length));
}

function mockPath(options: NativeDialogOptions, fileName: string): string {
  const base = options.defaultPath?.replace(/[\\/]+$/, "") || ".";
  const extension = options.allowedExtensions?.[0] || "txt";
  return `${base}/${fileName}.${extension}`;
}

export class NativeDialogs {
  constructor(private readonly library?: NativeLibrary) {}

  open(options: NativeDialogOptions = {}): string[] | null {
    if (!this.library) return [mockPath(options, "mock-selected-file")];
    const output = new Uint8Array(BUFFER_SIZE);
    const result = this.library.dialogOpen(options.title ?? "Select a file", options.defaultPath ?? "", (options.allowedExtensions ?? []).join(","), options.allowMultiple ?? false, output, output.length);
    const paths = decodeOutput(output, result);
    return paths ? paths.split("\n").filter(Boolean) : null;
  }

  save(options: NativeDialogOptions = {}): string | null {
    if (!this.library) return mockPath(options, "mock-saved-file");
    const output = new Uint8Array(BUFFER_SIZE);
    const result = this.library.dialogSave(options.title ?? "Save file", options.defaultPath ?? "", (options.allowedExtensions ?? []).join(","), output, output.length);
    return decodeOutput(output, result);
  }
}

export class NativeClipboard {
  constructor(private readonly library?: NativeLibrary) {}

  readText(): string | null {
    if (!this.library) return mockClipboard;
    const output = new Uint8Array(BUFFER_SIZE);
    return decodeOutput(output, this.library.clipboardRead(output, output.length));
  }

  writeText(text: string): boolean {
    if (!this.library) {
      mockClipboard = text;
      return true;
    }
    return this.library.clipboardWrite(text) === 0;
  }
}
