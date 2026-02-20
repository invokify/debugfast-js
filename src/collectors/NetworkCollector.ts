import type { Collector, NetworkRequest } from '../core/types';
import { createCircularBuffer } from '../utils/helpers';

/**
 * Intercepts fetch and XHR requests to track network activity
 */
export class NetworkCollector implements Collector {
  private buffer: ReturnType<typeof createCircularBuffer<NetworkRequest>>;
  private originalFetch: typeof fetch | null = null;
  private originalXhrOpen: typeof XMLHttpRequest.prototype.open | null = null;
  private originalXhrSend: typeof XMLHttpRequest.prototype.send | null = null;
  private initialized = false;

  constructor(private maxRequests: number = 20) {
    this.buffer = createCircularBuffer<NetworkRequest>(maxRequests);
  }

  init(): void {
    if (this.initialized) return;

    this.interceptFetch();
    this.interceptXhr();
    this.initialized = true;
  }

  destroy(): void {
    if (!this.initialized) return;

    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }

    if (this.originalXhrOpen) {
      XMLHttpRequest.prototype.open = this.originalXhrOpen;
      this.originalXhrOpen = null;
    }

    if (this.originalXhrSend) {
      XMLHttpRequest.prototype.send = this.originalXhrSend;
      this.originalXhrSend = null;
    }

    this.buffer.clear();
    this.initialized = false;
  }

  collect(): NetworkRequest[] {
    return this.buffer.getAll();
  }

  private interceptFetch(): void {
    if (typeof window.fetch !== 'function') return;

    this.originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method || 'GET';
      const startTime = Date.now();

      const request: NetworkRequest = {
        url,
        method: method.toUpperCase(),
        startTime,
        type: 'fetch',
      };

      try {
        const response = await this.originalFetch!(input, init);

        request.status = response.status;
        request.statusText = response.statusText;
        request.endTime = Date.now();
        request.duration = request.endTime - startTime;
        request.failed = !response.ok;

        this.buffer.push(request);
        return response;
      } catch (error) {
        request.endTime = Date.now();
        request.duration = request.endTime - startTime;
        request.failed = true;
        request.error = error instanceof Error ? error.message : 'Unknown error';

        this.buffer.push(request);
        throw error;
      }
    };
  }

  private interceptXhr(): void {
    if (typeof XMLHttpRequest === 'undefined') return;

    this.originalXhrOpen = XMLHttpRequest.prototype.open;
    this.originalXhrSend = XMLHttpRequest.prototype.send;

    const collector = this;

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ): void {
      (this as XMLHttpRequest & { _debugfastRequest: NetworkRequest })._debugfastRequest = {
        url: typeof url === 'string' ? url : url.href,
        method: method.toUpperCase(),
        startTime: Date.now(),
        type: 'xhr',
      };

      return collector.originalXhrOpen!.call(this, method, url, async, username, password);
    };

    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null): void {
      const xhr = this as XMLHttpRequest & { _debugfastRequest: NetworkRequest };
      const request = xhr._debugfastRequest;

      if (request) {
        request.startTime = Date.now();

        const onLoadEnd = () => {
          request.status = xhr.status;
          request.statusText = xhr.statusText;
          request.endTime = Date.now();
          request.duration = request.endTime - request.startTime;
          request.failed = xhr.status === 0 || xhr.status >= 400;

          collector.buffer.push(request);
          xhr.removeEventListener('loadend', onLoadEnd);
        };

        const onError = () => {
          request.endTime = Date.now();
          request.duration = request.endTime - request.startTime;
          request.failed = true;
          request.error = 'Network error';

          collector.buffer.push(request);
          xhr.removeEventListener('error', onError);
        };

        xhr.addEventListener('loadend', onLoadEnd);
        xhr.addEventListener('error', onError);
      }

      return collector.originalXhrSend!.call(this, body);
    };
  }
}
