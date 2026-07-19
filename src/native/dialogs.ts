import { NativeDialogs, type NativeDialogOptions } from "./bridge.js";

export interface DialogOptions extends NativeDialogOptions {}

export class DialogService {
  constructor(private readonly dialogs = new NativeDialogs()) {}

  openFile(options: DialogOptions = {}): string[] | null {
    return this.dialogs.open(options);
  }

  saveFile(options: DialogOptions = {}): string | null {
    return this.dialogs.save(options);
  }

  openDirectory(options: Omit<DialogOptions, "allowedExtensions"> = {}): string[] | null {
    return this.dialogs.open({ ...options, allowedExtensions: [] });
  }
}
