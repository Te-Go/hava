import React, { useEffect, useState, useRef } from 'react';

interface TrafficMapProps {
  lat: number;
  lon: number;
  cityName: string;
}

export const TrafficMapWidget: React.FC<TrafficMapProps> = ({ lat, lon, cityName }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [scriptReady, setScriptReady] = useState<boolean>(typeof window !== 'undefined' && !!(window as any).mapkit);
  const [loadError, setLoadError] = useState<boolean>(false);

  // Hook 1: Handle asynchronous script and stylesheet lifecycle safely
  useEffect(() => {
    // Inject mandatory Apple MapKit CSS stylesheet if not present
    const cssId = 'apple-mapkit-js-styles';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://cdn.apple-mapkit.com/mk/6/mapkit.css';
      document.head.appendChild(link);
    }

    if ((window as any).mapkit) {
      setScriptReady(true);
      return;
    }

    const scriptId = 'apple-mapkit-js-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdn.apple-mapkit.com/mk/6/mapkit.js';
      script.crossOrigin = 'anonymous';
      script.async = true;
      document.head.appendChild(script);
    }

    const handleLoad = () => setScriptReady(true);
    const handleError = () => setLoadError(true);

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, []);

  // Hook 2: Initialize map viewport only when scriptReady evaluates to true
  useEffect(() => {
    if (!scriptReady || !(window as any).mapkit || !mapContainerRef.current) return;

    const mapkit = (window as any).mapkit;

    try {
      if (!mapkit.library) {
        mapkit.init({
          authorizationCallback: (done: (token: string) => void) => {
            done("eyJraWQiOiJDWFNSNjQ0MzQ3IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiI3N1g4NFBMN0FEIiwiaWF0IjoxNzgzNTEyOTY3LCJvcmlnaW4iOiJoYXZhLWR1cnVtbGFyaS50ciIsInNjb3BlIjoibWFwa2l0X2pzIn0.K64pkn9aBqWZj35Uf1Zgh9z3OdUavSa2JEogEVxqmOWTuZLRai3PSBso1rPSZppDEsL-5VPB37BIWvmFLKgOFw");
          }
        });
      }

      const coordinate = new mapkit.Coordinate(lat, lon);
      const region = new mapkit.CoordinateRegion(
        coordinate,
        new mapkit.CoordinateSpan(0.04, 0.04)
      );

      mapRef.current = new mapkit.Map(mapContainerRef.current, {
        region: region,
        showsTraffic: true,
        mapType: mapkit.MapType.Standard
      });

      const annotation = new mapkit.MarkerAnnotation(coordinate, {
        title: `${cityName} Yol Durumu`,
        color: "#3b82f6"
      });
      mapRef.current.addAnnotation(annotation);

    } catch (err) {
      setLoadError(true);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [scriptReady, lat, lon, cityName]);

  if (loadError) {
    return (
      <div className="w-full h-[300px] bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium">
        Yoğunluk nedeniyle şu an canlı harita yüklenemiyor.
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] rounded-xl overflow-hidden relative shadow-inner bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />
      
      {/* Enforce a stable, zero-CLS shimmer layout skeleton while network loads script */}
      {!scriptReady && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
          Canlı Yol Durumu Yükleniyor...
        </div>
      )}
    </div>
  );
};
