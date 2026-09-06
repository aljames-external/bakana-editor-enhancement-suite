/**
 * Test environment shim for Node.js native test runner.
 * Mocks DOM, window, document, and Foundry VTT global runtime environment.
 */

// Mock basic DOM
class MockDOMElement {
    constructor(tagName = "div") {
        this.tagName = tagName.toUpperCase();
        this.children = [];
        this.parentNode = null;
        this.style = {};
        this.dataset = {};
        this.attributes = {};
        this.className = "";
        this.textContent = "";
        this.innerHTML = "";
        this.value = "";
        this.selectionStart = 0;
        this.selectionEnd = 0;
        this.scrollTop = 0;
        this.scrollLeft = 0;
        this.clientWidth = 800;
        this.clientHeight = 600;
        this._eventListeners = new Map();
    }

    get classList() {
        return {
            add: (cls) => {
                const classes = this.className.split(" ").filter(Boolean);
                if (!classes.includes(cls)) {
                    classes.push(cls);
                    this.className = classes.join(" ");
                }
            },
            remove: (cls) => {
                const classes = this.className.split(" ").filter((c) => c !== cls);
                this.className = classes.join(" ");
            },
            contains: (cls) => this.className.split(" ").includes(cls)
        };
    }

    setAttribute(name, value) {
        this.attributes[name] = String(value);
    }

    getAttribute(name) {
        return this.attributes[name] ?? null;
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parentNode = null;
        }
        return child;
    }

    addEventListener(event, handler) {
        if (!this._eventListeners.has(event)) {
            this._eventListeners.set(event, []);
        }
        this._eventListeners.get(event).push(handler);
    }

    removeEventListener(event, handler) {
        if (this._eventListeners.has(event)) {
            const handlers = this._eventListeners.get(event).filter((h) => h !== handler);
            this._eventListeners.set(event, handlers);
        }
    }

    dispatchEvent(event) {
        event.target = this;
        const handlers = this._eventListeners.get(event.type) ?? [];
        for (const handler of handlers) {
            handler(event);
        }
        return !event.defaultPrevented;
    }

    getBoundingClientRect() {
        return {
            top: 100,
            left: 100,
            width: this.clientWidth,
            height: this.clientHeight,
            right: 100 + this.clientWidth,
            bottom: 100 + this.clientHeight
        };
    }

    querySelector(selector) {
        if (selector === 'textarea[name="command"]' && this.tagName === "TEXTAREA" && this.getAttribute("name") === "command") {
            return this;
        }
        for (const child of this.children) {
            if (child.querySelector) {
                const res = child.querySelector(selector);
                if (res) return res;
            }
        }
        return null;
    }

    closest(selector) {
        if (selector === ".bakana-completion-item" && this.className.includes("bakana-completion-item")) {
            return this;
        }
        return this.parentNode?.closest ? this.parentNode.closest(selector) : null;
    }

    scrollIntoView() {}

    setSelectionRange(start, end) {
        this.selectionStart = start;
        this.selectionEnd = end;
    }

    setRangeText(replacement, start, end, selectMode = "end") {
        const s = start !== undefined ? start : this.selectionStart;
        const e = end !== undefined ? end : this.selectionEnd;
        this.value = this.value.substring(0, s) + replacement + this.value.substring(e);
        if (selectMode === "end") {
            this.selectionStart = s + replacement.length;
            this.selectionEnd = s + replacement.length;
        }
    }

    focus() {}
}

class MockEvent {
    constructor(type, options = {}) {
        this.type = type;
        this.bubbles = options.bubbles ?? false;
        this.cancelable = options.cancelable ?? false;
        this.defaultPrevented = false;
        this.propagationStopped = false;
        this.key = options.key ?? "";
        this.shiftKey = options.shiftKey ?? false;
        this.ctrlKey = options.ctrlKey ?? false;
        this.altKey = options.altKey ?? false;
        this.target = null;
    }

    preventDefault() {
        this.defaultPrevented = true;
    }

    stopPropagation() {
        this.propagationStopped = true;
    }
}

globalThis.Event = MockEvent;
globalThis.KeyboardEvent = MockEvent;

globalThis.document = {
    body: new MockDOMElement("body"),
    createElement: (tag) => new MockDOMElement(tag),
    queryCommandSupported: () => false,
    execCommand: () => false
};

globalThis.window = {
    innerWidth: 1920,
    innerHeight: 1080,
    document: globalThis.document,
    getComputedStyle: () => ({
        borderTopWidth: "1px",
        borderLeftWidth: "1px",
        lineHeight: "16px",
        height: "300px"
    })
};

// Mock Foundry Globals
globalThis.Hooks = {
    _events: new Map(),
    on(event, fn) {
        if (!this._events.has(event)) this._events.set(event, []);
        this._events.get(event).push(fn);
    },
    once(event, fn) {
        this.on(event, fn);
    },
    callAll(event, ...args) {
        const fns = this._events.get(event) ?? [];
        for (const fn of fns) fn(...args);
    }
};

globalThis.foundry = {
    utils: {
        isNewerVersion(v1, v2) {
            const p1 = String(v1 ?? "").split(".").map(Number);
            const p2 = String(v2 ?? "").split(".").map(Number);
            for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
                const n1 = p1[i] ?? 0;
                const n2 = p2[i] ?? 0;
                if (n1 > n2) return true;
                if (n1 < n2) return false;
            }
            return false;
        }
    }
};

globalThis.ui = {
    notifications: {
        info: () => {},
        warn: () => {},
        error: () => {}
    }
};

globalThis.game = {
    version: "13.330",
    settings: {
        _storage: new Map(),
        register(module, key, config) {
            this._storage.set(`${module}.${key}`, config.default);
        },
        get(module, key) {
            return this._storage.get(`${module}.${key}`);
        },
        set(module, key, val) {
            this._storage.set(`${module}.${key}`, val);
        }
    },
    i18n: {
        has: () => true,
        localize: (k) => k
    },
    user: {
        id: "user123",
        name: "Gamemaster",
        isGM: true,
        character: {
            id: "char123",
            name: "Hero Actor",
            system: {
                attributes: {
                    hp: { value: 20, max: 20 }
                }
            }
        }
    }
};

globalThis.canvas = {
    tokens: {
        controlled: [],
        placeables: []
    }
};

globalThis.ChatMessage = {
    getSpeaker: () => ({ scene: "scene1", actor: "char123", token: null, alias: "Hero" })
};

globalThis.CONFIG = {
    Actor: {
        dataModels: {}
    }
};
