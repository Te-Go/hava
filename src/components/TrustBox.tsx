
import React from 'react';
import { ShieldCheck } from 'lucide-react';

const TrustBox: React.FC = () => {
    return (
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div className="text-xs text-slate-400 flex-1 flex flex-col md:flex-row gap-4 items-center md:items-start">
                    <div className="flex-1">
                        <p className="font-medium text-slate-200 mb-1">Veri Güvenilirliği & Kaynakça</p>
                        <p>
                            Bu sayfadaki hava durumu verileri, <strong>Meteoroloji Genel Müdürlüğü (MGM)</strong> ve <strong>ECMWF</strong> küresel tahmin modellerinden anlık olarak derlenmektedir.
                        </p>
                    </div>
                    <div className="md:w-1/3 md:border-l md:border-white/10 md:pl-4 opacity-70">
                        * Tüm tahminler algoritmik olarak işlenir ve TG Meteoroloji Masası tarafından denetlenir. Kesin meteorolojik uyarılar için lütfen resmi kurum duyurularını takip ediniz.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrustBox;
