/**
 * Generate a UUID v4 for error reports
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Truncate a string to a maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Safely stringify a value for logging
 */
export function safeStringify(value: unknown, maxLength = 1000): string {
  try {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'string') return truncate(value, maxLength);
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (value instanceof Error) {
      return truncate(`${value.name}: ${value.message}`, maxLength);
    }
    const str = JSON.stringify(value);
    return truncate(str, maxLength);
  } catch {
    return '[Unserializable]';
  }
}

/**
 * Get a CSS selector for an element
 */
export function getSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body && parts.length < 5) {
    let selector = current.tagName.toLowerCase();

    if (current.className && typeof current.className === 'string') {
      const classes = current.className
        .split(/\s+/)
        .filter((c) => c && !c.startsWith('_'))
        .slice(0, 2);
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`;
      }
    }

    const parent: Element | null = current.parentElement;
    if (parent) {
      const currentTagName = current.tagName;
      const siblings = Array.from(parent.children).filter(
        (child: Element) => child.tagName === currentTagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(selector);
    current = parent;
  }

  return parts.join(' > ');
}

/**
 * Get visible text from an element (truncated)
 */
export function getElementText(element: Element, maxLength = 50): string {
  const text =
    element.textContent?.trim().replace(/\s+/g, ' ') ||
    (element as HTMLInputElement).value ||
    element.getAttribute('aria-label') ||
    element.getAttribute('title') ||
    '';
  return truncate(text, maxLength);
}

/**
 * Check if an input is sensitive (password, credit card, etc.)
 */
export function isSensitiveInput(element: Element): boolean {
  if (!(element instanceof HTMLInputElement)) return false;

  const sensitiveTypes = ['password', 'credit-card', 'cc-number', 'cc-cvc', 'cc-exp'];
  if (sensitiveTypes.includes(element.type)) return true;

  const sensitivePatterns = /password|credit|card|cvv|cvc|ssn|social|secret|token/i;
  const name = element.name || '';
  const id = element.id || '';
  const autocomplete = element.autocomplete || '';

  return (
    sensitivePatterns.test(name) ||
    sensitivePatterns.test(id) ||
    sensitivePatterns.test(autocomplete)
  );
}

/**
 * Mask sensitive value
 */
export function maskValue(value: string): string {
  if (!value) return '';
  if (value.length <= 4) return '****';
  return '*'.repeat(value.length - 4) + value.slice(-4);
}

/**
 * Create a circular buffer for storing recent items
 */
export function createCircularBuffer<T>(maxSize: number): {
  push: (item: T) => void;
  getAll: () => T[];
  clear: () => void;
} {
  const buffer: T[] = [];

  return {
    push(item: T) {
      buffer.push(item);
      if (buffer.length > maxSize) {
        buffer.shift();
      }
    },
    getAll() {
      return [...buffer];
    },
    clear() {
      buffer.length = 0;
    },
  };
}

/**
 * Parse user agent string for browser info
 */
export function parseUserAgent(ua: string): {
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
} {
  const result: ReturnType<typeof parseUserAgent> = {};

  // Browser detection
  const browserPatterns: [string, RegExp][] = [
    ['Chrome', /Chrome\/(\d+)/],
    ['Firefox', /Firefox\/(\d+)/],
    ['Safari', /Version\/(\d+).*Safari/],
    ['Edge', /Edg\/(\d+)/],
    ['Opera', /OPR\/(\d+)/],
    ['IE', /MSIE (\d+)|Trident.*rv:(\d+)/],
  ];

  for (const [name, pattern] of browserPatterns) {
    const match = ua.match(pattern);
    if (match) {
      result.browser = name;
      result.browserVersion = match[1] || match[2];
      break;
    }
  }

  // OS detection
  if (/Windows NT (\d+\.\d+)/.test(ua)) {
    result.os = 'Windows';
    result.osVersion = ua.match(/Windows NT (\d+\.\d+)/)?.[1];
  } else if (/Mac OS X (\d+[._]\d+)/.test(ua)) {
    result.os = 'macOS';
    result.osVersion = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace(/_/g, '.');
  } else if (/Linux/.test(ua)) {
    result.os = 'Linux';
  } else if (/Android (\d+)/.test(ua)) {
    result.os = 'Android';
    result.osVersion = ua.match(/Android (\d+)/)?.[1];
  } else if (/iPhone|iPad|iPod/.test(ua)) {
    result.os = 'iOS';
    result.osVersion = ua.match(/OS (\d+[._]\d+)/)?.[1]?.replace(/_/g, '.');
  }

  // Device type detection
  if (/Mobile|Android.*Mobile|iPhone|iPod/.test(ua)) {
    result.deviceType = 'mobile';
  } else if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) {
    result.deviceType = 'tablet';
  } else {
    result.deviceType = 'desktop';
  }

  return result;
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
