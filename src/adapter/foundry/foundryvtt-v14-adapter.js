import { BaseFoundryVTTAdapter } from "./base-foundryvtt-adapter.js";

/**
 * Foundry VTT v14 adapter for MacroConfig (ApplicationV2 & modern custom elements).
 */
export class FoundryVTTV14Adapter extends BaseFoundryVTTAdapter {
    constructor() {
        super();
        this.version = 14;
    }

    /**
     * Extract the textarea command element from v14 ApplicationV2 element.
     * @param {object} app - MacroConfig application instance
     * @param {HTMLElement|object} html - Rendered HTML container
     * @returns {HTMLTextAreaElement|null} Found textarea element or null
     */
    getCommandElement(app, html) {
        if (app?.element?.querySelector) {
            const found = app.element.querySelector('textarea[name="command"]');
            if (found) return found;
        }

        if (html?.querySelector) {
            const found = html.querySelector('textarea[name="command"]');
            if (found) return found;
        }

        return null;
    }
}
