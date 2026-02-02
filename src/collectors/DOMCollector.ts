import type { Collector, DOMSnapshot } from '../core/types';

const MAX_DOM_SIZE = 500000; // 500KB limit

/**
 * Captures DOM snapshots with sensitive data masking
 */
export class DOMCollector implements Collector {
  constructor(private maskSensitive: boolean = true) {}

  init(): void {
    // No initialization needed - data is collected on demand
  }

  destroy(): void {
    // No cleanup needed
  }

  collect(): DOMSnapshot {
    const html = this.serializeDOM();
    const truncated = html.length > MAX_DOM_SIZE;

    return {
      html: truncated ? html.substring(0, MAX_DOM_SIZE) : html,
      title: document.title,
      timestamp: Date.now(),
      truncated,
    };
  }

  private serializeDOM(): string {
    // Clone the document to avoid modifying the original
    const docClone = document.documentElement.cloneNode(true) as HTMLElement;

    if (this.maskSensitive) {
      this.maskSensitiveInputs(docClone);
    }

    // Remove script contents for security
    const scripts = docClone.querySelectorAll('script');
    scripts.forEach((script) => {
      script.textContent = '';
    });

    // Remove inline event handlers
    const allElements = docClone.querySelectorAll('*');
    allElements.forEach((el) => {
      const attrs = Array.from(el.attributes);
      attrs.forEach((attr) => {
        if (attr.name.startsWith('on')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return docClone.outerHTML;
  }

  private maskSensitiveInputs(root: HTMLElement): void {
    const sensitiveSelectors = [
      'input[type="password"]',
      'input[type="credit-card"]',
      'input[name*="password"]',
      'input[name*="credit"]',
      'input[name*="card"]',
      'input[name*="cvv"]',
      'input[name*="cvc"]',
      'input[name*="ssn"]',
      'input[name*="social"]',
      'input[name*="secret"]',
      'input[name*="token"]',
      'input[autocomplete*="password"]',
      'input[autocomplete*="cc-"]',
    ];

    sensitiveSelectors.forEach((selector) => {
      const inputs = root.querySelectorAll(selector) as NodeListOf<HTMLInputElement>;
      inputs.forEach((input) => {
        if (input.value) {
          input.value = '********';
        }
        input.setAttribute('data-masked', 'true');
      });
    });

    // Also mask any input marked with data-sensitive attribute
    const markedInputs = root.querySelectorAll(
      'input[data-sensitive]'
    ) as NodeListOf<HTMLInputElement>;
    markedInputs.forEach((input) => {
      if (input.value) {
        input.value = '********';
      }
    });
  }
}
