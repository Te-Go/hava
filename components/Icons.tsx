import React from 'react';
import {
  Wind, Droplets, Sun, CloudRain, Thermometer, Navigation,
  Search, MapPin, ChevronRight, ChevronLeft, ChevronDown, Menu, Umbrella, Eye, ArrowUp, ArrowDown, Moon,
  Flame, Bike, Fish, Sprout,
  Cloud, CloudSnow, CloudLightning, AlertTriangle, CloudFog, Snowflake,
  Gauge, Sunrise, FileText, Info, Clock, Calendar,
  Activity, Heart, Shield, Car, Smile,
  Grid, ArrowRight, Coffee, BarChart2
} from 'lucide-react';

export const Icon = {
  Wind,
  Droplets,
  Sun,
  CloudRain,
  Thermometer,
  Navigation,
  Search,
  MapPin,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Menu,
  Umbrella,
  Eye,
  ArrowUp,
  ArrowDown,
  Moon,
  Flame,
  Bike,
  Fish,
  Sprout,
  Cloud,
  CloudSnow,
  CloudLightning,
  AlertTriangle,
  CloudFog,
  Snowflake,
  Gauge,
  Sunrise,
  FileText,
  Info,
  Clock,
  Calendar,
  Activity,
  Heart,
  Shield,
  Car,
  Baby: Smile, // Use Smile as Baby icon substitute
  Grid,
  ArrowRight,
  Coffee,
  BarChart: BarChart2
};

// --- PREMIUM 3D SVG ENGINE (ROBUST & ANIMATED) ---

