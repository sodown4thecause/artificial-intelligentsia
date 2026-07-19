import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A reusable container component that applies the Oceanic Glassmorphism style.
 * Uses backdrop-blur and subtle borders for high-depth optical separation.
 */
export const GlassPanel: React.FC<GlassPanelProps> = ({ children, className = '' }) => {
  return (
    <div className={`glass-panel glass-highlight ${className}`}>
      {children}
    </div>
  );
};
