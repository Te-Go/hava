
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Root Element ID changed to 'weather-app' to match Server-Side Template spec
// Fallback to 'root' for dev environment if 'weather-app' is missing
const rootElement = document.getElementById('weather-app') || document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Extract the Location ID injected by WordPress/PHP
// This decouples React from URL slug parsing for the initial state
const locationId = rootElement.getAttribute('data-location-id') 
  ? Number(rootElement.getAttribute('data-location-id')) 
  : 0;

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App locationId={locationId} />
  </React.StrictMode>
);
