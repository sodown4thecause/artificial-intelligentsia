import { useState, useCallback, useMemo } from "react";
import { CommandPaletteController, type Command } from "./commandPaletteController.js";

export { CommandPaletteController, filterCommands, type Command } from "./commandPaletteController.js";

interface UseCommandPaletteOptions {
  initialCommands?: Command[];
}

export function useCommandPalette({ initialCommands = [] }: UseCommandPaletteOptions = {}) {
  const [controller] = useState(() => new CommandPaletteController(initialCommands));
  const [tick, setTick] = useState(0);

  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

  const open = useCallback(() => {
    controller.open();
    forceUpdate();
  }, [controller, forceUpdate]);

  const close = useCallback(() => {
    controller.close();
    forceUpdate();
  }, [controller, forceUpdate]);

  const toggle = useCallback(() => {
    controller.toggle();
    forceUpdate();
  }, [controller, forceUpdate]);

  const setQuery = useCallback((query: string) => {
    controller.setQuery(query);
    forceUpdate();
  }, [controller, forceUpdate]);

  const registerCommand = useCallback((command: Command) => {
    const remove = controller.registerCommand(command);
    forceUpdate();
    return () => {
      remove();
      forceUpdate();
    };
  }, [controller, forceUpdate]);

  const unregisterCommand = useCallback((id: string) => {
    controller.unregisterCommand(id);
    forceUpdate();
  }, [controller, forceUpdate]);

  const selectNext = useCallback(() => {
    controller.selectNext();
    forceUpdate();
  }, [controller, forceUpdate]);

  const selectPrevious = useCallback(() => {
    controller.selectPrevious();
    forceUpdate();
  }, [controller, forceUpdate]);

  const executeSelected = useCallback(() => {
    const executed = controller.executeSelected();
    if (executed) forceUpdate();
    return executed;
  }, [controller, forceUpdate]);

  const filteredCommands = useMemo(() => controller.filteredCommands, [controller, tick]);

  return {
    isOpen: controller.isOpen,
    query: controller.query,
    setQuery,
    commands: controller.commands,
    filteredCommands,
    selectedIndex: controller.selectedIndex,
    open,
    close,
    toggle,
    registerCommand,
    unregisterCommand,
    selectNext,
    selectPrevious,
    executeSelected,
  };
}
