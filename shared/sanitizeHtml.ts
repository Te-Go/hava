/**
 * HTML Sanitization Utility
 * 
 * Provides XSS protection for content rendered via dangerouslySetInnerHTML.
 * Uses a whitelist approach to remove potentially dangerous elements and attributes.
 */

// Allowed HTML tags (safe for display)
const ALLOWED_TAGS = new Set([
    'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'blockquote', 'pre', 'code',
    'hr', 'figure', 'figcaption',
    'article', 'section', 'header', 'footer', 'aside', 'nav', 'main'
]);

// Allowed attributes per tag
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
    'a': new Set(['href', 'title', 'target', 'rel']),
    'img': new Set(['src', 'alt', 'title', 'width', 'height', 'loading']),
    '*': new Set(['class', 'id', 'style']) // Global attributes
};

// Dangerous patterns to remove
const DANGEROUS_PATTERNS = [
    /<script[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?<\/iframe>/gi,
    /<object[\s\S]*?<\/object>/gi,
    /<embed[\s\S]*?>/gi,
    /<form[\s\S]*?<\/form>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=, onerror=
    /data:/gi, // Data URIs (can contain scripts)
    /<meta[\s\S]*?>/gi,
    /<link[\s\S]*?>/gi,
    /<base[\s\S]*?>/gi,
    /<style[\s\S]*?<\/style>/gi
];

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Removes dangerous tags, attributes, and patterns.
 * 
 * @param html - The raw HTML string to sanitize
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export const sanitizeHtml = (html: string): string => {
    if (!html) return '';

    let sanitized = html;

    // 1. Remove dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
        sanitized = sanitized.replace(pattern, '');
    }

    // 2. Remove disallowed attributes from remaining tags
    // Match any HTML tag and clean up its attributes
    sanitized = sanitized.replace(/<(\w+)([^>]*)>/g, (match, tagName, attributes) => {
        const tag = tagName.toLowerCase();

        // Remove entire tag if not in whitelist (but keep content for non-container tags)
        if (!ALLOWED_TAGS.has(tag)) {
            return ''; // Remove disallowed tags entirely
        }

        if (!attributes.trim()) {
            return `<${tag}>`;
        }

        // Parse and filter attributes
        const allowedForTag = ALLOWED_ATTRIBUTES[tag] || new Set();
        const globalAllowed = ALLOWED_ATTRIBUTES['*'];

        const cleanAttributes: string[] = [];
        const attrRegex = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
        let attrMatch;

        while ((attrMatch = attrRegex.exec(attributes)) !== null) {
            const attrName = attrMatch[1].toLowerCase();
            const attrValue = attrMatch[2] || attrMatch[3] || attrMatch[4] || '';

            // Check if attribute is allowed
            if (allowedForTag.has(attrName) || globalAllowed.has(attrName)) {
                // Additional check for href/src to prevent javascript: URLs
                if (attrName === 'href' || attrName === 'src') {
                    if (attrValue.toLowerCase().startsWith('javascript:') ||
                        attrValue.toLowerCase().startsWith('vbscript:') ||
                        attrValue.toLowerCase().startsWith('data:')) {
                        continue; // Skip dangerous URLs
                    }
                }

                // For anchor tags, enforce rel="noopener noreferrer" for external links
                if (tag === 'a' && attrName === 'href' && attrValue.startsWith('http')) {
                    cleanAttributes.push(`${attrName}="${attrValue}"`);
                    if (!attributes.includes('rel=')) {
                        cleanAttributes.push('rel="noopener noreferrer"');
                    }
                } else {
                    cleanAttributes.push(`${attrName}="${attrValue}"`);
                }
            }
        }

        return cleanAttributes.length > 0
            ? `<${tag} ${cleanAttributes.join(' ')}>`
            : `<${tag}>`;
    });

    return sanitized;
};

/**
 * Light sanitization for trusted sources (CONFIG.ads, internal content).
 * Only removes the most dangerous patterns but preserves more elements.
 * Use this for content from your own WordPress/CMS that you control.
 */
export const sanitizeHtmlLight = (html: string): string => {
    if (!html) return '';

    let sanitized = html;

    // Only remove the most critical XSS vectors
    const criticalPatterns = [
        /javascript:/gi,
        /vbscript:/gi,
        /on\w+\s*=/gi // Event handlers
    ];

    for (const pattern of criticalPatterns) {
        sanitized = sanitized.replace(pattern, '');
    }

    return sanitized;
};

export default sanitizeHtml;
