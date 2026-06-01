import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WidgetErrorBoundary } from './components/WidgetErrorBoundary';

// Island Components
import {
  TrafficWidget,
  MarineWidget,
  SkiConditions,
  AgricultureWidget,
  AltitudeWidget,
  FireRiskWidget,
  TourismWidget
} from './islands';

// Global Payload Definition
declare global {
  interface Window {
    SinanWeatherPayload?: {
      city: string;
      locationId: number;
      weatherData?: any;
      modules?: {
        showHero?: boolean;
        showTraffic?: boolean;
        showMarine?: boolean;
        showSki?: boolean;
        showAgriculture?: boolean;
        showAltitude?: boolean;
        showFireRisk?: boolean;
        showTourism?: boolean;
      };
    };
  }
}

const payload = window.SinanWeatherPayload;

if (payload && payload.modules) {
  // 1. Mount Main App (Hero Dashboard)
  if (payload.modules.showHero !== false) {
    const heroRoot = document.getElementById('weather-hero-root') || document.getElementById('weather-app') || document.getElementById('root');
    if (heroRoot) {
      ReactDOM.createRoot(heroRoot).render(
        <React.StrictMode>
          <WidgetErrorBoundary>
            <App locationId={payload.locationId} payload={payload} />
          </WidgetErrorBoundary>
        </React.StrictMode>
      );
    }
  }

  // 2. Mount Traffic Island
  if (payload.modules.showTraffic) {
    const trafficRoot = document.getElementById('weather-traffic-root');
    if (trafficRoot) {
      ReactDOM.createRoot(trafficRoot).render(
        <React.StrictMode>
          <WidgetErrorBoundary>
            <TrafficWidget 
              data={payload.weatherData?.trafficData} 
              city={payload.city} 
              cityDisplay={payload.city}
              lastUpdated={Date.now()}
            />
          </WidgetErrorBoundary>
        </React.StrictMode>
      );
    }
  }
  
  // 3. Mount Marine Island
  if (payload.modules.showMarine) {
    const marineRoot = document.getElementById('weather-marine-root');
    if (marineRoot) {
      ReactDOM.createRoot(marineRoot).render(
        <React.StrictMode>
          <WidgetErrorBoundary>
             <MarineWidget 
                data={payload.weatherData?.marineData} 
                city={payload.city}
                cityDisplay={payload.city}
                lastUpdated={Date.now()}
             />
          </WidgetErrorBoundary>
        </React.StrictMode>
      );
    }
  }

  // 4. Mount Ski Island
  if (payload.modules.showSki) {
    const skiRoot = document.getElementById('weather-ski-root');
    if (skiRoot) {
      ReactDOM.createRoot(skiRoot).render(
        <React.StrictMode>
          <WidgetErrorBoundary>
             <SkiConditions 
                data={payload.weatherData?.skiData} 
                city={payload.city}
                lastUpdated={Date.now()}
             />
          </WidgetErrorBoundary>
        </React.StrictMode>
      );
    }
  }

  // 5. Mount Agriculture Island
  if (payload.modules.showAgriculture) {
    const root = document.getElementById('weather-agriculture-root');
    if (root) {
      ReactDOM.createRoot(root).render(
        <React.StrictMode>
          <WidgetErrorBoundary>
             <AgricultureWidget 
                data={payload.weatherData?.agricultureData} 
                city={payload.city}
                lastUpdated={Date.now()}
             />
          </WidgetErrorBoundary>
        </React.StrictMode>
      );
    }
  }

  // 6. Mount Altitude Island
  if (payload.modules.showAltitude) {
    const root = document.getElementById('weather-altitude-root');
    if (root) {
      ReactDOM.createRoot(root).render(
        <React.StrictMode>
          <WidgetErrorBoundary>
             <AltitudeWidget 
                data={payload.weatherData?.altitudeData} 
                city={payload.city}
             />
          </WidgetErrorBoundary>
        </React.StrictMode>
      );
    }
  }

  // 7. Mount Fire Risk Island
  if (payload.modules.showFireRisk) {
    const root = document.getElementById('weather-fire-risk-root');
    if (root) {
      ReactDOM.createRoot(root).render(
        <React.StrictMode>
          <WidgetErrorBoundary>
             <FireRiskWidget 
                data={payload.weatherData?.fireRiskData} 
                city={payload.city}
             />
          </WidgetErrorBoundary>
        </React.StrictMode>
      );
    }
  }

  // 8. Mount Tourism Island
  if (payload.modules.showTourism) {
    const root = document.getElementById('weather-tourism-root');
    if (root) {
      ReactDOM.createRoot(root).render(
        <React.StrictMode>
          <WidgetErrorBoundary>
             <TourismWidget 
                data={payload.weatherData?.tourismData} 
                city={payload.city}
             />
          </WidgetErrorBoundary>
        </React.StrictMode>
      );
    }
  }

} else {
  // Fallback to standalone SPA mounting (Dev environment)
  const rootElement = document.getElementById('weather-app') || document.getElementById('root');
  if (rootElement) {
    const locationId = rootElement.getAttribute('data-location-id') ? Number(rootElement.getAttribute('data-location-id')) : 0;
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App locationId={locationId} />
      </React.StrictMode>
    );
  }
}
