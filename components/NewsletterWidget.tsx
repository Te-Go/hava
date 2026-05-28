import React, { useState } from 'react';
import { Icon } from './Icons';

interface NewsletterWidgetProps {
    city?: string;
}

const NewsletterWidget: React.FC<NewsletterWidgetProps> = ({ city = 'İstanbul' }) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // SINAN: Replace with your actual newsletter signup logic
        // Could be: Mailchimp, ConvertKit, OneSignal, Firebase, etc.
        console.log('[Newsletter] Signup:', email, 'City:', city);
        setSubmitted(true);

        // Reset after 3 seconds
        setTimeout(() => {
            setSubmitted(false);
            setEmail('');
        }, 3000);
    };

    return (
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
            {/* Header with Lightning Icon */}
            <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/50">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-yellow-500/20 flex items-center justify-center">
                    <Icon.AlertTriangle size={16} className="text-amber-600 dark:text-yellow-400" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                        Fırtına Uyarı Sistemi
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Anlık hava bildirimleri
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    <strong className="text-slate-900 dark:text-white">{city}</strong> için kritik hava değişimlerinden
                    anında haberdar olun. Fırtına, don ve yoğun yağış uyarıları cebinize gelsin.
                </p>

                {!submitted ? (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="E-posta adresiniz"
                            required
                            className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                        />
                        <button
                            type="submit"
                            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 dark:from-yellow-500 dark:to-amber-500 text-white dark:text-slate-900 font-bold text-sm hover:from-amber-400 hover:to-amber-500 dark:hover:from-yellow-400 dark:hover:to-amber-400 transition-all shadow-lg shadow-amber-500/20"
                        >
                            Abone Ol
                        </button>
                    </form>
                ) : (
                    <div className="flex items-center justify-center gap-2 py-4 text-emerald-600 dark:text-emerald-400">
                        <Icon.Shield size={20} />
                        <span className="font-bold">Kaydınız Alındı!</span>
                    </div>
                )}

                {/* Trust Badge */}
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 text-center">
                    🔒 Spam göndermiyoruz. İstediğiniz zaman iptal edebilirsiniz.
                </p>
            </div>
        </div>
    );
};

export default NewsletterWidget;
