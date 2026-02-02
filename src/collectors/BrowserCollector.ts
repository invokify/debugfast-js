import type { BrowserInfo, Collector } from '../core/types';
import { parseUserAgent } from '../utils/helpers';

/**
 * Collects browser and device information
 */
export class BrowserCollector implements Collector {
  init(): void {
    // No initialization needed - data is collected on demand
  }

  destroy(): void {
    // No cleanup needed
  }

  collect(): BrowserInfo {
    const ua = navigator.userAgent;
    const parsed = parseUserAgent(ua);

    return {
      userAgent: ua,
      browser: parsed.browser,
      browserVersion: parsed.browserVersion,
      os: parsed.os,
      osVersion: parsed.osVersion,
      deviceType: parsed.deviceType,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      screenWidth: screen.width,
      screenHeight: screen.height,
      devicePixelRatio: window.devicePixelRatio || 1,
      url: window.location.href,
      referrer: document.referrer,
      language: navigator.language,
      online: navigator.onLine,
    };
  }
}
