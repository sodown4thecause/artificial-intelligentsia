import type { ToolProposal, ProposalImpact } from '../../core/types';

export type { ToolProposal };
export type { ProposalImpact };

type VFSUpdateListener = (proposals: ToolProposal[]) => void;

/**
 * VFSManager handles the "Action Shadowing" lifecycle.
 * It stages consequential actions for user approval before execution.
 */
class VFSManager {
  private static instance: VFSManager;
  private proposals: Map<string, ToolProposal> = new Map();
  private listeners: Set<VFSUpdateListener> = new Set();

  private constructor() {}

  public static getInstance(): VFSManager {
    if (!VFSManager.instance) {
      VFSManager.instance = new VFSManager();
    }
    return VFSManager.instance;
  }

  /**
   * Stages a proposed action for user review.
   * Instead of executing a tool directly, the agent calls this.
   */
  public propose(action: string, args: Record<string, any>, preview: { summary: string; impact: ProposalImpact }): string {
    const id = `prop_${Math.random().toString(36).substring(2, 11)}`;
    const proposal: ToolProposal = {
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
  public async commit(id: string): Promise<any> {
    const proposal = this.proposals.get(id);
    if (!proposal) throw new Error(`Proposal ${id} not found`);

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
  public discard(id: string): void {
    this.proposals.delete(id);
    this.notify();
  }

  /**
   * Returns all currently staged proposals.
   */
  public getProposals(): ToolProposal[] {
    return Array.from(this.proposals.values());
  }

  /**
   * Subscribe to VFS updates (used by React UI).
   */
  public subscribe(listener: VFSUpdateListener): () => void {
    this.listeners.add(listener);
    listener(this.getProposals());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const proposals = this.getProposals();
    this.listeners.forEach(l => l(proposals));
  }
}

export const vfs = VFSManager.getInstance();
