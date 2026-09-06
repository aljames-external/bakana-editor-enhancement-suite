import { BaseFoundryVTTAdapter } from "./base-foundryvtt-adapter.js";

/**
 * Foundry VTT v13 adapter for MacroConfig (ApplicationV2 & FormApplication hybrid).
 */
export class FoundryVTTV13Adapter extends BaseFoundryVTTAdapter {
    constructor() {
        super();
        this.version = 13;
    }

    /**
     * Extract the textarea command element from v13 ApplicationV2 / FormApplication container.
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

        if (html?.[0]?.querySelector) {
            const found = html[0].querySelector('textarea[name="command"]');
            if (found) return found;
        }

        return null;
    }
}
