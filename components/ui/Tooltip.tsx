import React, { ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 w-48 p-2 text-xs text-white bg-slate-800 dark:bg-slate-900 border border-slate-700 rounded-lg shadow-xl backdrop-blur-md left-1/2 -translate-x-1/2 bottom-full mb-2 pointer-events-none">
        {content}
        {/* Simple CSS triangle pointer */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-900"></div>
      </div>
    </div>
  );
}
