import React from 'react';
import GlassCard from '../GlassCard';
import { Skeleton } from '../ui/skeleton';

export default function IslandSkeleton() {
  return (
    <div className="mb-8 w-full animate-pulse">
       <GlassCard className="h-[400px] w-full flex flex-col">
          <Skeleton className="w-1/3 h-8 mb-4" />
          <div className="flex gap-4 h-full">
            <Skeleton className="w-1/4 h-full" />
            <Skeleton className="w-3/4 h-full" />
          </div>
       </GlassCard>
    </div>
  );
}
