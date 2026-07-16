
import React, { useState, useEffect } from 'react';
import { Icon } from './Icons';
import { trackEvent, saveUserPreferences, getUserPreferences } from '../services/weatherService';

const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check using the centralized engine
    const prefs = getUserPreferences();

    if (prefs.consentStatus === 'pending') {
      // Gentle Delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // ⚡️ The Bridge Listener: Synchronizes the UI if Complianz status changes externally
    const handleComplianzEvent = (e: any) => {
      // Complianz passes the active choice status ('allow' or 'deny')
      if (e.detail === 'allow') {
        saveUserPreferences({ consentStatus: 'accepted' });
      } else if (e.detail === 'deny') {
        saveUserPreferences({ consentStatus: 'declined' });
      }
    };

    // Listen for Complianz status change events fired at the document level
    document.addEventListener('cmplz_status_change', handleComplianzEvent);

    // LISTENER: Allow Footer to re-open banner
    const handleShow = () => {
      setIsVisible(true);
      setIsClosing(false);
    };
    window.addEventListener('show_cookie_banner', handleShow);

    return () => {
      window.removeEventListener('show_cookie_banner', handleShow);
      document.removeEventListener('cmplz_status_change', handleComplianzEvent);
    };
  }, []);

  const handleAccept = () => {
    // 1. Update our internal platform state
    saveUserPreferences({ consentStatus: 'accepted' });
    trackEvent('cookie_consent', 'status', 'accepted');
    window.dispatchEvent(new Event('cookie_consent_updated'));

    // 2. ⚡️ Fire the Complianz Plugin Hook
    if (typeof window !== 'undefined' && (window as any).cmplz_accept_all) {
      try {
        (window as any).cmplz_accept_all();
      } catch (e) {
        console.warn("Complianz acceptAll failed", e);
      }
    }

    closeBanner();
  };

  const handleDecline = () => {
    // 1. Update our internal platform state
    saveUserPreferences({ consentStatus: 'declined' });
    trackEvent('cookie_consent', 'status', 'declined');

    // 2. ⚡️ Fire the Complianz Plugin Hook
    if (typeof window !== 'undefined' && (window as any).cmplz_deny) {
      try {
        (window as any).cmplz_deny();
      } catch (e) {
        console.warn("Complianz deny failed", e);
      }
    }

    closeBanner();
  };

  const closeBanner = () => {
    setIsClosing(true);
    setTimeout(() => setIsVisible(false), 500); // Wait for animation
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 
        z-[60] max-w-md w-full
        transition-all duration-500 transform
        ${isClosing ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0 animate-slideUp'}
      `}
    >
      <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-white/40 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-full flex-shrink-0 text-2xl">
            🍪
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">
              Çerez Tercihleriniz
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              Size daha doğru, yerel hava durumu verileri sunmak ve hizmet kalitemizi artırmak için çerezleri kullanıyoruz.
              <a href="/cerez-politikasi/" className="text-blue-500 hover:underline ml-1">Çerez Politikası</a>
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors shadow-sm"
              >
                Kabul Et
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors"
              >
                Reddet
              </button>
            </div>
          </div>

          <button
            onClick={handleDecline}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Kapat"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CookieBanner;
