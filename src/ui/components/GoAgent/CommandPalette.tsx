import React, { useState } from 'react';
import { GlassPanel } from '../shared/GlassPanel';
import { agentEngine } from '../../../agent/runtime/engine';

/**
 * CommandPalette is the primary interaction point for the Go Agent.
 * It features a translucent, central input with AI-native styling.
 */
export const CommandPalette: React.FC = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    setResponse(''); // Clear previous response
    
    try {
      const result = await agentEngine.processCommand(input);
      setResponse(result);
      setInput('');
    } catch (error) {
      setResponse("I encountered an error processing your command.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-4 z-50">
      <GlassPanel className="p-6 flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Creature..."
            className="w-full bg-transparent border-none outline-none text-xl placeholder:text-white/20"
            autoFocus
          />
          {isProcessing && (
            <div className="absolute right-0 w-3 h-3 bg-active rounded-full ai-pulse shadow-[0_0_12px_rgba(0,255,191,0.5)]" />
          )}
        </form>
        
        {response && (
          <div className="mt-4 text-sm text-white/70 leading-relaxed border-t border-white/5 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <span className="text-active mt-1">✨</span>
              <p>{response}</p>
            </div>
          </div>
        )}
      </GlassPanel>
      
      <div className="mt-4 text-center">
        <span className="text-[10px] text-white/20 uppercase tracking-[0.2em]">
          Press Enter to dispatch
        </span>
      </div>
    </div>
  );
};
