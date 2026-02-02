// src/core/ErrorCapture.ts
var ErrorCapture = class _ErrorCapture {
  constructor() {
    this.originalOnError = null;
    this.originalOnUnhandledRejection = null;
    this.errorHandler = null;
    this.initialized = false;
  }
  /**
   * Initialize global error handlers
   */
  init(handler) {
    if (this.initialized) return;
    this.errorHandler = handler;
    this.originalOnError = window.onerror;
    this.originalOnUnhandledRejection = window.onunhandledrejection;
    window.onerror = (message, source, lineno, colno, error) => {
      const err = error || new Error(typeof message === "string" ? message : "Unknown error");
      this.handleError(err, "global");
      if (this.originalOnError) {
        return this.originalOnError.call(window, message, source, lineno, colno, error);
      }
      return false;
    };
    window.onunhandledrejection = (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      this.handleError(error, "unhandledrejection");
      if (this.originalOnUnhandledRejection) {
        this.originalOnUnhandledRejection.call(window, event);
      }
    };
    this.initialized = true;
  }
  /**
   * Destroy and restore original handlers
   */
  destroy() {
    if (!this.initialized) return;
    window.onerror = this.originalOnError;
    window.onunhandledrejection = this.originalOnUnhandledRejection;
    this.originalOnError = null;
    this.originalOnUnhandledRejection = null;
    this.errorHandler = null;
    this.initialized = false;
  }
  /**
   * Parse a stack trace string into structured frames
   */
  static parseStack(stack) {
    if (!stack) return [];
    const frames = [];
    const lines = stack.split("\n");
    for (const line of lines) {
      const frame = _ErrorCapture.parseStackLine(line);
      if (frame) {
        frames.push(frame);
      }
    }
    return frames;
  }
  /**
   * Parse a single stack trace line
   */
  static parseStackLine(line) {
    const trimmed = line.trim();
    const chromeMatch = trimmed.match(
      /^at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+)|(.+?):(\d+))\)?$/
    );
    if (chromeMatch) {
      return {
        function: chromeMatch[1] || "<anonymous>",
        filename: chromeMatch[2] || chromeMatch[5],
        lineno: parseInt(chromeMatch[3] || chromeMatch[6], 10),
        colno: chromeMatch[4] ? parseInt(chromeMatch[4], 10) : void 0,
        source: trimmed
      };
    }
    const firefoxMatch = trimmed.match(/^(.*)@(.+?):(\d+):(\d+)$/);
    if (firefoxMatch) {
      return {
        function: firefoxMatch[1] || "<anonymous>",
        filename: firefoxMatch[2],
        lineno: parseInt(firefoxMatch[3], 10),
        colno: parseInt(firefoxMatch[4], 10),
        source: trimmed
      };
    }
    return null;
  }
  handleError(error, source) {
    if (this.errorHandler) {
      try {
        this.errorHandler(error, source);
      } catch (e) {
        console.error("[BugFast] Error in error handler:", e);
      }
    }
  }
};

