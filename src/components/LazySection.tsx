
import React, { useEffect, useRef, useState, ReactNode } from 'react';

interface LazySectionProps {
    children: ReactNode;
    placeholder?: ReactNode;
    rootMargin?: string;
    className?: string;
}

/**
 * LazySection - Lazy loading wrapper using IntersectionObserver
 * 
 * Delays rendering of children until the component is about to enter the viewport.
 * Improves initial page load performance and Core Web Vitals.
 * 
 * @param children - Content to render when visible
 * @param placeholder - Optional placeholder to show before content loads
 * @param rootMargin - Distance from viewport to trigger load (default: 100px)
 * @param className - Optional CSS class for the wrapper
 */
const LazySection: React.FC<LazySectionProps> = ({
    children,
    placeholder = <div className="min-h-[200px] animate-pulse bg-slate-100/50 dark:bg-slate-800/50 rounded-xl" />,
    rootMargin = '100px',
    className = ''
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Skip IntersectionObserver if not supported (SSR or old browsers)
        if (typeof IntersectionObserver === 'undefined') {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Stop observing once visible
                }
            },
            { rootMargin }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [rootMargin]);

    return (
        <div ref={ref} className={className}>
            {isVisible ? children : placeholder}
        </div>
    );
};

export default LazySection;
