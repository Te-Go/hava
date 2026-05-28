import React from 'react';
import { toSlug } from '../services/weatherService';
import { REGULAR_CITIES } from '../shared/cityData';
import TrustBox from './TrustBox';

interface FooterProps {
  onNavigate: (view: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {

  const handleLinkClick = (e: React.MouseEvent, view: string) => {
    e.preventDefault();
    onNavigate(view);
  };

  return (
    <footer className="bg-slate-900 text-white/60 py-12 px-4 mt-auto">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">

        {/* Column 1: Hakkımızda */}
        <div>
          <h4 className="text-white font-bold mb-4">Hakkımızda</h4>
          <ul className="space-y-2">
            <li><a href="/" onClick={(e) => handleLinkClick(e, 'home')} className="hover:text-white transition-colors">Hava Durumları</a></li>
            <li><a href="/iletisim/" className="hover:text-white transition-colors">İletişim</a></li>
          </ul>
        </div>

        {/* Column 2: Analizler & Raporlar */}
        <div>
          <h4 className="text-white font-bold mb-4">Analizler & Raporlar</h4>
          <ul className="space-y-2">
            <li><a href="/yarin" onClick={(e) => handleLinkClick(e, 'tomorrow')} className="hover:text-white transition-colors text-blue-400 font-semibold">Yarınki Hava Durumu</a></li>
            <li><a href="/15-gunluk" onClick={(e) => handleLinkClick(e, '15-days')} className="hover:text-white transition-colors text-indigo-400 font-semibold">15 Günlük Hava Durumu</a></li>
            <li><a href="/deniz-suyu-sicakligi" onClick={(e) => handleLinkClick(e, 'sea-temp')} className="hover:text-white transition-colors text-cyan-400 font-semibold">Deniz Suyu Sıcaklığı</a></li>
            {/* SEO Links for Content */}
            <li><a href="/hava-durumu-makaleleri/" className="hover:text-white transition-colors">Hava Durumu Makaleleri</a></li>
          </ul>
        </div>

        {/* Column 3: Keşfet (Populated with Regular Cities) */}
        <div>
          <h4 className="text-white font-bold mb-4">Keşfet</h4>
          <ul className="space-y-2">
            <li><a href="/sehirler" onClick={(e) => handleLinkClick(e, 'cities')} className="text-blue-400 hover:text-white font-semibold">Tüm Şehirler →</a></li>
            {REGULAR_CITIES.slice(0, 5).map((city) => (
              <li key={city}>
                <a
                  href={`/hava-durumu/${toSlug(city)}`}
                  className="hover:text-white transition-colors"
                >
                  {city}
                </a>
              </li>
            ))}
            {REGULAR_CITIES.length > 5 && (
              <li><span className="opacity-50 text-[10px]">+ {REGULAR_CITIES.length - 5} şehir daha</span></li>
            )}
          </ul>
        </div>

        {/* Column 4: Yasal & Social */}
        <div>
          <h4 className="text-white font-bold mb-4">Yasal</h4>
          <ul className="space-y-2">
            <li><a href="/kullanim-kosullari/" className="hover:text-white transition-colors">Kullanım Koşulları</a></li>
            <li><a href="/gizlilik-politikasi/" className="hover:text-white transition-colors">Gizlilik Politikası</a></li>
            <li><a href="/cerez-politikasi/" className="hover:text-white transition-colors">Çerez Politikası</a></li>
            <li>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(new Event('show_cookie_banner'));
                }}
                className="hover:text-white transition-colors text-left"
              >
                Çerez Tercihleri
              </button>
            </li>
            <li><a href="/kvkk-aydinlatma-metni/" className="hover:text-white transition-colors">KVKK Aydınlatma Metni</a></li>
          </ul>

        </div>
      </div>

      {/* TrustBox - Full Width */}
      <div className="max-w-4xl mx-auto mt-8">
        <TrustBox />
      </div>

      <div className="max-w-4xl mx-auto mt-8 text-[10px] opacity-40 text-center">
        © 2026 TG Dijital. Tüm hakları saklıdır.
      </div>
    </footer>
  );
};

export default Footer;