// src/utils/helpers.ts
function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 11)}`;
}
function truncate(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}
function safeStringify(value, maxLength = 1e3) {
  try {
    if (value === void 0) return "undefined";
    if (value === null) return "null";
    if (typeof value === "string") return truncate(value, maxLength);
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (value instanceof Error) {
      return truncate(`${value.name}: ${value.message}`, maxLength);
    }
    const str = JSON.stringify(value);
    return truncate(str, maxLength);
  } catch {
    return "[Unserializable]";
  }
}
function getSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  const parts = [];
  let current = element;
  while (current && current !== document.body && parts.length < 5) {
    let selector = current.tagName.toLowerCase();
    if (current.className && typeof current.className === "string") {
      const classes = current.className.split(/\s+/).filter((c) => c && !c.startsWith("_")).slice(0, 2);
      if (classes.length > 0) {
        selector += `.${classes.join(".")}`;
      }
    }
    const parent = current.parentElement;
    if (parent) {
      const currentTagName = current.tagName;
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === currentTagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }
    parts.unshift(selector);
    current = parent;
  }
  return parts.join(" > ");
}
function getElementText(element, maxLength = 50) {
  const text = element.textContent?.trim().replace(/\s+/g, " ") || element.value || element.getAttribute("aria-label") || element.getAttribute("title") || "";
  return truncate(text, maxLength);
}
function isSensitiveInput(element) {
  if (!(element instanceof HTMLInputElement)) return false;
  const sensitiveTypes = ["password", "credit-card", "cc-number", "cc-cvc", "cc-exp"];
  if (sensitiveTypes.includes(element.type)) return true;
  const sensitivePatterns = /password|credit|card|cvv|cvc|ssn|social|secret|token/i;
  const name = element.name || "";
  const id = element.id || "";
  const autocomplete = element.autocomplete || "";
  return sensitivePatterns.test(name) || sensitivePatterns.test(id) || sensitivePatterns.test(autocomplete);
}
function maskValue(value) {
  if (!value) return "";
  if (value.length <= 4) return "****";
  return "*".repeat(value.length - 4) + value.slice(-4);
}
function createCircularBuffer(maxSize) {
  const buffer = [];
  return {
    push(item) {
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
    }
  };
}
function parseUserAgent(ua) {
  const result = {};
  const browserPatterns = [
    ["Chrome", /Chrome\/(\d+)/],
    ["Firefox", /Firefox\/(\d+)/],
    ["Safari", /Version\/(\d+).*Safari/],
    ["Edge", /Edg\/(\d+)/],
    ["Opera", /OPR\/(\d+)/],
    ["IE", /MSIE (\d+)|Trident.*rv:(\d+)/]
  ];
  for (const [name, pattern] of browserPatterns) {
    const match = ua.match(pattern);
    if (match) {
      result.browser = name;
      result.browserVersion = match[1] || match[2];
      break;
    }
  }
  if (/Windows NT (\d+\.\d+)/.test(ua)) {
    result.os = "Windows";
    result.osVersion = ua.match(/Windows NT (\d+\.\d+)/)?.[1];
  } else if (/Mac OS X (\d+[._]\d+)/.test(ua)) {
    result.os = "macOS";
    result.osVersion = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace(/_/g, ".");
  } else if (/Linux/.test(ua)) {
    result.os = "Linux";
  } else if (/Android (\d+)/.test(ua)) {
    result.os = "Android";
    result.osVersion = ua.match(/Android (\d+)/)?.[1];
  } else if (/iPhone|iPad|iPod/.test(ua)) {
    result.os = "iOS";
    result.osVersion = ua.match(/OS (\d+[._]\d+)/)?.[1]?.replace(/_/g, ".");
  }
  if (/Mobile|Android.*Mobile|iPhone|iPod/.test(ua)) {
    result.deviceType = "mobile";
  } else if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) {
    result.deviceType = "tablet";
  } else {
    result.deviceType = "desktop";
  }
  return result;
}
function debounce(fn, delay) {
  let timeoutId = null;
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// src/collectors/BrowserCollector.ts
var BrowserCollector = class {
  init() {
  }
  destroy() {
  }
  collect() {
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
      online: navigator.onLine
    };
  }
};

// src/collectors/ConsoleCollector.ts
var ConsoleCollector = class {
  constructor(maxEntries = 50) {
    this.maxEntries = maxEntries;
    this.originalMethods = {};
    this.initialized = false;
    this.buffer = createCircularBuffer(maxEntries);
  }
  init() {
    if (this.initialized) return;
    const methods = ["log", "info", "warn", "error", "debug"];
    methods.forEach((method) => {
      this.originalMethods[method] = console[method].bind(console);
      console[method] = (...args) => {
        this.captureEntry(method, args);
        this.originalMethods[method]?.(...args);
      };
    });
    this.initialized = true;
  }
  destroy() {
    if (!this.initialized) return;
    Object.keys(this.originalMethods).forEach((method) => {
      if (this.originalMethods[method]) {
        console[method] = this.originalMethods[method];
      }
    });
    this.originalMethods = {};
    this.buffer.clear();
    this.initialized = false;
  }
  collect() {
    return this.buffer.getAll();
  }
  captureEntry(level, args) {
    const [first, ...rest] = args;
    const entry = {
      level,
      message: safeStringify(first, 500),
      timestamp: Date.now()
    };
    if (rest.length > 0) {
      entry.args = rest.map((arg) => safeStringify(arg, 200));
    }
    this.buffer.push(entry);
  }
};

// src/collectors/NetworkCollector.ts
var NetworkCollector = class {
  constructor(maxRequests = 20) {
    this.maxRequests = maxRequests;
    this.originalFetch = null;
    this.originalXhrOpen = null;
    this.originalXhrSend = null;
    this.initialized = false;
    this.buffer = createCircularBuffer(maxRequests);
  }
  init() {
    if (this.initialized) return;
    this.interceptFetch();
    this.interceptXhr();
    this.initialized = true;
  }
  destroy() {
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
  collect() {
    return this.buffer.getAll();
  }
  interceptFetch() {
    if (typeof window.fetch !== "function") return;
    this.originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method || "GET";
      const startTime = Date.now();
      const request = {
        url,
        method: method.toUpperCase(),
        startTime,
        type: "fetch"
      };
      try {
        const response = await this.originalFetch(input, init);
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
        request.error = error instanceof Error ? error.message : "Unknown error";
        this.buffer.push(request);
        throw error;
      }
    };
  }
  interceptXhr() {
    if (typeof XMLHttpRequest === "undefined") return;
    this.originalXhrOpen = XMLHttpRequest.prototype.open;
    this.originalXhrSend = XMLHttpRequest.prototype.send;
    const collector = this;
    XMLHttpRequest.prototype.open = function(method, url, async = true, username, password) {
      this._bugfastRequest = {
        url: typeof url === "string" ? url : url.href,
        method: method.toUpperCase(),
        startTime: Date.now(),
        type: "xhr"
      };
      return collector.originalXhrOpen.call(this, method, url, async, username, password);
    };
    XMLHttpRequest.prototype.send = function(body) {
      const xhr = this;
      const request = xhr._bugfastRequest;
      if (request) {
        request.startTime = Date.now();
        const onLoadEnd = () => {
          request.status = xhr.status;
          request.statusText = xhr.statusText;
          request.endTime = Date.now();
          request.duration = request.endTime - request.startTime;
          request.failed = xhr.status === 0 || xhr.status >= 400;
          collector.buffer.push(request);
          xhr.removeEventListener("loadend", onLoadEnd);
        };
        const onError = () => {
          request.endTime = Date.now();
          request.duration = request.endTime - request.startTime;
          request.failed = true;
          request.error = "Network error";
          collector.buffer.push(request);
          xhr.removeEventListener("error", onError);
        };
        xhr.addEventListener("loadend", onLoadEnd);
        xhr.addEventListener("error", onError);
      }
      return collector.originalXhrSend.call(this, body);
    };
  }
};

// src/collectors/UserActionCollector.ts
var UserActionCollector = class {
  constructor(maxActions = 30, maskSensitive = true) {
    this.maxActions = maxActions;
    this.maskSensitive = maskSensitive;
    this.initialized = false;
    this.boundHandlers = null;
    this.buffer = createCircularBuffer(maxActions);
  }
  init() {
    if (this.initialized) return;
    this.boundHandlers = {
      click: this.handleClick.bind(this),
      input: debounce(this.handleInput.bind(this), 100),
      submit: this.handleSubmit.bind(this),
      scroll: debounce(this.handleScroll.bind(this), 200),
      popstate: this.handleNavigation.bind(this)
    };
    document.addEventListener("click", this.boundHandlers.click, { capture: true, passive: true });
    document.addEventListener("input", this.boundHandlers.input, { capture: true, passive: true });
    document.addEventListener("submit", this.boundHandlers.submit, { capture: true, passive: true });
    window.addEventListener("scroll", this.boundHandlers.scroll, { passive: true });
    window.addEventListener("popstate", this.boundHandlers.popstate);
    this.addAction({
      type: "navigation",
      metadata: { url: window.location.href },
      timestamp: Date.now()
    });
    this.initialized = true;
  }
  destroy() {
    if (!this.initialized || !this.boundHandlers) return;
    document.removeEventListener("click", this.boundHandlers.click, { capture: true });
    document.removeEventListener("input", this.boundHandlers.input, { capture: true });
    document.removeEventListener("submit", this.boundHandlers.submit, { capture: true });
    window.removeEventListener("scroll", this.boundHandlers.scroll);
    window.removeEventListener("popstate", this.boundHandlers.popstate);
    this.boundHandlers = null;
    this.buffer.clear();
    this.initialized = false;
  }
  collect() {
    return this.buffer.getAll();
  }
  addAction(action) {
    this.buffer.push(action);
  }
  handleClick(event) {
    const target = event.target;
    if (!target || !(target instanceof Element)) return;
    this.addAction({
      type: "click",
      selector: getSelector(target),
      tagName: target.tagName.toLowerCase(),
      text: getElementText(target),
      timestamp: Date.now()
    });
  }
  handleInput(event) {
    const target = event.target;
    if (!target) return;
    let value = target.value || "";
    if (this.maskSensitive && isSensitiveInput(target)) {
      value = maskValue(value);
    } else {
      value = value.length > 50 ? value.substring(0, 47) + "..." : value;
    }
    this.addAction({
      type: "input",
      selector: getSelector(target),
      tagName: target.tagName.toLowerCase(),
      value,
      timestamp: Date.now()
    });
  }
  handleSubmit(event) {
    const target = event.target;
    if (!target) return;
    this.addAction({
      type: "submit",
      selector: getSelector(target),
      tagName: "form",
      metadata: {
        action: target.action,
        method: target.method
      },
      timestamp: Date.now()
    });
  }
  handleScroll() {
    this.addAction({
      type: "scroll",
      metadata: {
        scrollX: window.scrollX,
        scrollY: window.scrollY
      },
      timestamp: Date.now()
    });
  }
  handleNavigation() {
    this.addAction({
      type: "navigation",
      metadata: { url: window.location.href },
      timestamp: Date.now()
    });
  }
};

// src/collectors/DOMCollector.ts
var MAX_DOM_SIZE = 5e5;
var DOMCollector = class {
  constructor(maskSensitive = true) {
    this.maskSensitive = maskSensitive;
  }
  init() {
  }
  destroy() {
  }
  collect() {
    const html = this.serializeDOM();
    const truncated = html.length > MAX_DOM_SIZE;
    return {
      html: truncated ? html.substring(0, MAX_DOM_SIZE) : html,
      title: document.title,
      timestamp: Date.now(),
      truncated
    };
  }
  serializeDOM() {
    const docClone = document.documentElement.cloneNode(true);
    if (this.maskSensitive) {
      this.maskSensitiveInputs(docClone);
    }
    const scripts = docClone.querySelectorAll("script");
    scripts.forEach((script) => {
      script.textContent = "";
    });
    const allElements = docClone.querySelectorAll("*");
    allElements.forEach((el) => {
      const attrs = Array.from(el.attributes);
      attrs.forEach((attr) => {
        if (attr.name.startsWith("on")) {
          el.removeAttribute(attr.name);
        }
      });
    });
    return docClone.outerHTML;
  }
  maskSensitiveInputs(root) {
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
      'input[autocomplete*="cc-"]'
    ];
    sensitiveSelectors.forEach((selector) => {
      const inputs = root.querySelectorAll(selector);
      inputs.forEach((input) => {
        if (input.value) {
          input.value = "********";
        }
        input.setAttribute("data-masked", "true");
      });
    });
    const markedInputs = root.querySelectorAll(
      "input[data-sensitive]"
    );
    markedInputs.forEach((input) => {
      if (input.value) {
        input.value = "********";
      }
    });
  }
};

// src/collectors/ScreenshotCollector.ts
var ScreenshotCollector = class {
  constructor(quality = 0.7) {
    this.quality = quality;
    this.html2canvasModule = null;
  }
  init() {
    this.loadHtml2Canvas();
  }
  destroy() {
    this.html2canvasModule = null;
  }
  collect() {
    return this.capture();
  }
  async capture() {
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
          const style = window.getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden") {
            return true;
          }
          if (element.tagName === "IFRAME") {
            try {
              const doc = element.contentDocument;
              return !doc;
            } catch {
              return true;
            }
          }
          return false;
        }
      });
      const data = canvas.toDataURL("image/jpeg", this.quality);
      return {
        data,
        mimeType: "image/jpeg",
        width: canvas.width,
        height: canvas.height,
        timestamp: Date.now()
      };
    } catch (error) {
      console.warn("[BugFast] Failed to capture screenshot:", error);
      return null;
    }
  }
  async loadHtml2Canvas() {
    if (this.html2canvasModule) return;
    try {
      this.html2canvasModule = await import('html2canvas');
    } catch (error) {
      console.warn("[BugFast] Failed to load html2canvas:", error);
    }
  }
  async getHtml2Canvas() {
    if (!this.html2canvasModule) {
      await this.loadHtml2Canvas();
    }
    return this.html2canvasModule;
  }
};

// src/reporter/ApiReporter.ts
var ApiReporter = class {
  constructor(config) {
    this.queue = [];
    this.isSending = false;
    this.batchTimeout = null;
    this.offlineQueue = [];
    this.config = {
      maxRetries: 3,
      retryDelay: 1e3,
      batchSize: 10,
      batchDelay: 2e3,
      debug: false,
      ...config
    };
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.flushOfflineQueue());
    }
  }
  /**
   * Queue a report for sending
   */
  async send(report) {
    if (!navigator.onLine) {
      this.offlineQueue.push(report);
      this.log("Offline, queued report for later");
      return;
    }
    this.queue.push(report);
    this.scheduleBatch();
  }
  /**
   * Immediately send all queued reports
   */
  async flush() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    await this.sendBatch();
  }
  /**
   * Destroy the reporter
   */
  destroy() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.queue = [];
    this.offlineQueue = [];
  }
  scheduleBatch() {
    if (this.batchTimeout) return;
    if (this.queue.length >= this.config.batchSize) {
      this.sendBatch();
      return;
    }
    this.batchTimeout = setTimeout(() => {
      this.batchTimeout = null;
      this.sendBatch();
    }, this.config.batchDelay);
  }
  async sendBatch() {
    if (this.isSending || this.queue.length === 0) return;
    this.isSending = true;
    const batch = this.queue.splice(0, this.config.batchSize);
    try {
      await this.sendWithRetry(batch);
      this.log(`Successfully sent ${batch.length} report(s)`);
    } catch (error) {
      this.log("Failed to send reports, re-queuing", error);
      this.queue.unshift(...batch);
    } finally {
      this.isSending = false;
      if (this.queue.length > 0) {
        this.scheduleBatch();
      }
    }
  }
  async sendWithRetry(reports) {
    let lastError = null;
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        await this.sendRequest(reports);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.log(`Attempt ${attempt + 1} failed:`, lastError.message);
        if (attempt < this.config.maxRetries - 1) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await sleep(delay);
        }
      }
    }
    throw lastError;
  }
  async sendRequest(reports) {
    const payload = reports.length === 1 ? reports[0] : { reports };
    const response = await fetch(this.config.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.config.apiKey
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
  async flushOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    this.log(`Online, flushing ${this.offlineQueue.length} offline report(s)`);
    const reports = this.offlineQueue.splice(0, this.offlineQueue.length);
    this.queue.push(...reports);
    this.scheduleBatch();
  }
  log(...args) {
    if (this.config.debug) {
      console.log("[BugFast Reporter]", ...args);
    }
  }
};

// src/core/BugFast.ts
var _BugFast = class _BugFast {
  constructor(config) {
    this.consoleCollector = null;
    this.networkCollector = null;
    this.userActionCollector = null;
    this.domCollector = null;
    this.screenshotCollector = null;
    this.initialized = false;
    this.config = {
      captureScreenshot: true,
      captureConsole: true,
      captureNetwork: true,
      captureDom: true,
      captureUserActions: true,
      screenshotQuality: 0.7,
      maxConsoleEntries: 50,
      maxNetworkRequests: 20,
      maxUserActions: 30,
      maskSensitiveInputs: true,
      tags: {},
      user: {},
      beforeSend: (report) => report,
      debug: false,
      ...config
    };
    this.errorCapture = new ErrorCapture();
    this.browserCollector = new BrowserCollector();
    this.reporter = new ApiReporter({
      apiEndpoint: this.config.apiEndpoint,
      apiKey: this.config.apiKey,
      debug: this.config.debug
    });
  }
  /**
   * Initialize BugFast with configuration
   */
  static init(config) {
    if (_BugFast.instance) {
      console.warn("[BugFast] Already initialized. Call destroy() first to re-initialize.");
      return _BugFast.instance;
    }
    _BugFast.instance = new _BugFast(config);
    _BugFast.instance.setup();
    return _BugFast.instance;
  }
  /**
   * Get the current instance
   */
  static getInstance() {
    return _BugFast.instance;
  }
  /**
   * Manually capture an error
   */
  static captureError(error, options = {}) {
    const instance = _BugFast.instance;
    if (!instance) {
      console.warn("[BugFast] Not initialized. Call BugFast.init() first.");
      return;
    }
    const err = typeof error === "string" ? new Error(error) : error;
    instance.handleError(err, "manual", options);
  }
  /**
   * Set user information
   */
  static setUser(user) {
    const instance = _BugFast.instance;
    if (!instance) {
      console.warn("[BugFast] Not initialized. Call BugFast.init() first.");
      return;
    }
    instance.config.user = { ...instance.config.user, ...user };
  }
  /**
   * Set custom tags
   */
  static setTags(tags) {
    const instance = _BugFast.instance;
    if (!instance) {
      console.warn("[BugFast] Not initialized. Call BugFast.init() first.");
      return;
    }
    instance.config.tags = { ...instance.config.tags, ...tags };
  }
  /**
   * Flush any pending error reports
   */
  static async flush() {
    const instance = _BugFast.instance;
    if (!instance) return;
    await instance.reporter.flush();
  }
  /**
   * Destroy the BugFast instance and clean up
   */
  static destroy() {
    const instance = _BugFast.instance;
    if (!instance) return;
    instance.teardown();
    _BugFast.instance = null;
  }
  /**
   * Internal: Handle error from React/Vue adapters
   */
  handleAdapterError(error, source, componentStack) {
    this.handleError(error, source, { extra: { componentStack } });
  }
  setup() {
    if (this.initialized) return;
    this.errorCapture.init((error, source) => {
      this.handleError(error, source);
    });
    if (this.config.captureConsole) {
      this.consoleCollector = new ConsoleCollector(this.config.maxConsoleEntries);
      this.consoleCollector.init();
    }
    if (this.config.captureNetwork) {
      this.networkCollector = new NetworkCollector(this.config.maxNetworkRequests);
      this.networkCollector.init();
    }
    if (this.config.captureUserActions) {
      this.userActionCollector = new UserActionCollector(
        this.config.maxUserActions,
        this.config.maskSensitiveInputs
      );
      this.userActionCollector.init();
    }
    if (this.config.captureDom) {
      this.domCollector = new DOMCollector(this.config.maskSensitiveInputs);
      this.domCollector.init();
    }
    if (this.config.captureScreenshot) {
      this.screenshotCollector = new ScreenshotCollector(this.config.screenshotQuality);
      this.screenshotCollector.init();
    }
    this.initialized = true;
    this.log("Initialized");
  }
  teardown() {
    if (!this.initialized) return;
    this.errorCapture.destroy();
    this.consoleCollector?.destroy();
    this.networkCollector?.destroy();
    this.userActionCollector?.destroy();
    this.domCollector?.destroy();
    this.screenshotCollector?.destroy();
    this.reporter.destroy();
    this.consoleCollector = null;
    this.networkCollector = null;
    this.userActionCollector = null;
    this.domCollector = null;
    this.screenshotCollector = null;
    this.initialized = false;
    this.log("Destroyed");
  }
  async handleError(error, source, options = {}) {
    try {
      const report = await this.buildReport(error, source, options);
      const processedReport = this.config.beforeSend(report);
      if (processedReport === false) {
        this.log("Report cancelled by beforeSend hook");
        return;
      }
      await this.reporter.send(processedReport);
    } catch (e) {
      console.error("[BugFast] Failed to capture error:", e);
    }
  }
  async buildReport(error, source, options) {
    const report = {
      id: generateId(),
      timestamp: Date.now(),
      message: error.message,
      name: error.name,
      rawStack: error.stack,
      stack: ErrorCapture.parseStack(error.stack),
      source,
      browser: this.browserCollector.collect(),
      user: { ...this.config.user, ...options.user },
      tags: { ...this.config.tags, ...options.tags },
      extra: options.extra
    };
    if (this.consoleCollector) {
      report.consoleLogs = this.consoleCollector.collect();
    }
    if (this.networkCollector) {
      report.networkRequests = this.networkCollector.collect();
    }
    if (this.userActionCollector) {
      report.userActions = this.userActionCollector.collect();
    }
    if (this.domCollector) {
      report.domSnapshot = this.domCollector.collect();
    }
    const shouldCaptureScreenshot = options.captureScreenshot ?? this.config.captureScreenshot;
    if (shouldCaptureScreenshot && this.screenshotCollector) {
      const screenshot = await this.screenshotCollector.capture();
      if (screenshot) {
        report.screenshot = screenshot;
      }
    }
    if (options.extra?.componentStack) {
      report.componentStack = options.extra.componentStack;
    }
    return report;
  }
  log(...args) {
    if (this.config.debug) {
      console.log("[BugFast]", ...args);
    }
  }
};
_BugFast.instance = null;
var BugFast = _BugFast;

// src/adapters/vue.ts
function getComponentStack(vm) {
  if (!vm) return "";
  const stack = [];
  let current = vm;
  while (current) {
    const name = current.$options?.name || current.$options?.__name || current.$options?._componentTag || "AnonymousComponent";
    stack.push(`<${name}>`);
    current = current.$parent ?? null;
  }
  return stack.join("\n  at ");
}
function getComponentInfo(vm) {
  if (!vm) return {};
  const info = {};
  const name = vm.$options?.name || vm.$options?.__name || vm.$options?._componentTag;
  if (name) {
    info.componentName = name;
  }
  if (vm.$props && Object.keys(vm.$props).length > 0) {
    try {
      info.props = JSON.parse(JSON.stringify(vm.$props));
    } catch {
      info.props = "[Unserializable]";
    }
  }
  const route = vm.$route;
  if (route) {
    info.route = {
      path: route.path,
      name: route.name,
      params: route.params
    };
  }
  return info;
}
var bugfastPlugin = {
  install(app, options = {}) {
    const { captureComponentInfo = true } = options;
    const originalErrorHandler = app.config.errorHandler;
    app.config.errorHandler = (err, vm, info) => {
      const error = err instanceof Error ? err : new Error(String(err));
      const instance = BugFast.getInstance();
      if (instance) {
        const componentStack = getComponentStack(vm);
        const componentInfo = captureComponentInfo ? getComponentInfo(vm) : {};
        BugFast.captureError(error, {
          extra: {
            componentStack,
            vueInfo: info,
            ...componentInfo
          },
          tags: {
            framework: "vue"
          }
        });
      }
      if (originalErrorHandler) {
        originalErrorHandler(err, vm, info);
      } else {
        console.error("[Vue Error]", err);
        if (vm) {
          console.error("Component:", getComponentStack(vm));
        }
        console.error("Info:", info);
      }
    };
    if (typeof globalThis !== "undefined" && globalThis.__DEV__ !== false) {
      const originalWarnHandler = app.config.warnHandler;
      app.config.warnHandler = (msg, vm, trace) => {
        console.warn("[Vue Warning]", msg);
        if (trace) {
          console.warn(trace);
        }
        if (originalWarnHandler) {
          originalWarnHandler(msg, vm, trace);
        }
      };
    }
  }
};
function useBugFastErrorHandler() {
  return {
    captureError(error, extra) {
      BugFast.captureError(error, { extra });
    }
  };
}

export { bugfastPlugin, useBugFastErrorHandler };
//# sourceMappingURL=vue.mjs.map
//# sourceMappingURL=vue.mjs.map