const GradientDefs = ({ idSuffix }: { idSuffix: string }) => (
  <defs>
    <radialGradient id={`sunGradient-${idSuffix}`} cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stopColor="#FDB813" />
      <stop offset="90%" stopColor="#F5576C" />
    </radialGradient>
    <radialGradient id={`moonGradient-${idSuffix}`} cx="0.4" cy="0.4" r="0.6">
      <stop offset="0%" stopColor="#F1F5F9" />
      <stop offset="100%" stopColor="#475569" />
    </radialGradient>
    <linearGradient id={`cloudGradient-${idSuffix}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="100%" stopColor="#E2E8F0" />
    </linearGradient>
    <linearGradient id={`rainGradient-${idSuffix}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#60A5FA" />
      <stop offset="100%" stopColor="#3B82F6" />
    </linearGradient>
    <linearGradient id={`darkCloudGradient-${idSuffix}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#CBD5E1" />
      <stop offset="100%" stopColor="#64748B" />
    </linearGradient>
    <filter id={`shadow-${idSuffix}`} x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.2" />
    </filter>
  </defs>
);

export const WeatherIcon3D: React.FC<{ type: string, className?: string }> = ({ type, className }) => {
  // Robust random ID for gradients to prevent collisions without relying on useId
  const [idSuffix] = React.useState(() => Math.random().toString(36).substr(2, 9));

  const wrapperClass = `relative w-16 h-16 ${className}`;

  switch (type) {
    case 'sunny':
      return (
        <div className={wrapperClass}>
          <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
            <GradientDefs idSuffix={idSuffix} />
            <g style={{ transformOrigin: '32px 32px', animation: 'spin 12s linear infinite' }}>
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <rect key={i} x="30" y="2" width="4" height="12" rx="2" fill="#FDB813" transform={`rotate(${angle} 32 32)`} opacity="0.6" />
              ))}
            </g>
            <circle cx="32" cy="32" r="18" fill={`url(#sunGradient-${idSuffix})`} filter={`url(#shadow-${idSuffix})`} />
          </svg>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      );

    case 'moon':
      return (
        <div className={wrapperClass}>
          <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
            <GradientDefs idSuffix={idSuffix} />
            <circle cx="32" cy="32" r="16" fill={`url(#moonGradient-${idSuffix})`} filter={`url(#shadow-${idSuffix})`} />
            <circle cx="38" cy="24" r="3" fill="#94A3B8" opacity="0.3" />
            <circle cx="26" cy="36" r="2" fill="#94A3B8" opacity="0.3" />
          </svg>
        </div>
      );

    case 'cloudy':
    case 'fog':
      return (
        <div className={wrapperClass}>
          <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
            <GradientDefs idSuffix={idSuffix} />
            <circle cx="40" cy="24" r="12" fill="#FDB813" style={{ animation: 'pulse 3s infinite' }} />
            <path
              d="M46,28 c0-6.6-5.4-12-12-12 c-6.6,0-12,5.4-12,12 c-0.6,0-1.2,0-1.8,0.2 C19.6,28.6,19,29.8,19,31 c-4.4,0-8,3.6-8,8 s3.6,8,8,8 h27 c6.6,0,12-5.4,12-12 S52.6,28,46,28 z"
              fill={`url(#cloudGradient-${idSuffix})`}
              filter={`url(#shadow-${idSuffix})`}
              style={{ animation: 'float 4s ease-in-out infinite' }}
            />
          </svg>
          <style>{`
            @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-3px); } }
            @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(0.95); } }
          `}</style>
        </div>
      );

    case 'overcast':
      return (
        <div className={wrapperClass}>
          <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
            <GradientDefs idSuffix={idSuffix} />
            {/* Back darker cloud for depth */}
            <path
              d="M50,32 c0-5.5-4.5-10-10-10 c-5.5,0-10,4.5-10,10 c-0.5,0-1,0-1.5,0.1 C28.3,32.5,27.8,33.5,27.8,34.5 c-3.7,0-6.7,3-6.7,6.7 s3,6.7,6.7,6.7 h22.5 c5.5,0,10-4.5,10-10 S55.5,32,50,32 z"
              fill={`url(#darkCloudGradient-${idSuffix})`}
              transform="translate(-6, -6)"
              style={{ animation: 'float 5s ease-in-out infinite reverse' }}
              opacity="0.8"
            />
            {/* Front lighter cloud */}
            <path
              d="M46,28 c0-6.6-5.4-12-12-12 c-6.6,0-12,5.4-12,12 c-0.6,0-1.2,0-1.8,0.2 C19.6,28.6,19,29.8,19,31 c-4.4,0-8,3.6-8,8 s3.6,8,8,8 h27 c6.6,0,12-5.4,12-12 S52.6,28,46,28 z"
              fill={`url(#cloudGradient-${idSuffix})`}
              filter={`url(#shadow-${idSuffix})`}
              style={{ animation: 'float 4s ease-in-out infinite' }}
            />
          </svg>
        </div>
      );

    case 'cloudy-night':
      return (
        <div className={wrapperClass}>
          <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
            <GradientDefs idSuffix={idSuffix} />
            <circle cx="40" cy="24" r="10" fill={`url(#moonGradient-${idSuffix})`} style={{ animation: 'pulse 3s infinite' }} />
            <path
              d="M46,28 c0-6.6-5.4-12-12-12 c-6.6,0-12,5.4-12,12 c-0.6,0-1.2,0-1.8,0.2 C19.6,28.6,19,29.8,19,31 c-4.4,0-8,3.6-8,8 s3.6,8,8,8 h27 c6.6,0,12-5.4,12-12 S52.6,28,46,28 z"
              fill={`url(#cloudGradient-${idSuffix})`}
              filter={`url(#shadow-${idSuffix})`}
              style={{ animation: 'float 4s ease-in-out infinite' }}
            />
          </svg>
        </div>
      );

    case 'rain':
    case 'drizzle':
      return (
        <div className={wrapperClass}>
          <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
            <GradientDefs idSuffix={idSuffix} />
            <g fill={`url(#rainGradient-${idSuffix})`}>
              <path d="M24,48 Q24,56 22,56 Q20,56 20,48 L22,40 Z" style={{ animation: 'rain 1s linear infinite' }} />
              <path d="M34,52 Q34,60 32,60 Q30,60 30,52 L32,44 Z" style={{ animation: 'rain 1.2s linear infinite', animationDelay: '0.4s' }} />
              <path d="M44,48 Q44,56 42,56 Q40,56 40,48 L42,40 Z" style={{ animation: 'rain 0.9s linear infinite', animationDelay: '0.2s' }} />
            </g>
            <path
              d="M46,24 c0-6.6-5.4-12-12-12 c-6.6,0-12,5.4-12,12 c-0.6,0-1.2,0-1.8,0.2 C19.6,24.6,19,25.8,19,27 c-4.4,0-8,3.6-8,8 s3.6,8,8,8 h27 c6.6,0,12-5.4,12-12 S52.6,24,46,24 z"
              fill={`url(#cloudGradient-${idSuffix})`}
              filter={`url(#shadow-${idSuffix})`}
            />
          </svg>
          <style>{`@keyframes rain { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(15px); opacity: 0; } }`}</style>
        </div>
      );

    case 'storm':
    case 'thunderstorm':
      return (
        <div className={wrapperClass}>
          <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
            <GradientDefs idSuffix={idSuffix} />
            <path
              d="M28,40 L22,54 L30,54 L26,68 L38,50 L30,50 L34,40 Z"
              fill="#F59E0B"
              stroke="#FFF"
              strokeWidth="1"
              style={{ animation: 'flash 2s infinite' }}
            />
            <path
              d="M46,24 c0-6.6-5.4-12-12-12 c-6.6,0-12,5.4-12,12 c-0.6,0-1.2,0-1.8,0.2 C19.6,24.6,19,25.8,19,27 c-4.4,0-8,3.6-8,8 s3.6,8,8,8 h27 c6.6,0,12-5.4,12-12 S52.6,24,46,24 z"
              fill="#64748B"
              filter={`url(#shadow-${idSuffix})`}
            />
          </svg>
          <style>{`@keyframes flash { 0%, 100% { opacity: 0; } 10%, 90% { opacity: 0; } 15%, 85% { opacity: 1; } }`}</style>
        </div>
      );

    case 'snow':
      return (
        <div className={wrapperClass}>
          <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
            <GradientDefs idSuffix={idSuffix} />
            <g fill="#FFFFFF" stroke="#E2E8F0">
              <circle cx="24" cy="50" r="3" style={{ animation: 'snow 2.5s linear infinite' }} />
              <circle cx="34" cy="56" r="2.5" style={{ animation: 'snow 2s linear infinite', animationDelay: '0.5s' }} />
              <circle cx="44" cy="50" r="3" style={{ animation: 'snow 3s linear infinite', animationDelay: '1s' }} />
            </g>
            <path
              d="M46,24 c0-6.6-5.4-12-12-12 c-6.6,0-12,5.4-12,12 c-0.6,0-1.2,0-1.8,0.2 C19.6,24.6,19,25.8,19,27 c-4.4,0-8,3.6-8,8 s3.6,8,8,8 h27 c6.6,0,12-5.4,12-12 S52.6,24,46,24 z"
              fill={`url(#cloudGradient-${idSuffix})`}
              filter={`url(#shadow-${idSuffix})`}
            />
          </svg>
          <style>{`@keyframes snow { 0% { transform: translateY(0); opacity: 0.8; } 100% { transform: translateY(15px); opacity: 0; } }`}</style>
        </div>
      );

    default:
      return (
        <div className={wrapperClass}>
          <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
            <GradientDefs idSuffix={idSuffix} />
            <circle cx="40" cy="24" r="12" fill="#FDB813" />
            <path d="M46,28 c0-6.6-5.4-12-12-12 c-6.6,0-12,5.4-12,12 c-0.6,0-1.2,0-1.8,0.2 C19.6,28.6,19,29.8,19,31 c-4.4,0-8,3.6-8,8 s3.6,8,8,8 h27 c6.6,0,12-5.4,12-12 S52.6,28,46,28 z" fill={`url(#cloudGradient-${idSuffix})`} filter={`url(#shadow-${idSuffix})`} />
          </svg>
        </div>
      );
  }
};
