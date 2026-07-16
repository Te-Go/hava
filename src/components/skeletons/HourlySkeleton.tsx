import React from 'react';
import GlassCard from '../GlassCard';
import { Skeleton } from '../ui/skeleton';

export default function HourlySkeleton() {
  return (
    <GlassCard className="w-full mb-8">
      <Skeleton className="w-48 h-6 mb-4" />
      <div className="flex gap-4 overflow-x-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
           <div key={i} className="flex flex-col items-center gap-3">
             <Skeleton className="w-12 h-4" />
             <Skeleton className="w-8 h-8 rounded-full" />
             <Skeleton className="w-10 h-4" />
             <Skeleton className="w-8 h-12" />
           </div>
        ))}
      </div>
    </GlassCard>
  );
}
