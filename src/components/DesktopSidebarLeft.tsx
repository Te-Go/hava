
import React from 'react';
import { MarketTicker } from '../types';
import { HUB_LOGOS } from '../services/weatherService';
import { Icon } from './Icons';

interface DesktopSidebarLeftProps {
  marketData: MarketTicker[];
}

// Helper component for a single Hub Card (Ultra-Compact Version - Neutral Style)
const NetworkHubCard: React.FC<{
  title: string;
  ticker?: MarketTicker;
  logo: string;
  fallbackIcon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  link: string;
  textColor: string;
}> = ({ title, ticker, logo, fallbackIcon, gradientFrom, gradientTo, link, textColor }) => {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div className={`
        relative overflow-hidden rounded-xl border border-white/40 dark:border-white/10 
        bg-white/40 dark:bg-slate-800/40 backdrop-blur-md
        shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/60 dark:hover:bg-slate-700/60
      `}>
        <div className="p-2 relative z-10">
          {/* Header: Logo & Title (Compacted) */}
          <div className="flex items-center space-x-2 mb-2">
            {/* Icon Container - Holds the Brand Color */}
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center shadow-inner flex-shrink-0 text-white`}>
              <img
                src={logo}
                alt={title}
                className="w-3.5 h-3.5 object-contain filter drop-shadow-sm"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="absolute text-[10px]">{!logo && fallbackIcon}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-slate-700 dark:text-slate-200 text-[10px] font-bold opacity-90 uppercase tracking-tight truncate leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</h3>
            </div>
          </div>

          {/* Body: Price & Change */}
          <div className="bg-white/50 dark:bg-slate-900/40 rounded-lg p-1.5 border border-white/20 dark:border-white/5">
            {ticker ? (
              <>
                <div className={`text-sm font-bold ${textColor} leading-none tracking-tight`}>
                  {ticker.price}
                </div>
                <div className={`text-[9px] font-bold flex items-center mt-0.5 ${ticker.change >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                  {ticker.change > 0 ? <Icon.ArrowUp className="w-2 h-2 mr-0.5" /> : <Icon.ArrowDown className="w-2 h-2 mr-0.5" />}
                  %{Math.abs(ticker.change)}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-6">
                <div className="w-3 h-3 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Footer: CTA */}
          <div className="mt-1.5 flex items-center justify-end text-slate-400 dark:text-slate-500 text-[8px] font-bold uppercase opacity-80 group-hover:opacity-100 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-all">
            Analiz <Icon.ChevronRight className="w-2 h-2 ml-0.5" />
          </div>
        </div>
      </div>
    </a>
  );
};

const DesktopSidebarLeft: React.FC<DesktopSidebarLeftProps> = ({ marketData }) => {

  // Find specific tickers for the hubs
  const goldTicker = marketData.find(m => m.symbol.includes('ALTIN'));
  const fxTicker = marketData.find(m => m.symbol.includes('DOLAR'));
  const bistTicker = marketData.find(m => m.symbol.includes('BIST'));
  const cryptoTicker = marketData.find(m => m.symbol.includes('BITCOIN'));

  return (
    <div className="flex flex-col gap-3">

      {/* 1. GOLD HUB */}
      <NetworkHubCard
        title="Altın"
        ticker={goldTicker}
        logo={HUB_LOGOS.GOLD}
        fallbackIcon="🟡"
        gradientFrom="from-amber-400"
        gradientTo="to-yellow-600"
        link="https://altın-fiyatları.tr"
        textColor="text-amber-600 dark:text-amber-400"
      />

      {/* 2. FX HUB */}
      <NetworkHubCard
        title="Döviz"
        ticker={fxTicker}
        logo={HUB_LOGOS.FX}
        fallbackIcon="💵"
        gradientFrom="from-emerald-400"
        gradientTo="to-green-700"
        link="https://dolar-tl.com"
        textColor="text-emerald-600 dark:text-emerald-400"
      />

      {/* 3. BOURSE HUB */}
      <NetworkHubCard
        title="Borsa"
        ticker={bistTicker}
        logo={HUB_LOGOS.BOURSE}
        fallbackIcon="📈"
        gradientFrom="from-blue-500"
        gradientTo="to-indigo-700"
        link="https://bist-100.tr"
        textColor="text-blue-600 dark:text-blue-400"
      />

      {/* 4. CRYPTO HUB */}
      <NetworkHubCard
        title="Kripto"
        ticker={cryptoTicker}
        logo={HUB_LOGOS.CRYPTO}
        fallbackIcon="₿"
        gradientFrom="from-slate-600"
        gradientTo="to-purple-800"
        link="https://kripto-paralar.com"
        textColor="text-purple-600 dark:text-purple-400"
      />

      <div className="text-center mt-1">
        <span className="text-[8px] text-slate-400 uppercase tracking-widest font-bold opacity-60">TG FİNANS</span>
      </div>
    </div>
  );
};

export default DesktopSidebarLeft;
