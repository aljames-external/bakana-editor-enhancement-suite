import { EditorController } from "../../completion/editorController.js";
import { log } from "../../lib/logger.js";

/**
 * Base abstract class for Foundry VTT version-specific Macro editor adapters.
 */
export class BaseFoundryVTTAdapter {
    /**
     * Initialize the base Foundry VTT editor adapter.
     */
    constructor() {
        this.version = 0;
        this.controllers = new Map();
    }

    /**
     * Extract the textarea command element from the MacroConfig application and rendered HTML.
     * @param {object} app - MacroConfig application instance
     * @param {HTMLElement|object} html - Rendered HTML container
     * @returns {HTMLTextAreaElement|null} Found textarea element or null
     */
    getCommandElement(app, html) {
        if (!html) return null;

        if (html.querySelector) {
            return html.querySelector('textarea[name="command"]') ?? null;
        }

        if (html[0]?.querySelector) {
            return html[0].querySelector('textarea[name="command"]') ?? null;
        }

        if (app?.element?.querySelector) {
            return app.element.querySelector('textarea[name="command"]') ?? null;
        }

        return null;
    }

    /**
     * Attach an EditorController instance to a newly rendered MacroConfig sheet.
     * @param {object} app - MacroConfig application instance
     * @param {HTMLElement|object} html - Rendered HTML container
     * @returns {EditorController|null} Attached controller or null
     */
    attachController(app, html) {
        if (!app) return null;

        const appId = app.id ?? "default";
        const textarea = this.getCommandElement(app, html);

        if (!textarea) {
            log.debug(`No command textarea found for MacroConfig application [${appId}]`);
            return null;
        }

        if (this.controllers.has(appId)) {
            const existing = this.controllers.get(appId);
            existing?.destroy?.();
            this.controllers.delete(appId);
        }

        const macroDoc = app.document ?? null;
        const controller = new EditorController(textarea, macroDoc);
        this.controllers.set(appId, controller);
        log.debug(`Attached EditorController to MacroConfig [${appId}]`);

        return controller;
    }

    /**
     * Detach and destroy an EditorController instance when a MacroConfig sheet closes.
     * @param {object} app - MacroConfig application instance
     * @returns {void}
     */
    detachController(app) {
        if (!app) return;

        const appId = app.id ?? "default";
        if (this.controllers.has(appId)) {
            const controller = this.controllers.get(appId);
            controller?.destroy?.();
            this.controllers.delete(appId);
            log.debug(`Detached EditorController from MacroConfig [${appId}]`);
        }
    }

    /**
     * Register Foundry VTT hooks for MacroConfig lifecycle.
     * @returns {void}
     */
    registerHooks() {
        if (typeof Hooks === "undefined") return;

        Hooks.on("renderMacroConfig", (app, html) => {
            this.attachController(app, html);
        });

        Hooks.on("closeMacroConfig", (app) => {
            this.detachController(app);
        });

        log.info(`Registered MacroConfig lifecycle hooks for Foundry adapter (v${this.version})`);
    }
}
