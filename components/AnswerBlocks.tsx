/**
 * AnswerBlocks Component
 * 
 * Renders SEO-optimized content blocks for AI citation and zero-click visibility:
 * - Answer-First Summary Block (AI Overview target)
 * - Timeframe H2 Sections with date stamps
 * - Forecast Summary Table for rich snippets
 * 
 * All content is visible HTML (not JS-only) for crawler accessibility.
 */

import React from 'react';
import { WeatherCommentary, TimeframeBlock, ForecastTableRow } from '../shared/weatherCommentary';
import { Icon } from './Icons';

// ============================================================================
// ICON MAPPING FOR TABLE
// ============================================================================

const TABLE_ICONS: Record<string, React.ReactNode> = {
    'thermometer': <Icon.Thermometer className="w-4 h-4" />,
    'cloud-rain': <Icon.CloudRain className="w-4 h-4" />,
    'wind': <Icon.Wind className="w-4 h-4" />,
    'droplets': <Icon.Droplets className="w-4 h-4" />,
    'sun': <Icon.Sun className="w-4 h-4" />,
    'cloud': <Icon.Cloud className="w-4 h-4" />,
    'calendar': <Icon.Calendar className="w-4 h-4" />,
};

// ============================================================================
// ANSWER BLOCK (AI Primary Target)
// ============================================================================

interface AnswerBlockProps {
    content: string;
    city: string;
}

const AnswerBlock: React.FC<AnswerBlockProps> = ({ content, city }) => {
    return (
        <div
            className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 
                       rounded-xl p-4 mb-4 border border-sky-100 dark:border-sky-800"
            itemScope
            itemType="https://schema.org/WebPage"
        >
            <p
                className="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed"
                itemProp="description"
            >
                {content}
            </p>
        </div>
    );
};

// ============================================================================
// TIMEFRAME SECTION (H2 with Date Stamp)
// ============================================================================

interface TimeframeSectionProps {
    block: TimeframeBlock;
    useRegionHeading?: boolean;
}

const TimeframeSection: React.FC<TimeframeSectionProps> = ({ block, useRegionHeading = false }) => {
    const heading = useRegionHeading ? block.headingWithRegion : block.heading;

    return (
        <section className="mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                {heading}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {block.content}
            </p>
            {block.comparison && (
                <span className={`
                    inline-flex items-center mt-2 px-2 py-0.5 rounded text-xs font-medium
                    ${block.comparison === 'artıyor' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                    ${block.comparison === 'azalıyor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                    ${block.comparison === 'benzer' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' : ''}
                `}>
                    {block.comparison === 'artıyor' && '↑ '}
                    {block.comparison === 'azalıyor' && '↓ '}
                    Sıcaklık {block.comparison}
                </span>
            )}
        </section>
    );
};

// ============================================================================
// FORECAST TABLE (Rich Snippet Opportunity)
// ============================================================================

interface ForecastTableProps {
    rows: ForecastTableRow[];
    city: string;
}

const ForecastTable: React.FC<ForecastTableProps> = ({ rows, city }) => {
    if (rows.length === 0) return null;

    return (
        <div className="mb-4 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <table
                className="w-full text-sm"
                itemScope
                itemType="https://schema.org/Table"
            >
                <caption className="sr-only">{city} Hava Durumu Özeti</caption>
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                        <th className="text-left px-3 py-2 font-medium text-slate-600 dark:text-slate-400">Metrik</th>
                        <th className="text-left px-3 py-2 font-medium text-slate-600 dark:text-slate-400">Değer</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr
                            key={row.metric}
                            className={index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/30'}
                        >
                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                {row.icon && TABLE_ICONS[row.icon]}
                                {row.metric}
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                                {row.value}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ============================================================================
// FORECAST ACCURACY TAG (EEAT Enhancement)
// ============================================================================

interface AccuracyTagProps {
    displayDate: string;
}

const AccuracyTag: React.FC<AccuracyTagProps> = ({ displayDate }) => {
    return (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                📊 Meteorolojik Modellere Dayalı Tahmin
            </span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <time dateTime={new Date().toISOString()}>
                Güncelleme: {displayDate}
            </time>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface AnswerBlocksProps {
    commentary: WeatherCommentary;
    showTable?: boolean;
    showTimeframeSection?: boolean;
    showAccuracyTag?: boolean;
    useRegionHeading?: boolean;
    className?: string;
}

const AnswerBlocks: React.FC<AnswerBlocksProps> = ({
    commentary,
    showTable = true,
    showTimeframeSection = true,
    showAccuracyTag = true,
    useRegionHeading = false,
    className = ''
}) => {
    return (
        <article className={`answer-blocks ${className}`}>
            {/* Answer-First Summary Block - AI Primary Target */}
            <AnswerBlock
                content={commentary.answerBlock}
                city={commentary.city}
            />

            {/* Timeframe H2 Section with Date Stamp */}
            {showTimeframeSection && (
                <TimeframeSection
                    block={commentary.timeframeBlock}
                    useRegionHeading={useRegionHeading}
                />
            )}

            {/* Forecast Summary Table */}
            {showTable && (
                <ForecastTable
                    rows={commentary.forecastTable}
                    city={commentary.city}
                />
            )}

            {/* Accuracy Tag for EEAT */}
            {showAccuracyTag && (
                <AccuracyTag displayDate={commentary.metadata.displayDate} />
            )}
        </article>
    );
};

export default AnswerBlocks;
