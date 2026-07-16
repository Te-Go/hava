/**
 * Centralized Weather Icon Utilities
 * Single source of truth for all weather icon mappings
 */

import React from 'react';
import { Icon } from '../components/Icons';

// Icon name type for type safety
export type WeatherIconName =
    | 'sunny' | 'moon'
    | 'cloudy' | 'cloudy-night' | 'overcast'
    | 'rain' | 'drizzle' | 'freezing-rain'
    | 'snow' | 'sleet' | 'hail'
    | 'storm' | 'fog' | 'wind';

// Color mappings for consistency
const ICON_COLORS: Record<WeatherIconName, string> = {
    sunny: 'text-orange-400',
    moon: 'text-slate-400',
    cloudy: 'text-slate-400',
    'cloudy-night': 'text-slate-500',
    overcast: 'text-slate-500',
    rain: 'text-blue-400',
    drizzle: 'text-blue-300',
    'freezing-rain': 'text-cyan-400',
    snow: 'text-cyan-300',
    sleet: 'text-slate-300',
    hail: 'text-slate-400',
    storm: 'text-amber-500',
    fog: 'text-slate-400',
    wind: 'text-teal-400',
};

/**
 * Get a Lucide icon component for weather display
 * Use this in charts, hourly forecast, and small UI elements
 */
export const getWeatherIconComponent = (
    iconName: string,
    size: number = 24
): React.ReactElement => {
    const color = ICON_COLORS[iconName as WeatherIconName] || 'text-slate-400';
    const props = { size, className: color };

    switch (iconName) {
        case 'sunny':
            return React.createElement(Icon.Sun, props);
        case 'moon':
            return React.createElement(Icon.Moon, props);
        case 'cloudy':
        case 'cloudy-night':
        case 'overcast':
            return React.createElement(Icon.Cloud, props);
        case 'rain':
        case 'drizzle':
        case 'freezing-rain':
            return React.createElement(Icon.CloudRain, props);
        case 'snow':
        case 'sleet':
            return React.createElement(Icon.CloudSnow, props);
        case 'hail':
            return React.createElement(Icon.CloudSnow, { ...props, className: 'text-slate-400' });
        case 'storm':
            return React.createElement(Icon.CloudLightning, props);
        case 'fog':
            return React.createElement(Icon.CloudFog, props);
        case 'wind':
            return React.createElement(Icon.Wind, props);
        default:
            return React.createElement(Icon.Cloud, { ...props, className: 'text-slate-400' });
    }
};

/**
 * Get icon color class for consistent styling
 */
export const getWeatherIconColor = (iconName: string): string => {
    return ICON_COLORS[iconName as WeatherIconName] || 'text-slate-400';
};

/**
 * Get Turkish condition text for an icon
 */
export const getConditionText = (iconName: string): string => {
    const conditions: Record<string, string> = {
        sunny: 'Güneşli',
        moon: 'Açık',
        cloudy: 'Parçalı Bulutlu',
        'cloudy-night': 'Parçalı Bulutlu',
        overcast: 'Kapalı',
        rain: 'Yağmurlu',
        drizzle: 'Çiseleme',
        'freezing-rain': 'Dondurucu Yağmur',
        snow: 'Kar Yağışlı',
        sleet: 'Sulu Kar',
        hail: 'Dolu',
        storm: 'Fırtınalı',
        fog: 'Sisli',
        wind: 'Rüzgarlı',
    };
    return conditions[iconName] || 'Bulutlu';
};
