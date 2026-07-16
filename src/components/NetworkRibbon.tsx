import React from 'react';

// SINAN PROTOCOL: Hub Network Configuration
// Sorted by Search Volume Authority
const HUBS = [
    {
        id: 'weather',
        name: 'Hava Durumu',
        logo: '/logos/hava-durumlari-logo.png',
        link: 'https://hava-durumlari.tr',
        active: true
    },
    {
        id: 'gold',
        name: 'Altın',
        logo: '/logos/altin-fiyatlari-logo.png',
        link: 'https://altin-fiyatlari.tr',
        active: false
    },
    {
        id: 'currency',
        name: 'Döviz',
        logo: '/logos/doviz-kurlari-logo.png',
        link: 'https://doviz-kurlari.tr',
        active: false
    },
    {
        id: 'stock',
        name: 'Borsa',
        logo: '/logos/bist-100-logo.png',
        link: 'https://bist-100.tr',
        active: false
    },
    {
        id: 'crypto',
        name: 'Kripto',
        logo: '/logos/kripto-paralar-logo.png',
        link: 'https://kripto-paralar.tr',
        active: false
    },
];

const BRAND_NAME = 'TG Dijital Ağı';

const NetworkRibbon: React.FC = () => {
    return (
        <div className="w-full h-14 bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-900 dark:to-slate-900 border-b border-slate-600 dark:border-slate-800 flex items-center justify-center px-4 relative z-50">

            {/* Central Hub Navigation */}
            <nav className="flex items-center gap-6 sm:gap-8 md:gap-12 lg:gap-16" aria-label="Network Hubs">
                {HUBS.map((hub) => {
                    // LAUNCH PHASE: Only Weather hub is clickable, others are display-only
                    const isClickable = hub.active;

                    const content = (
                        <>
                            {/* Logo Container - Clean, no rings */}
                            <div className={`
              relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden flex items-center justify-center
              transition-all duration-300
              ${hub.active
                                    ? 'shadow-lg shadow-white/30'
                                    : ''}
            `}>
                                <img
                                    src={hub.logo}
                                    alt={hub.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>

                            {/* Label */}
                            <span className={`
              text-[8px] sm:text-[9px] font-bold uppercase tracking-wider transition-colors duration-200
              ${hub.active
                                    ? 'text-white dark:text-blue-400'
                                    : 'text-slate-300 dark:text-slate-400'}
            `}>
                                {hub.name}
                            </span>
                        </>
                    );

                    // Active hub = clickable link, Inactive hubs = display-only div
                    return isClickable ? (
                        <a
                            key={hub.id}
                            href={hub.link}
                            target="_self"
                            title={`${hub.name} Verileri`}
                            aria-current="page"
                            className="group flex flex-col items-center justify-center gap-1 transition-all duration-300 ease-out opacity-100 scale-100"
                        >
                            {content}
                        </a>
                    ) : (
                        <div
                            key={hub.id}
                            title={`${hub.name} - Çok Yakında`}
                            className="group flex flex-col items-center justify-center gap-1 transition-all duration-300 ease-out cursor-default opacity-70"
                        >
                            {content}
                        </div>
                    );
                })}
            </nav>

            {/* Brand Tag (Desktop Only) */}
            <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-600 uppercase tracking-[0.15em]">
                    {BRAND_NAME}
                </span>
            </div>

            {/* Left Brand Logo (Desktop Only) - Optional */}
            {/* Uncomment if you want your main logo on the left
      <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden xl:block">
        <img src="/logos/tg-network-logo.png" alt="TG Network" className="h-6" />
      </div>
      */}
        </div>
    );
};

export default NetworkRibbon;
