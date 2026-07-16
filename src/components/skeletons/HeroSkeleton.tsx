import React from 'react';
import GlassCard from '../GlassCard';
import { Skeleton } from '../ui/skeleton';

export default function HeroSkeleton() {
  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* AlertBar Skeleton */}
      <Skeleton className="w-full h-12" />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {/* Left Column */}
        <GlassCard className="relative flex flex-col justify-between h-[360px] md:col-span-1">
          <div className="flex flex-col gap-3 mb-2">
            <Skeleton className="w-full h-10 rounded-xl" />
            <Skeleton className="w-32 h-4" />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex flex-col gap-2">
               <Skeleton className="w-24 h-16" />
               <Skeleton className="w-20 h-4" />
            </div>
            <Skeleton className="w-20 h-20 rounded-full" />
          </div>
          <div className="mt-6">
             <Skeleton className="w-full h-24 rounded-xl" />
             <div className="flex justify-between mt-3">
                <Skeleton className="w-16 h-4" />
                <Skeleton className="w-16 h-4" />
             </div>
          </div>
        </GlassCard>

        {/* Right Column */}
        <div className="md:col-span-2">
           <GlassCard className="h-[360px] w-full flex flex-col justify-between">
              <Skeleton className="w-48 h-6 mb-4" />
              <Skeleton className="w-full h-full" />
           </GlassCard>
        </div>
      </div>
    </div>
  );
}
