import { agentEngine } from './runtime/engine';
import { vfs } from './runtime/vfs';
/**
 * Initializes the Creature OS agent runtime and its core subsystems.
 * This would be called by the Native SDK main process.
 */
export async function initializeRuntime() {
    console.log('[Creature] Initializing AI-Native Runtime (Vercel Eve)...');
    // Setup VFS lifecycle hooks for auditing
    vfs.subscribe((proposals) => {
        if (proposals.length > 0) {
            console.log(`[Runtime Audit] ${proposals.length} action(s) pending user approval.`);
        }
    });
    return {
        engine: agentEngine,
        vfs: vfs,
        build: '2026.07.18.ALPHA'
    };
}
// Auto-initialize in standalone mode
if (typeof window === 'undefined') {
    initializeRuntime();
}
//# sourceMappingURL=main.js.map