import React, { useEffect, useState } from 'react';
import { Icon } from './Icons';

interface MobileNavProps {
    activeView: 'home' | 'tomorrow' | '15-days' | 'weekend'; // keeping weekend for type safety if passed, though unused
    onToggleView: (view: 'home' | 'tomorrow' | '15-days') => void;
    onSearchClick: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeView, onToggleView }) => {
    const [hash, setHash] = useState('');

    useEffect(() => {
        // Track hash for highlighting 5-day vs 15-day
        const handleHashChange = () => setHash(window.location.hash);
        window.addEventListener('hashchange', handleHashChange);
        setHash(window.location.hash); // Initial
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // SINAN IMPROVEMENT: Subtle haptic feedback for native feel
    const handlePress = (callback: () => void) => {
        if (navigator.vibrate) navigator.vibrate(10);
        callback();
    };

    const handleFiveDayClick = () => {
        onToggleView('15-days');
        handlePress(() => {
            // Wait for view transition then scroll
            setTimeout(() => {
                const el = document.getElementById('5-gunluk-detay');
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    window.history.replaceState(null, '', '#5-gunluk-detay');
                    setHash('#5-gunluk-detay');
                }
            }, 100);
        });
    };

    const handleFifteenDayClick = () => {
        onToggleView('15-days');
        handlePress(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.history.replaceState(null, '', ' '); // Clear hash
            setHash('');
        });
    };

    const navItemClass = (isActive: boolean) => `
    flex flex-col items-center justify-center w-full h-full space-y-1 relative
    ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}
    transition-colors duration-200
  `;

    return (
        <div className="fixed bottom-0 left-0 w-full z-50 md:hidden print:hidden">
            {/* Glassmorphism Container with iOS safe area */}
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800 shadow-2xl"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                <div className="grid grid-cols-4 h-16 max-w-lg mx-auto">

                    {/* 1. TODAY */}
                    <button onClick={() => handlePress(() => onToggleView('home'))} className={navItemClass(activeView === 'home')}>
                        {activeView === 'home' && <span className="absolute -top-[1px] w-8 h-1 bg-blue-500 rounded-b-lg shadow-sm" />}
                        <Icon.Sun size={20} className={activeView === 'home' ? 'fill-current' : ''} />
                        <span className="text-[10px] font-bold">Bugün</span>
                    </button>

                    {/* 2. TOMORROW */}
                    <button onClick={() => handlePress(() => onToggleView('tomorrow'))} className={navItemClass(activeView === 'tomorrow')}>
                        {activeView === 'tomorrow' && <span className="absolute -top-[1px] w-8 h-1 bg-blue-500 rounded-b-lg shadow-sm" />}
                        <Icon.Calendar size={20} className={activeView === 'tomorrow' ? 'fill-current' : ''} />
                        <span className="text-[10px] font-bold">Yarın</span>
                    </button>

                    {/* 3. 5 DAYS (Trend) */}
                    <button onClick={handleFiveDayClick} className={navItemClass(activeView === '15-days' && hash === '#5-gunluk-detay')}>
                        {(activeView === '15-days' && hash === '#5-gunluk-detay') && <span className="absolute -top-[1px] w-8 h-1 bg-blue-500 rounded-b-lg shadow-sm" />}
                        <Icon.BarChart size={20} className={activeView === '15-days' && hash === '#5-gunluk-detay' ? 'fill-current' : ''} />
                        <span className="text-[10px] font-bold">5 Günlük</span>
                    </button>

                    {/* 4. 15 DAYS (Grid) */}
                    <button onClick={handleFifteenDayClick} className={navItemClass(activeView === '15-days' && hash !== '#5-gunluk-detay')}>
                        {(activeView === '15-days' && hash !== '#5-gunluk-detay') && <span className="absolute -top-[1px] w-8 h-1 bg-blue-500 rounded-b-lg shadow-sm" />}
                        <Icon.Grid size={20} className={activeView === '15-days' && hash !== '#5-gunluk-detay' ? 'fill-current' : ''} />
                        <span className="text-[10px] font-bold">15 Günlük</span>
                    </button>

                </div>
            </div>
        </div>
    );
};

export default MobileNav;
