import { MODULE_ID, MODULE_NAME, DEFAULT_SETTINGS } from "./lib/constants.js";
import { log } from "./lib/logger.js";
import { initializeFoundryAdapter, editorAdapter } from "./adapter/index.js";

/**
 * Register module settings with Foundry VTT settings manager.
 */
function registerSettings() {
    if (typeof game === "undefined" || !game?.settings?.register) return;

    game.settings.register(MODULE_ID, "enableTabCompletion", {
        name: "BEES.Settings.EnableTabCompletion.Name",
        hint: "BEES.Settings.EnableTabCompletion.Hint",
        scope: "client",
        config: true,
        type: Boolean,
        default: DEFAULT_SETTINGS.enableTabCompletion
    });

    game.settings.register(MODULE_ID, "tabSize", {
        name: "BEES.Settings.TabSize.Name",
        hint: "BEES.Settings.TabSize.Hint",
        scope: "client",
        config: true,
        type: Number,
        default: DEFAULT_SETTINGS.tabSize
    });

    game.settings.register(MODULE_ID, "autoIndent", {
        name: "BEES.Settings.AutoIndent.Name",
        hint: "BEES.Settings.AutoIndent.Hint",
        scope: "client",
        config: true,
        type: Boolean,
        default: DEFAULT_SETTINGS.autoIndent
    });

    game.settings.register(MODULE_ID, "maxSuggestions", {
        name: "BEES.Settings.MaxSuggestions.Name",
        hint: "BEES.Settings.MaxSuggestions.Hint",
        scope: "client",
        config: true,
        type: Number,
        default: DEFAULT_SETTINGS.maxSuggestions
    });

    game.settings.register(MODULE_ID, "logVerbosity", {
        name: "BEES.Settings.LogVerbosity.Name",
        hint: "BEES.Settings.LogVerbosity.Hint",
        scope: "client",
        config: true,
        type: String,
        choices: {
            error: "Error",
            warn: "Warn",
            info: "Info",
            debug: "Debug"
        },
        default: DEFAULT_SETTINGS.logVerbosity,
        onChange: (value) => {
            log.setVerbosity(value);
        }
    });

    log.debug("Registered module settings");
}

/**
 * Module initialization hook.
 */
if (typeof Hooks !== "undefined") {
    Hooks.once("init", () => {
        log.info(`Initializing ${MODULE_NAME}`);
        registerSettings();
        const adapter = initializeFoundryAdapter();
        adapter.registerHooks();
    });
}
