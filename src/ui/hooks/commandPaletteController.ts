export interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
}

export function filterCommands(commands: Command[], query: string): Command[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return commands;
  return commands.filter((cmd) => cmd.label.toLowerCase().includes(normalized));
}

export class CommandPaletteController {
  isOpen = false;
  query = "";
  commands: Command[] = [];
  selectedIndex = 0;

  constructor(commands: Command[] = []) {
    this.commands = commands;
  }

  open(): void {
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
    this.query = "";
    this.selectedIndex = 0;
  }

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  registerCommand(command: Command): () => void {
    if (!this.commands.some((c) => c.id === command.id)) {
      this.commands.push(command);
    }
    return () => {
      this.commands = this.commands.filter((c) => c.id !== command.id);
    };
  }

  unregisterCommand(id: string): void {
    this.commands = this.commands.filter((c) => c.id !== id);
  }

  setQuery(query: string): void {
    this.query = query;
    this.selectedIndex = 0;
  }

  get filteredCommands(): Command[] {
    return filterCommands(this.commands, this.query);
  }

  selectNext(): void {
    const count = this.filteredCommands.length;
    this.selectedIndex = count === 0 ? 0 : (this.selectedIndex + 1) % count;
  }

  selectPrevious(): void {
    const count = this.filteredCommands.length;
    this.selectedIndex = count === 0 ? 0 : (this.selectedIndex - 1 + count) % count;
  }

  executeSelected(): boolean {
    const command = this.filteredCommands[this.selectedIndex];
    if (!command) return false;
    command.action();
    this.close();
    return true;
  }
}
