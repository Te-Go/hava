import React from 'react';
import { Icon } from './Icons';

// SINAN: Hub logos - Your actual brand logos
const HUB_LOGOS = {
    weather: '/logos/hava-durumlari-logo.png',
    gold: '/logos/altin-fiyatlari-logo.png',
    forex: '/logos/doviz-kurlari-logo.png',
    crypto: '/logos/kripto-paralar-logo.png',
    bourse: '/logos/bist-100-logo.png',
};

interface NetworkWidgetProps {
    marketData?: {
        gold?: string;
        dollar?: string;
        bist?: string;
        bitcoin?: string;
    };
}

const NetworkWidget: React.FC<NetworkWidgetProps> = ({ marketData }) => {
    // Hub network data - easily configurable
    const hubs = [
        {
            id: 'gold',
            name: 'Gram Altın',
            subtitle: 'Çok Yakında',
            value: marketData?.gold || '—',
            logo: HUB_LOGOS.gold,
            href: 'https://altin-fiyatlari.tr',
            bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        },
        {
            id: 'forex',
            name: 'Dolar/TL',
            subtitle: 'Çok Yakında',
            value: marketData?.dollar || '—',
            logo: HUB_LOGOS.forex,
            href: 'https://doviz-kurlari.tr',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
        },
        {
            id: 'bourse',
            name: 'BIST 100',
            subtitle: 'Çok Yakında',
            value: marketData?.bist || '—',
            logo: HUB_LOGOS.bourse,
            href: 'https://bist-100.tr',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        },
        {
            id: 'crypto',
            name: 'Bitcoin',
            subtitle: 'Çok Yakında',
            value: marketData?.bitcoin || '—',
            logo: HUB_LOGOS.crypto,
            href: 'https://kripto-paralar.tr',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        },
    ];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Piyasa Özeti
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    Çok Yakında
                </span>
            </div>

            {/* Data Rows - LAUNCH PHASE: Links disabled until hubs are ready */}
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700/50">
                {hubs.map((hub) => (
                    <div
                        key={hub.id}
                        // href={hub.href} // DISABLED - Hub not ready
                        // target="_blank"
                        // rel="noopener nofollow sponsored"
                        className="flex items-center justify-between px-4 py-3 transition-colors group cursor-default"
                    >
                        <div className="flex items-center gap-3">
                            {/* Hub Logo */}
                            <div className={`w-10 h-10 rounded-full ${hub.bgColor} flex items-center justify-center overflow-hidden`}>
                                <img
                                    src={hub.logo}
                                    alt={hub.name}
                                    className="w-7 h-7 object-contain"
                                    loading="lazy"
                                    onError={(e) => {
                                        // Fallback to text if image fails
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors">
                                    {hub.name}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                    {hub.subtitle}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                {hub.value}
                            </span>
                            {/* Arrow removed since not clickable */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NetworkWidget;
