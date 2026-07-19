/**
 * Creature OS — Shared domain types & FR->module contract.
 * Every subsystem imports from here so the architecture boundary (PRD §12) stays coherent.
 */
export const ok = (value) => ({ ok: true, value });
export const err = (error) => ({ ok: false, error });
//# sourceMappingURL=types.js.map