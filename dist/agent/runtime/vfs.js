/**
 * VFSManager handles the "Action Shadowing" lifecycle.
 * It stages consequential actions for user approval before execution.
 */
class VFSManager {
    static instance;
    proposals = new Map();
    listeners = new Set();
    constructor() { }
    static getInstance() {
        if (!VFSManager.instance) {
            VFSManager.instance = new VFSManager();
        }
        return VFSManager.instance;
    }
    /**
     * Stages a proposed action for user review.
     * Instead of executing a tool directly, the agent calls this.
     */
    propose(action, args, preview) {
        const id = `prop_${Math.random().toString(36).substring(2, 11)}`;
        const proposal = {
            id,
            action,
            args,
            previewData: preview,
            timestamp: Date.now(),
            status: 'pending',
        };
        this.proposals.set(id, proposal);
        this.notify();
        return id;
    }
    /**
     * Commits an approved action.
     * This would be triggered by the user in the UI.
     */
    async commit(id) {
        const proposal = this.proposals.get(id);
        if (!proposal)
            throw new Error(`Proposal ${id} not found`);
        // In a real implementation, this would look up the tool implementation
        // and execute it with the staged args via Vercel Connect.
        console.log(`[VFS COMMIT] ${proposal.action}`, proposal.args);
        // Simulate cleanup and success
        this.proposals.delete(id);
        this.notify();
        return { success: true, action: proposal.action };
    }
    /**
     * Discards a proposal (user rejection).
     */
    discard(id) {
        this.proposals.delete(id);
        this.notify();
    }
    /**
     * Returns all currently staged proposals.
     */
    getProposals() {
        return Array.from(this.proposals.values());
    }
    /**
     * Subscribe to VFS updates (used by React UI).
     */
    subscribe(listener) {
        this.listeners.add(listener);
        listener(this.getProposals());
        return () => this.listeners.delete(listener);
    }
    notify() {
        const proposals = this.getProposals();
        this.listeners.forEach(l => l(proposals));
    }
}
export const vfs = VFSManager.getInstance();
//# sourceMappingURL=vfs.js.map