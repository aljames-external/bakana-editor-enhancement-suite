/**
 * The canonical identifier string for the module.
 * @type {string}
 */
export const MODULE_ID = "bakana-editor-enhancement-suite";

/**
 * The human-readable display name of the module.
 * @type {string}
 */
export const MODULE_NAME = "Bakana's Editor Enhancement Suite";

/**
 * The three-letter abbreviation (TLA) used for logging or prefixing.
 * @type {string}
 */
export const MODULE_TLA = "BEES";

/**
 * Default module configuration settings.
 * @type {Readonly<object>}
 */
export const DEFAULT_SETTINGS = Object.freeze({
    enableTabCompletion: true,
    tabSize: 2,
    autoIndent: true,
    maxSuggestions: 50,
    logVerbosity: "warn"
});

/**
 * Autocompletion item classification kinds.
 * @type {Readonly<Record<string, string>>}
 */
export const COMPLETION_KINDS = Object.freeze({
    METHOD: "method",
    PROPERTY: "property",
    GETTER: "getter",
    CLASS: "class",
    KEYWORD: "keyword",
    VARIABLE: "variable"
});

/**
 * Single-letter badge labels for completion kinds.
 * @type {Readonly<Record<string, string>>}
 */
export const BADGE_LABELS = Object.freeze({
    method: "ƒ",
    property: "P",
    getter: "G",
    class: "C",
    keyword: "K",
    variable: "V"
});

/**
 * JavaScript reserved words and syntax keywords.
 * @type {Readonly<string[]>}
 */
export const JS_KEYWORDS = Object.freeze([
    "async",
    "await",
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "export",
    "extends",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "let",
    "new",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "yield"
]);

/**
 * Standard JavaScript global object names available in standard execution contexts.
 * @type {Readonly<string[]>}
 */
export const STANDARD_GLOBALS = Object.freeze([
    "Array",
    "ArrayBuffer",
    "BigInt",
    "Boolean",
    "DataView",
    "Date",
    "Error",
    "EvalError",
    "Float32Array",
    "Float64Array",
    "Function",
    "Int8Array",
    "Int16Array",
    "Int32Array",
    "Intl",
    "JSON",
    "Map",
    "Math",
    "Number",
    "Object",
    "Promise",
    "Proxy",
    "RangeError",
    "ReferenceError",
    "Reflect",
    "RegExp",
    "Set",
    "String",
    "Symbol",
    "SyntaxError",
    "TypeError",
    "URIError",
    "Uint8Array",
    "Uint16Array",
    "Uint32Array",
    "Uint8ClampedArray",
    "WeakMap",
    "WeakSet",
    "clearImmediate",
    "clearInterval",
    "clearTimeout",
    "console",
    "decodeURI",
    "decodeURIComponent",
    "document",
    "encodeURI",
    "encodeURIComponent",
    "escape",
    "eval",
    "fetch",
    "isFinite",
    "isNaN",
    "parseFloat",
    "parseInt",
    "queueMicrotask",
    "setImmediate",
    "setInterval",
    "setTimeout",
    "structuredClone",
    "unescape",
    "window"
]);

/**
 * Standard Foundry VTT global names exposed on window.
 * @type {Readonly<string[]>}
 */
export const FOUNDRY_GLOBALS = Object.freeze([
    "Actor",
    "ActorDirectory",
    "ActiveEffect",
    "AudioHelper",
    "Canvas",
    "CanvasAnimation",
    "Cards",
    "CardsDirectory",
    "ChatMessage",
    "ChatLog",
    "Combat",
    "CombatTracker",
    "Combatant",
    "CONFIG",
    "CONST",
    "Dialog",
    "Document",
    "Drawing",
    "FilePicker",
    "Folder",
    "FontConfig",
    "FormApplication",
    "FormDataExtended",
    "Foundry",
    "Hooks",
    "ImagePopout",
    "Item",
    "ItemDirectory",
    "ItemMacro",
    "Journal",
    "JournalDirectory",
    "JournalEntry",
    "KeyboardManager",
    "Macro",
    "MacroDirectory",
    "MeasuredTemplate",
    "Note",
    "PIXI",
    "Playlist",
    "PlaylistDirectory",
    "PlaylistSound",
    "Ray",
    "Roll",
    "RollTable",
    "RollTableDirectory",
    "Scene",
    "SceneDirectory",
    "Sequencer",
    "Settings",
    "SettingsConfig",
    "Sidebar",
    "SidebarTab",
    "TableResult",
    "Tagger",
    "Template",
    "Tile",
    "Token",
    "TokenDocument",
    "User",
    "UserDirectory",
    "Wall",
    "Warpgate",
    "canvas",
    "foundry",
    "fromUuid",
    "fromUuidSync",
    "game",
    "keyboard",
    "loadTemplates",
    "renderTemplate",
    "ui"
]);
