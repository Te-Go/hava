import React from 'react';
import GlassCard from '../GlassCard';
import { Skeleton } from '../ui/skeleton';

export default function LifestyleSkeleton() {
  return (
    <GlassCard className="flex flex-col h-full" noPadding>
       <div className="px-4 py-3 border-b border-glass-border dark:border-dark-border flex justify-between items-center">
          <Skeleton className="w-40 h-5" />
          <Skeleton className="w-20 h-4 rounded-full" />
       </div>
       <div className="w-full p-3 grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
             <Skeleton key={i} className="w-full h-[90px] rounded-xl" />
          ))}
       </div>
    </GlassCard>
  );
}
