import React from 'react';

const MeteogramSkeleton: React.FC = () => {
    return (
        <div className="relative overflow-hidden bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-3xl p-6 h-[360px] animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-6">
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            </div>

            {/* Chart Area Skeleton */}
            <div className="relative h-[240px] w-full mt-4">
                {/* Y-axis lines */}
                <div className="absolute inset-0 flex flex-col justify-between">
                    <div className="w-full h-[1px] bg-slate-200/50 dark:bg-slate-700/50"></div>
                    <div className="w-full h-[1px] bg-slate-200/50 dark:bg-slate-700/50"></div>
                    <div className="w-full h-[1px] bg-slate-200/50 dark:bg-slate-700/50"></div>
                    <div className="w-full h-[1px] bg-slate-200/50 dark:bg-slate-700/50"></div>
                </div>

                {/* Data points (fake curve) */}
                <div className="absolute inset-x-0 bottom-0 top-8 flex items-end justify-around px-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 w-full">
                            <div
                                className="w-12 bg-slate-200 dark:bg-slate-700 rounded-t-lg"
                                style={{ height: `${Math.random() * 60 + 20}%` }}
                            ></div>
                            <div className="w-8 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MeteogramSkeleton;
