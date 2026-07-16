import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  noPadding?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick, noPadding = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-glass-white dark:bg-dark-glass
        backdrop-blur-xl 
        border border-glass-border dark:border-dark-border
        shadow-glass 
        rounded-3xl 
        relative
        overflow-hidden
        transition-all duration-300
        hover:shadow-lg hover:shadow-blue-200/30 hover:bg-white/70 dark:hover:bg-slate-800/60
        ${noPadding ? '' : 'p-5'}
        ${className}
      `}
    >
      {/* Rim light effect */}
      <div className="absolute inset-0 rounded-3xl border border-white/50 dark:border-white/5 pointer-events-none"></div>
      {children}
    </div>
  );
};

export default GlassCard;