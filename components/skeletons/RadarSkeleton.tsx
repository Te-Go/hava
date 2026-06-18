import React from 'react';
import GlassCard from '../GlassCard';
import { Skeleton } from '../ui/skeleton';

export default function RadarSkeleton() {
  return (
    <GlassCard className="h-full flex flex-col justify-between">
      <Skeleton className="w-48 h-6 mb-4" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
           <div key={i} className="flex gap-4 items-center">
             <Skeleton className="w-20 h-16 rounded-lg" />
             <div className="flex flex-col gap-2 w-full">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-2/3 h-4" />
             </div>
           </div>
        ))}
      </div>
    </GlassCard>
  );
}
