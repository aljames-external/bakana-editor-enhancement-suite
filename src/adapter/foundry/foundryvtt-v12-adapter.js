import { BaseFoundryVTTAdapter } from "./base-foundryvtt-adapter.js";

/**
 * Foundry VTT v12 adapter for MacroConfig (FormApplication & jQuery wrapper).
 */
export class FoundryVTTV12Adapter extends BaseFoundryVTTAdapter {
    constructor() {
        super();
        this.version = 12;
    }

    /**
     * Extract the textarea command element from v12 FormApplication jQuery/HTMLElement wrapper.
     * @param {object} app - MacroConfig application instance
     * @param {HTMLElement|object} html - Rendered HTML container
     * @returns {HTMLTextAreaElement|null} Found textarea element or null
     */
    getCommandElement(app, html) {
        if (!html) return null;

        // Check jQuery wrapper methods
        if (html.find) {
            const found = html.find('textarea[name="command"]');
            return found?.[0] ?? null;
        }

        // Check native HTMLElement
        if (html.querySelector) {
            return html.querySelector('textarea[name="command"]') ?? null;
        }

        // Check indexed DOM array
        if (html[0]?.querySelector) {
            return html[0].querySelector('textarea[name="command"]') ?? null;
        }

        return null;
    }
}
