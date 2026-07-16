import React from 'react';
import { toSlug } from '../services/weatherService';
import { getParentCity } from '../shared/cityData';

interface BreadcrumbProps {
    cityName: string;
    view: 'home' | 'tomorrow' | '15-days';
    parentCity?: string;
}

/**
 * SEO Breadcrumb Navigation Component
 * Renders visible breadcrumbs matching the JSON-LD schema
 */
const SEOBreadcrumb: React.FC<BreadcrumbProps> = ({ cityName, view, parentCity }) => {
    const citySlug = toSlug(cityName);

    // Auto-detect parent city for districts if not explicitly provided
    const effectiveParentCity = parentCity || getParentCity(cityName);

    const crumbs = [
        { label: 'Ana Sayfa', href: '/' },
        { label: 'Hava Durumu', href: '/hava-durumu' }
    ];

    if (effectiveParentCity) {
        const parentSlug = toSlug(effectiveParentCity);
        crumbs.push({ label: effectiveParentCity, href: `/hava-durumu/${parentSlug}` });
        // Current city is the district
        crumbs.push({ label: cityName, href: `/hava-durumu/${parentSlug}/${citySlug}` });
    } else {
        crumbs.push({ label: cityName, href: `/hava-durumu/${citySlug}` });
    }

    if (view === '15-days') {
        const baseUrl = effectiveParentCity
            ? `/hava-durumu/${toSlug(effectiveParentCity)}/${citySlug}`
            : `/hava-durumu/${citySlug}`;
        crumbs.push({ label: '15 Günlük Tahmin', href: `${baseUrl}/15-gunluk` });
    } else if (view === 'tomorrow') {
        const baseUrl = effectiveParentCity
            ? `/hava-durumu/${toSlug(effectiveParentCity)}/${citySlug}`
            : `/hava-durumu/${citySlug}`;
        crumbs.push({ label: 'Yarın', href: `${baseUrl}/yarin` });
    }

    return (
        <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                {crumbs.map((crumb, index) => (
                    <li key={crumb.href} className="flex items-center">
                        {index > 0 && (
                            <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
                        )}
                        {index === crumbs.length - 1 ? (
                            <span className="font-medium text-slate-700 dark:text-slate-300" aria-current="page">
                                {crumb.label}
                            </span>
                        ) : (
                            <a
                                href={crumb.href}
                                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                {crumb.label}
                            </a>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default SEOBreadcrumb;
