import { BaseFoundryVTTAdapter } from "./base-foundryvtt-adapter.js";
import { FoundryVTTV12Adapter } from "./foundryvtt-v12-adapter.js";
import { FoundryVTTV13Adapter } from "./foundryvtt-v13-adapter.js";
import { FoundryVTTV14Adapter } from "./foundryvtt-v14-adapter.js";
import { version } from "../../lib/utils.js";
import { log } from "../../lib/logger.js";

export { BaseFoundryVTTAdapter, FoundryVTTV12Adapter, FoundryVTTV13Adapter, FoundryVTTV14Adapter };

/**
 * Active macro editor adapter instance, defaulting to base adapter before initialization.
 * @type {BaseFoundryVTTAdapter|FoundryVTTV12Adapter|FoundryVTTV13Adapter|FoundryVTTV14Adapter}
 */
export let editorAdapter = new BaseFoundryVTTAdapter();

/**
 * Initialize the active Foundry VTT version adapter (v12, v13, or v14).
 * @returns {BaseFoundryVTTAdapter|FoundryVTTV12Adapter|FoundryVTTV13Adapter|FoundryVTTV14Adapter} The initialized Foundry VTT adapter instance.
 */
export function initializeFoundryAdapter() {
    const ver = typeof game !== "undefined" ? game?.version : null;

    if (ver && version.clamp(ver, "14")) {
        editorAdapter = new FoundryVTTV14Adapter();
    } else if (ver && version.clamp(ver, "13", "14")) {
        editorAdapter = new FoundryVTTV13Adapter();
    } else if (ver && version.clamp(ver, "12", "13")) {
        editorAdapter = new FoundryVTTV12Adapter();
    } else {
        editorAdapter = new BaseFoundryVTTAdapter();
    }

    log.info(`Initialized Foundry adapter: ${editorAdapter.constructor.name} (v${editorAdapter.version})`);
    return editorAdapter;
}
