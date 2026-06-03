const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

// Replace AppProps
content = content.replace(/interface AppProps \{\s*locationId\?: number;\s*\}/, 'interface AppProps {\n  locationId?: number;\n  payload?: any;\n}');

// Replace App signature
content = content.replace(/const App: React\.FC<AppProps> = \(\{ locationId = 0 \}\) => \{/, 'const App: React.FC<AppProps> = ({ locationId = 0, payload }) => {');

// Find where fetchData starts and where the useEffect ends
const startIdx = content.indexOf('const fetchData = async () => {');
const endIdx = content.indexOf('}, [currentCity, view.type]);');

if (startIdx !== -1 && endIdx !== -1) {
  const newUseEffectContent = `const fetchData = async () => {
      if (payload && payload.weatherData) {
        setWeatherData(payload.weatherData);
        setTrafficData(payload.weatherData.trafficData || null);
        setMarineData(payload.weatherData.marineData || null);
        setSkiData(payload.weatherData.skiData || null);
        setAgricultureData(payload.weatherData.agricultureData || null);
        setAltitudeData(payload.weatherData.altitudeData || null);
        setFireRiskData(payload.weatherData.fireRiskData || null);
        setTourismData(payload.weatherData.tourismData || null);
        setLoading(false);
        return;
      }
      setLoading(false);
    };

    if (view.type === 'home' || view.type === 'tomorrow' || view.type === '15-days') {
      fetchData();
    }

    return () => {
      isMounted = false;
      abortController.abort();
    };
  `;
  content = content.substring(0, startIdx) + newUseEffectContent + content.substring(endIdx);
  fs.writeFileSync('App.tsx', content);
  console.log('App.tsx updated successfully');
} else {
  console.log('Could not find fetchData block', startIdx, endIdx);
}
