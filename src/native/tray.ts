import { NativeTray } from "./bridge.js";

export interface TrayMenuItem {
  label: string;
  callback: () => void;
}

export interface TrayServiceOptions {
  iconPath?: string;
  tooltip?: string;
  nativeTray?: NativeTray;
  onOpen?: () => void;
  onPendingApprovals?: () => void;
  onSettings?: () => void;
  onQuit?: () => void;
}

export class TrayService {
  private readonly nativeTray: NativeTray;
  private readonly iconPath: string;
  private tooltip: string;
  private visible = false;
  private readonly menuItems: TrayMenuItem[];

  constructor(options: TrayServiceOptions = {}) {
    this.nativeTray = options.nativeTray ?? new NativeTray();
    this.iconPath = options.iconPath ?? "";
    this.tooltip = options.tooltip ?? "Creature OS";
    this.menuItems = [
      { label: "Open Creature", callback: options.onOpen ?? (() => {}) },
      { label: "Pending Approvals", callback: options.onPendingApprovals ?? (() => {}) },
      { label: "Settings", callback: options.onSettings ?? (() => {}) },
      { label: "Quit", callback: options.onQuit ?? (() => {}) },
    ];
  }

  show(): void {
    this.nativeTray.show(this.iconPath, this.tooltip);
    this.visible = true;
  }

  hide(): void {
    this.nativeTray.hide();
    this.visible = false;
  }

  setTooltip(text: string): void {
    this.nativeTray.setTooltip(text);
    this.tooltip = text;
  }

  addMenuItem(label: string, callback: () => void): void {
    this.menuItems.push({ label, callback });
  }

  getMenuItems(): readonly TrayMenuItem[] {
    return this.menuItems;
  }

  isVisible(): boolean {
    return this.visible;
  }

  getTooltip(): string {
    return this.tooltip;
  }
}
