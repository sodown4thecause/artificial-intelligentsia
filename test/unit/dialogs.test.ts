import assert from "node:assert/strict";
import test from "node:test";
import { NativeDialogs, type NativeLibrary } from "../../src/native/bridge.js";
import { DialogService } from "../../src/native/dialogs.js";

test("dialog service can be called and returns fallback paths", () => {
  const paths = new DialogService().openFile({ defaultPath: "/workspace", allowedExtensions: ["md"] });
  assert.deepEqual(paths, ["/workspace/mock-selected-file.md"]);
});

test("dialog extensions are passed to the native bridge", () => {
  let receivedExtensions = "";
  const library: NativeLibrary = {
    dialogOpen(_title, _path, extensions, _multiple, output) { receivedExtensions = extensions; output.set(new TextEncoder().encode("/tmp/note.md")); return 12; },
    dialogSave() { return 0; },
    clipboardRead() { return 0; },
    clipboardWrite() { return 0; },
  };
  assert.deepEqual(new NativeDialogs(library).open({ allowedExtensions: ["md", "txt"] }), ["/tmp/note.md"]);
  assert.equal(receivedExtensions, "md,txt");
});
