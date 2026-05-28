
import React, { useState, useEffect } from 'react';
import { WeatherData } from '../types';
import { Icon } from './Icons';
import {
  WeatherAlert,
  getAlertsForCity,
  ALERT_SEVERITY_CONFIG,
  ALERT_TYPE_LABELS
} from '../services/mgmAlerts';

interface AlertBarProps {
  data: WeatherData;
}

const AlertBar: React.FC<AlertBarProps> = ({ data }) => {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const cityAlerts = await getAlertsForCity(data.city, {
          currentTemp: data.currentTemp,
          windSpeed: data.windSpeed,
          uvIndex: data.uvIndex,
          rainProb: data.rainProb,
          icon: data.icon
        });
        setAlerts(cityAlerts);
      } catch (error) {
        console.warn('Alert fetch failed:', error);
        setAlerts([]);
      }
      setLoading(false);
    };

    fetchAlerts();
  }, [data.city, data.currentTemp, data.windSpeed, data.uvIndex, data.rainProb, data.icon]);

  // Don't render if no alerts or loading
  if (loading || alerts.length === 0) return null;

  // Show only the highest severity alert (or first 2 if multiple severe)
  const visibleAlerts = alerts.slice(0, 2);

  return (
    <div className="space-y-2 mb-4">
      {visibleAlerts.map((alert) => {
        const config = ALERT_SEVERITY_CONFIG[alert.severity];
        const typeLabel = ALERT_TYPE_LABELS[alert.type] || alert.type;

        return (
          <div
            key={alert.id}
            className={`
              w-full px-4 py-3 rounded-xl flex items-start gap-3 shadow-sm border
              ${config.bgClass} ${config.borderClass} ${config.textClass}
            `}
          >
            <Icon.AlertTriangle
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: config.iconColor }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {config.label}
                </span>
                <span className="text-xs opacity-60">•</span>
                <span className="text-xs font-medium opacity-80">
                  {typeLabel}
                </span>
                {alert.source === 'mgm' && (
                  <>
                    <span className="text-xs opacity-60">•</span>
                    <span className="text-[10px] font-medium opacity-60 uppercase">
                      MGM
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm font-medium leading-tight mt-1">
                {alert.description}
              </p>
              {alert.url && (
                <a
                  href={alert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline opacity-70 hover:opacity-100 mt-1 inline-block"
                >
                  Detaylı bilgi →
                </a>
              )}
            </div>
          </div>
        );
      })}

      {/* Show count if more alerts exist */}
      {alerts.length > 2 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          +{alerts.length - 2} daha fazla uyarı
        </p>
      )}
    </div>
  );
};

export default AlertBar;

