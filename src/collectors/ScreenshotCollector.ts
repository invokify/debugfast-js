import type { Collector, Screenshot } from '../core/types';

/**
 * Captures viewport screenshots using html2canvas
 */
export class ScreenshotCollector implements Collector {
  private html2canvasModule: typeof import('html2canvas') | null = null;

  constructor(private quality: number = 0.7) {}

  init(): void {
    // Lazy load html2canvas
    this.loadHtml2Canvas();
  }

  destroy(): void {
    this.html2canvasModule = null;
  }

  collect(): Promise<Screenshot | null> {
    return this.capture();
  }

  async capture(): Promise<Screenshot | null> {
    try {
      const html2canvas = await this.getHtml2Canvas();
      if (!html2canvas) {
        return null;
      }

      const canvas = await html2canvas.default(document.body, {
        logging: false,
        useCORS: true,
        allowTaint: true,
        scale: Math.min(window.devicePixelRatio, 2),
        width: window.innerWidth,
        height: window.innerHeight,
        x: window.scrollX,
        y: window.scrollY,
        ignoreElements: (element) => {
          // Ignore hidden elements and iframes (often cause issues)
          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return true;
          }
          // Ignore cross-origin iframes
          if (element.tagName === 'IFRAME') {
            try {
              // This will throw if cross-origin
              const doc = (element as HTMLIFrameElement).contentDocument;
              return !doc;
            } catch {
              return true;
            }
          }
          return false;
        },
      });

      const data = canvas.toDataURL('image/jpeg', this.quality);

      return {
        data,
        mimeType: 'image/jpeg',
        width: canvas.width,
        height: canvas.height,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.warn('[BugFast] Failed to capture screenshot:', error);
      return null;
    }
  }

  private async loadHtml2Canvas(): Promise<void> {
    if (this.html2canvasModule) return;

    try {
      this.html2canvasModule = await import('html2canvas');
    } catch (error) {
      console.warn('[BugFast] Failed to load html2canvas:', error);
    }
  }

  private async getHtml2Canvas(): Promise<typeof import('html2canvas') | null> {
    if (!this.html2canvasModule) {
      await this.loadHtml2Canvas();
    }
    return this.html2canvasModule;
  }
}
