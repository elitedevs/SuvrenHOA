import DOMPurify from 'dompurify';

/**
 * Sanitize a string for safe insertion into HTML.
 * Escapes all HTML entities — use for text content in popups, labels, etc.
 */
export function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * Sanitize HTML content that may contain allowed markup.
 * Strips dangerous tags/attributes (scripts, event handlers, etc.).
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'br', 'p', 'div'],
    ALLOWED_ATTR: ['style', 'class'],
  });
}
