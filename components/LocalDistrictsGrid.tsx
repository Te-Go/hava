import React, { useRef } from 'react';
import { toSlug } from '../services/weatherService';
import { getCityDistricts } from '../shared/cityData';
import { Icon } from './Icons';

interface LocalDistrictsGridProps {
    city: string;
    parentCity?: string;
    view?: 'home' | 'tomorrow' | '15-days';
}

/**
 * LocalDistrictsGrid - Horizontal scrollable district rail
 * Positioned directly under City Rail for intuitive city → district navigation
 * Mirrors City Rail styling with slightly smaller/compact design
 */
const LocalDistrictsGrid: React.FC<LocalDistrictsGridProps> = ({ city, parentCity, view = 'home' }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Get districts from centralized data
    const districts = getCityDistricts(city);

    // Don't render if no districts
    if (districts.length === 0) {
        return null;
    }

    // SINAN SEO: Maintain context when clicking internal links
    // If I am on "Istanbul Tomorrow", clicking "Kadikoy" should go to "Kadikoy Tomorrow"
    const getDistrictUrl = (district: string) => {
        const citySlug = toSlug(city);
        const districtSlug = toSlug(district);
        let url = `/hava-durumu/${citySlug}/${districtSlug}`;

        if (view === 'tomorrow') url += '/yarin';
        else if (view === '15-days') url += '/15-gunluk';

        return url;
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 200;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="relative max-w-4xl mx-auto w-full group/district-rail px-4 -mt-1 mb-2">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1.5 px-1">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {city} İlçeleri
                </span>
                <div className="flex-grow h-px bg-gradient-to-r from-slate-200 dark:from-slate-700 to-transparent"></div>
            </div>

            {/* Left Scroll Button */}
            <button
                onClick={() => scroll('left')}
                className="absolute left-3 top-1/2 translate-y-1 z-20 p-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-full shadow-md text-slate-500 hover:text-blue-500 transition-all opacity-0 group-hover/district-rail:opacity-100 hidden md:flex hover:scale-110 active:scale-95"
                aria-label="Sola Kaydır"
            >
                <Icon.ChevronRight className="w-3 h-3 rotate-180" />
            </button>

            {/* Scrollable Rail */}
            <div
                ref={scrollRef}
                className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 scroll-smooth snap-x snap-mandatory px-4 md:px-0"
            >
                {districts.map((district) => (
                    <a
                        key={district}
                        href={getDistrictUrl(district)}
                        onClick={() => {
                            // Track before navigation (no preventDefault - real page load for SEO)
                            // trackEvent('click_district_rail', 'navigation', district);
                        }}
                        className="
                            snap-start
                            flex-shrink-0 px-3 py-1.5
                            rounded-lg
                            text-xs font-medium
                            transition-all shadow-sm backdrop-blur-md
                            whitespace-nowrap active:scale-95
                            border
                            bg-white/30 dark:bg-slate-800/30 
                            border-slate-200/60 dark:border-slate-700/50 
                            hover:bg-white hover:border-blue-300 
                            dark:hover:bg-slate-700 dark:hover:border-blue-600
                            text-slate-600 dark:text-slate-300
                            hover:text-blue-600 dark:hover:text-blue-300
                        "
                    >
                        {district}
                    </a>
                ))}
            </div>

            {/* Mobile Gradient Hint (Right Side) */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/90 dark:from-slate-900/90 to-transparent pointer-events-none md:hidden rounded-r-xl z-10" />

            {/* Right Scroll Button */}
            <button
                onClick={() => scroll('right')}
                className="absolute right-3 top-1/2 translate-y-1 z-20 p-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-full shadow-md text-slate-500 hover:text-blue-500 transition-all opacity-0 group-hover/district-rail:opacity-100 hidden md:flex hover:scale-110 active:scale-95"
                aria-label="Sağa Kaydır"
            >
                <Icon.ChevronRight className="w-3 h-3" />
            </button>
        </div >
    );
};

export default LocalDistrictsGrid;
