import React from 'react';
import { CommandPalette } from './components/GoAgent/CommandPalette';
import { CommandPalette as GlobalCommandPalette } from './components/CommandPalette';
import { ActionPreview } from './components/VFS/ActionPreview';
import { NativeStatusBar } from './components/NativeStatusBar';
import type { DesktopContext } from '../desktop/context';
import './global.css';

/**
 * Main Application Shell for Creature OS.
 * Demonstrates the high-depth layered UI and the integration
 * between the Go Agent and the VFS staging area.
 */
interface AppProps {
  desktop: DesktopContext;
}

const App: React.FC<AppProps> = ({ desktop }) => {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-abyss flex items-center justify-center font-sans">
      {/* Desktop Background Effects (Atmospheric Depth) */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-active/10 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-highlight/10 blur-[140px] rounded-full pointer-events-none" />
      
      {/* The main AI interaction surface */}
        <CommandPalette />
        <GlobalCommandPalette />
      
      {/* Side panel for Action Shadowing / Approvals */}
      <ActionPreview />
      
      {/* Minimal System Info */}
      <footer className="fixed bottom-8 w-full px-12 flex justify-between items-end pointer-events-none">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-white/20 font-bold uppercase tracking-[0.4em]">
            Creature OS
          </span>
          <span className="text-[9px] text-white/10 font-mono">
            EVE_RUNTIME_BUILD_071821
          </span>
        </div>
        
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-active rounded-full shadow-[0_0_8px_#00FFBF]" />
            <span className="text-[9px] text-white/30 font-medium uppercase tracking-wider">Connect: Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-white/20 rounded-full" />
            <span className="text-[9px] text-white/30 font-medium uppercase tracking-wider">Memory: Active</span>
          </div>
        </div>
      </footer>
      <NativeStatusBar desktop={desktop} />
    </div>
  );
};

export default App;
