import { useEffect, useRef } from "react";
import { useCommandPalette, type Command } from "../hooks/commandPaletteController.js";

interface CommandPaletteProps {
  commands?: Command[];
  onClose?: () => void;
}

export function CommandPalette({ commands = [], onClose }: CommandPaletteProps) {
  const {
    isOpen,
    query,
    setQuery,
    filteredCommands,
    selectedIndex,
    registerCommand,
    unregisterCommand,
    selectNext,
    selectPrevious,
    executeSelected,
    close,
  } = useCommandPalette({ initialCommands: commands });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    commands.forEach((cmd) => registerCommand(cmd));
    return () => {
      commands.forEach((cmd) => unregisterCommand(cmd.id));
    };
  }, [commands, registerCommand, unregisterCommand]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        // Toggle handled by parent; this component just renders when open.
      }
      if (!isOpen) return;

      if (event.key === "Escape") {
        close();
        onClose?.();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        selectNext();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        selectPrevious();
      } else if (event.key === "Enter") {
        event.preventDefault();
        executeSelected();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close, onClose, selectNext, selectPrevious, executeSelected]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Command palette"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "10vh",
        zIndex: 1000,
      }}
      onClick={() => {
        close();
        onClose?.();
      }}
    >
      <div
        style={{
          backgroundColor: "#1a1a1a",
          borderRadius: "8px",
          width: "560px",
          maxWidth: "90vw",
          boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command..."
          style={{
            width: "100%",
            padding: "16px",
            border: "none",
            backgroundColor: "transparent",
            color: "#fff",
            fontSize: "16px",
            outline: "none",
          }}
        />
        <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: "320px", overflow: "auto" }}>
          {filteredCommands.map((cmd, index) => (
            <li
              key={cmd.id}
              onClick={() => {
                cmd.action();
                close();
                onClose?.();
              }}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                backgroundColor: index === selectedIndex ? "#333" : "transparent",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <kbd style={{ fontSize: "12px", color: "#888" }}>{cmd.shortcut}</kbd>
              )}
            </li>
          ))}
          {filteredCommands.length === 0 && (
            <li style={{ padding: "16px", color: "#888" }}>No commands found.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
