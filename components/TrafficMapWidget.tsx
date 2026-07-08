import React, { useEffect, useRef, useState } from 'react';

interface TrafficMapProps {
  lat: number;
  lon: number;
  cityName: string;
}

export const TrafficMapWidget: React.FC<TrafficMapProps> = ({ lat, lon, cityName }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const initMap = () => {
      if (isCancelled) return;
      const mapkit = (window as any).mapkit;
      if (!mapkit || !mapContainerRef.current) return;

      try {
        // Initialize MapKit global authorization parameters safely
        if (!mapkit.library) {
          mapkit.init({
            authorizationCallback: (done: (token: string) => void) => {
              done("eyJraWQiOiJDWFNSNjQ0MzQ3IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiI3N1g4NFBMN0FEIiwiaWF0IjoxNzgzNTEyOTY3LCJvcmlnaW4iOiJoYXZhLWR1cnVtbGFyaS50ciIsInNjb3BlIjoibWFwa2l0X2pzIn0.K64pkn9aBqWZj35Uf1Zgh9z3OdUavSa2JEogEVxqmOWTuZLRai3PSBso1rPSZppDEsL-5VPB37BIWvmFLKgOFw");
            }
          });
        }

        // Center coordinates mapping object
        const coordinate = new mapkit.Coordinate(lat, lon);
        const region = new mapkit.CoordinateRegion(
          coordinate,
          new mapkit.CoordinateSpan(0.04, 0.04) // Controls the focus scale over the district
        );

        // Mount the interactive viewport map frame
        mapRef.current = new mapkit.Map(mapContainerRef.current, {
          region: region,
          showsTraffic: true, // The elite programmatic toggle showing real-time red/green lines
          showsCompass: mapkit.FeatureVisibility.Visible,
          mapType: mapkit.MapType.Standard
        });

        // Drop an anchor pin directly over the target traffic bottleneck node
        const annotation = new mapkit.MarkerAnnotation(coordinate, {
          title: `${cityName} Yol Durumu`,
          color: "#94a3b8"
        });
        mapRef.current.addAnnotation(annotation);
      } catch (err) {
        console.error("Failed to initialize MapKit Map instance:", err);
        setLoadError(true);
      }
    };

    const mapkit = (window as any).mapkit;
    if (mapkit) {
      initMap();
    } else {
      // Dynamic Script Loading: Inject Apple MapKit JS script safely if not already present
      let script = document.querySelector('script[src*="mapkit.js"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
        script.crossOrigin = 'anonymous';
        script.async = true;
        document.head.appendChild(script);
      }

      const handleLoad = () => {
        if (!isCancelled) {
          initMap();
        }
      };

      const handleError = () => {
        if (!isCancelled) {
          console.error("Failed to load Apple MapKit JS script from CDN");
          setLoadError(true);
        }
      };

      script.addEventListener('load', handleLoad);
      script.addEventListener('error', handleError);

      return () => {
        isCancelled = true;
        script.removeEventListener('load', handleLoad);
        script.removeEventListener('error', handleError);
        if (mapRef.current) {
          mapRef.current.destroy();
          mapRef.current = null;
        }
      };
    }

    // Component unmount cleanup lifecycle loop
    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [lat, lon, cityName]);

  if (loadError) {
    return (
      <div className="w-full min-h-[300px] rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 text-center">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Yoğunluk nedeniyle şu an canlı harita yüklenemiyor.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[300px] rounded-xl overflow-hidden relative shadow-inner border border-slate-200 dark:border-slate-700">
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />
    </div>
  );
};
