import React, { useEffect, useState } from 'react';
import { vfs, ToolProposal } from '../../../agent/runtime/vfs';
import { GlassPanel } from '../shared/GlassPanel';

/**
 * ActionPreview renders a feed of shadowed actions awaiting user approval.
 * It stays pinned to the top-right to provide a non-obtrusive "Inbox" for AI intents.
 */
export const ActionPreview: React.FC = () => {
  const [proposals, setProposals] = useState<ToolProposal[]>([]);

  useEffect(() => {
    // Subscribe to VFS state updates
    return vfs.subscribe((latest) => {
      setProposals([...latest].reverse()); // Show newest first
    });
  }, []);

  if (proposals.length === 0) return null;

  return (
    <div className="fixed right-8 top-8 w-80 flex flex-col gap-4 z-40 max-h-[calc(100vh-64px)] overflow-y-auto pr-2 scrollbar-hidden">
      <header className="flex justify-between items-center px-1">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
          Action Staging ({proposals.length})
        </h3>
      </header>
      
      {proposals.map((proposal) => (
        <GlassPanel key={proposal.id} className="p-4 flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-active/80 px-2 py-0.5 bg-active/5 rounded border border-active/10">
              {proposal.action}
            </span>
            <span className="text-[9px] font-bold text-white/30">
              {new Date(proposal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-white/90">{proposal.previewData.summary}</p>
            <p className="text-[11px] text-white/40 leading-snug">
              This action has {proposal.previewData.impact.toLowerCase()} external impact.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => vfs.commit(proposal.id)}
              className="flex-1 py-2 bg-active text-abyss text-[11px] font-bold rounded hover:shadow-[0_0_15px_rgba(0,255,191,0.3)] transition-all active:scale-95"
            >
              Approve
            </button>
            <button
              onClick={() => vfs.discard(proposal.id)}
              className="flex-1 py-2 bg-white/5 text-white/50 text-[11px] font-bold rounded hover:bg-white/10 transition-colors active:scale-95"
            >
              Discard
            </button>
          </div>
        </GlassPanel>
      ))}
    </div>
  );
};
