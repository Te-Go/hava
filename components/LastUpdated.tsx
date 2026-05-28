import React from 'react';

interface LastUpdatedProps {
    className?: string;
}

/**
 * Last Updated Timestamp Component
 * Shows freshness signal for SEO and user trust
 */
const LastUpdated: React.FC<LastUpdatedProps> = ({ className = '' }) => {
    const now = new Date();

    // Turkish date formatting
    const turkishMonths = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    const day = now.getDate();
    const month = turkishMonths[now.getMonth()];
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    const formattedDate = `${day} ${month} ${year}, ${hours}:${minutes}`;

    return (
        <div className={`flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 ${className}`}>
            <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            <span>
                Son güncelleme: <time dateTime={now.toISOString()}>{formattedDate}</time>
            </span>
        </div>
    );
};

export default LastUpdated;
