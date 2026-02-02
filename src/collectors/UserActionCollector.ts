import type { Collector, UserAction } from '../core/types';
import {
  createCircularBuffer,
  debounce,
  getElementText,
  getSelector,
  isSensitiveInput,
  maskValue,
} from '../utils/helpers';

/**
 * Tracks user interactions as a breadcrumb trail
 */
export class UserActionCollector implements Collector {
  private buffer: ReturnType<typeof createCircularBuffer<UserAction>>;
  private initialized = false;
  private boundHandlers: {
    click: (e: MouseEvent) => void;
    input: (e: Event) => void;
    submit: (e: SubmitEvent) => void;
    scroll: () => void;
    popstate: () => void;
  } | null = null;

  constructor(
    private maxActions: number = 30,
    private maskSensitive: boolean = true
  ) {
    this.buffer = createCircularBuffer<UserAction>(maxActions);
  }

  init(): void {
    if (this.initialized) return;

    this.boundHandlers = {
      click: this.handleClick.bind(this),
      input: debounce(this.handleInput.bind(this), 100),
      submit: this.handleSubmit.bind(this),
      scroll: debounce(this.handleScroll.bind(this), 200),
      popstate: this.handleNavigation.bind(this),
    };

    document.addEventListener('click', this.boundHandlers.click, { capture: true, passive: true });
    document.addEventListener('input', this.boundHandlers.input, { capture: true, passive: true });
    document.addEventListener('submit', this.boundHandlers.submit, { capture: true, passive: true });
    window.addEventListener('scroll', this.boundHandlers.scroll, { passive: true });
    window.addEventListener('popstate', this.boundHandlers.popstate);

    // Capture initial navigation
    this.addAction({
      type: 'navigation',
      metadata: { url: window.location.href },
      timestamp: Date.now(),
    });

    this.initialized = true;
  }

  destroy(): void {
    if (!this.initialized || !this.boundHandlers) return;

    document.removeEventListener('click', this.boundHandlers.click, { capture: true });
    document.removeEventListener('input', this.boundHandlers.input, { capture: true });
    document.removeEventListener('submit', this.boundHandlers.submit, { capture: true });
    window.removeEventListener('scroll', this.boundHandlers.scroll);
    window.removeEventListener('popstate', this.boundHandlers.popstate);

    this.boundHandlers = null;
    this.buffer.clear();
    this.initialized = false;
  }

  collect(): UserAction[] {
    return this.buffer.getAll();
  }

  private addAction(action: UserAction): void {
    this.buffer.push(action);
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as Element;
    if (!target || !(target instanceof Element)) return;

    this.addAction({
      type: 'click',
      selector: getSelector(target),
      tagName: target.tagName.toLowerCase(),
      text: getElementText(target),
      timestamp: Date.now(),
    });
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (!target) return;

    let value = target.value || '';

    if (this.maskSensitive && isSensitiveInput(target)) {
      value = maskValue(value);
    } else {
      // Truncate long values
      value = value.length > 50 ? value.substring(0, 47) + '...' : value;
    }

    this.addAction({
      type: 'input',
      selector: getSelector(target),
      tagName: target.tagName.toLowerCase(),
      value,
      timestamp: Date.now(),
    });
  }

  private handleSubmit(event: SubmitEvent): void {
    const target = event.target as HTMLFormElement;
    if (!target) return;

    this.addAction({
      type: 'submit',
      selector: getSelector(target),
      tagName: 'form',
      metadata: {
        action: target.action,
        method: target.method,
      },
      timestamp: Date.now(),
    });
  }

  private handleScroll(): void {
    this.addAction({
      type: 'scroll',
      metadata: {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      },
      timestamp: Date.now(),
    });
  }

  private handleNavigation(): void {
    this.addAction({
      type: 'navigation',
      metadata: { url: window.location.href },
      timestamp: Date.now(),
    });
  }
}
