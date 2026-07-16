import React from 'react';
import GlassCard from '../GlassCard';
import { Skeleton } from '../ui/skeleton';

export default function RadarSkeleton() {
  return (
    <GlassCard className="flex flex-col h-full relative overflow-hidden" noPadding>
      {/* Skeleton header mimicking the map controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
        <Skeleton className="w-48 h-8 rounded-xl bg-slate-200/50 dark:bg-slate-800/50" />
        <Skeleton className="hidden sm:block w-36 h-8 rounded-xl bg-slate-200/50 dark:bg-slate-800/50" />
      </div>

      {/* Map area skeleton */}
      <div className="w-full h-[350px] md:h-[400px] lg:h-[450px]">
        <Skeleton className="w-full h-full rounded-xl bg-slate-100/50 dark:bg-slate-850/50" />
      </div>
    </GlassCard>
  );
}
