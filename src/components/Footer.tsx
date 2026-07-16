import React from "react";
import { toSlug } from "../services/weatherService";
import { REGULAR_CITIES } from "../shared/cityData";
import Link from "next/link";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white/60 py-12 px-4 mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
        {/* Column 1: Hakkımızda */}
        <div>
          <h4 className="text-white font-bold mb-4">Hakkımızda</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Hava Durumları
              </Link>
            </li>
            <li>
              <Link href="/iletisim" className="hover:text-white transition-colors">
                İletişim
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 2: Analizler & Raporlar */}
        <div>
          <h4 className="text-white font-bold mb-4">Analizler & Raporlar</h4>
          <ul className="space-y-2">
            <li>
              <Link
                href="/yarinkihava"
                className="hover:text-white transition-colors text-blue-400 font-semibold"
              >
                Yarınki Hava Durumu
              </Link>
            </li>
            <li>
              <Link
                href="/15-gunluk"
                className="hover:text-white transition-colors text-indigo-400 font-semibold"
              >
                15 Günlük Hava Durumu
              </Link>
            </li>
            <li>
              <Link
                href="/deniz-suyu-sicakligi"
                className="hover:text-white transition-colors text-cyan-400 font-semibold"
              >
                Deniz Suyu Sıcaklığı
              </Link>
            </li>
            <li>
              <Link href="/hava-durumu-makaleleri" className="hover:text-white transition-colors">
                Hava Durumu Makaleleri
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Keşfet */}
        <div>
          <h4 className="text-white font-bold mb-4">Keşfet</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/sehirler" className="text-blue-400 hover:text-white font-semibold">
                Tüm Şehirler →
              </Link>
            </li>
            {REGULAR_CITIES.slice(0, 5).map((city) => (
              <li key={city}>
                <Link
                  href={`/hava-durumu/${toSlug(city)}`}
                  className="hover:text-white transition-colors"
                >
                  {city}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Legal & KVKK */}
        <div>
          <h4 className="text-white font-bold mb-4">Yasal Bildirimler</h4>
          <ul className="space-y-2 text-[10px] leading-relaxed">
            <li>
              Tahminler MGM ve Open-Meteo verilerine dayanmaktadır. Sismik veriler AFAD API
              aracılığıyla anlık sorgulanır.
            </li>
            <li className="mt-2 text-emerald-400 font-medium">
              KVKK Privacy Protocol: Konum verileriniz asla sunucularımızda saklanmaz. Bellek içi
              geçici olarak işlenir.
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto border-t border-white/10 mt-8 pt-8 text-center text-[10px] text-white/30">
        <p>© {new Date().getFullYear()} Hava Durumları. Tüm hakları saklıdır.</p>
      </div>
    </footer>
  );
};

export default Footer;
