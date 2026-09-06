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
        // 1. Direct query on html container (HTMLElement)
        if (html?.querySelector) {
            const found = html.querySelector('textarea[name="command"]') ??
                          html.querySelector('textarea.command') ??
                          html.querySelector('textarea');
            if (found) return found;
        }

        // 2. Query on jQuery wrapper or indexed array
        if (html?.[0]?.querySelector) {
            const found = html[0].querySelector('textarea[name="command"]') ??
                          html[0].querySelector('textarea.command') ??
                          html[0].querySelector('textarea');
            if (found) return found;
        }

        // 3. jQuery find method
        if (html?.find) {
            const found = html.find('textarea[name="command"]')[0] ??
                          html.find('textarea.command')[0] ??
                          html.find('textarea')[0];
            if (found) return found;
        }

        // 4. Query on app.element (ApplicationV2 / DocumentSheet)
        if (app?.element?.querySelector) {
            const found = app.element.querySelector('textarea[name="command"]') ??
                          app.element.querySelector('textarea.command') ??
                          app.element.querySelector('textarea');
            if (found) return found;
        }

        // 5. Query document by app id
        const appId = app?.id ?? app?.appId;
        if (appId && typeof document !== "undefined") {
            const appEl = document.getElementById(appId) ??
                          document.querySelector(`[data-appid="${appId}"]`) ??
                          document.querySelector(`.macro-sheet[id*="${appId}"]`);
            if (appEl?.querySelector) {
                const found = appEl.querySelector('textarea[name="command"]') ??
                              appEl.querySelector('textarea.command') ??
                              appEl.querySelector('textarea');
                if (found) return found;
            }
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

        const appId = app.id ?? app.appId ?? "default";
        const textarea = this.getCommandElement(app, html);

        if (!textarea) {
            log.debug(`No command textarea found for MacroConfig application [${appId}]`);
            return null;
        }

        // If controller already attached to this exact textarea, skip re-attachment
        if (this.controllers.has(appId)) {
            const existing = this.controllers.get(appId);
            if (existing?.element === textarea) {
                return existing;
            }
            existing?.destroy?.();
            this.controllers.delete(appId);
        }

        const macroDoc = app.document ?? app.object ?? null;
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

        const appId = app.id ?? app.appId ?? "default";
        if (this.controllers.has(appId)) {
            const controller = this.controllers.get(appId);
            controller?.destroy?.();
            this.controllers.delete(appId);
            log.debug(`Detached EditorController from MacroConfig [${appId}]`);
        }
    }

    /**
     * Scan open windows on the screen and attach controllers to any active Macro sheets.
     */
    scanAndAttachOpenWindows() {
        if (typeof ui !== "undefined" && ui?.windows) {
            for (const app of Object.values(ui.windows)) {
                const docName = app?.document?.documentName ?? app?.object?.documentName ?? "";
                if (docName === "Macro" || app?.constructor?.name === "MacroConfig") {
                    this.attachController(app, app.element);
                }
            }
        }
        if (typeof foundry !== "undefined" && foundry?.applications?.instances) {
            for (const app of foundry.applications.instances.values()) {
                const docName = app?.document?.documentName ?? "";
                if (docName === "Macro" || app?.constructor?.name === "MacroConfig") {
                    this.attachController(app, app.element);
                }
            }
        }
    }

    /**
     * Register Foundry VTT hooks for MacroConfig lifecycle.
     * @returns {void}
     */
    registerHooks() {
        if (typeof Hooks === "undefined") return;

        const onRender = (app, html) => {
            const docName = app?.document?.documentName ?? app?.object?.documentName ?? "";
            const isMacroApp = docName === "Macro" ||
                              app?.constructor?.name === "MacroConfig" ||
                              app?.id?.includes?.("macro") ||
                              Boolean(this.getCommandElement(app, html));

            if (isMacroApp) {
                this.attachController(app, html);
                setTimeout(() => {
                    this.attachController(app, html);
                }, 50);
            }
        };

        const onClose = (app) => {
            this.detachController(app);
        };

        Hooks.on("renderMacroConfig", onRender);
        Hooks.on("renderMacroSheet", onRender);
        Hooks.on("renderDocumentSheet", onRender);
        Hooks.on("renderApplication", onRender);
        Hooks.on("closeMacroConfig", onClose);
        Hooks.on("closeMacroSheet", onClose);
        Hooks.on("closeDocumentSheet", onClose);
        Hooks.on("closeApplication", onClose);

        Hooks.once("ready", () => {
            this.scanAndAttachOpenWindows();
        });

        log.info(`Registered MacroConfig lifecycle hooks for Foundry adapter (v${this.version})`);
    }
}
