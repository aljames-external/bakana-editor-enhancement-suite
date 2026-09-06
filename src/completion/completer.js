import { COMPLETION_KINDS, JS_KEYWORDS, STANDARD_GLOBALS, FOUNDRY_GLOBALS } from "../lib/constants.js";
import { findLongestCommonPrefix, escapeRegExp } from "../lib/utils.js";
import { log } from "../lib/logger.js";

/**
 * Candidate completion item structure.
 * @typedef {object} CompletionCandidate
 * @property {string} name - The candidate text to complete.
 * @property {'method'|'property'|'getter'|'class'|'keyword'|'variable'} kind - The completion kind classification.
 * @property {string} [detail] - Additional information or type summary.
 */

/**
 * Parsed expression context at caret.
 * @typedef {object} ParsedExpression
 * @property {string} raw - The full matched expression before cursor.
 * @property {string} rootExpr - The root expression before the trailing property or dot.
 * @property {string} propertyPrefix - The property prefix currently being typed.
 * @property {'dot'|'bracket'|'root'} accessType - Type of access (dot, bracket, or root identifier).
 * @property {string|null} quoteChar - Quote character used in bracket access (' or "), or null.
 * @property {number} startPos - Index in text where the replaced prefix begins.
 * @property {number} endPos - Index in text where the replaced prefix ends (cursor index).
 * @property {boolean} isRoot - Whether this is a root identifier completion.
 */

/**
 * Safely lookup a global variable across window and globalThis.
 * @param {string} name - Global variable name
 * @returns {*} Found global value or undefined
 */
function getGlobalValue(name) {
    if (typeof window !== "undefined" && name in window && window[name] !== undefined) {
        return window[name];
    }
    if (typeof globalThis !== "undefined" && name in globalThis && globalThis[name] !== undefined) {
        return globalThis[name];
    }
    return undefined;
}

/**
 * Autocompletion Engine for Foundry VTT Macro Editor.
 * Emulates browser DevTools console tab completion.
 */
export class Completer {
    /**
     * Parse the text immediately preceding the cursor to determine the expression and property prefix.
     * @param {string} text - Full script text.
     * @param {number} cursorIndex - Caret position.
     * @returns {ParsedExpression|null} Parsed expression info or null if no completable token.
     */
    static parseExpressionAtCursor(text, cursorIndex) {
        if (!text || cursorIndex <= 0) return null;

        const textBeforeCursor = text.slice(0, cursorIndex);

        // Check if cursor is immediately preceded by whitespace
        if (/[\s\r\n]$/.test(textBeforeCursor)) {
            return null;
        }

        // Bracket string access match: e.g. `game["act` or `canvas['tok`
        const bracketMatch = textBeforeCursor.match(/([a-zA-Z0-9_$]+(?:\.[a-zA-Z0-9_$]+|\[\d+\]|(?:\([^)]*\)))*)\[(["'])([^"']*)$/);
        if (bracketMatch) {
            const rootExpr = bracketMatch[1];
            const quoteChar = bracketMatch[2];
            const propertyPrefix = bracketMatch[3];
            const startPos = cursorIndex - propertyPrefix.length;
            return {
                raw: bracketMatch[0],
                rootExpr,
                propertyPrefix,
                accessType: "bracket",
                quoteChar,
                startPos,
                endPos: cursorIndex,
                isRoot: false
            };
        }

        // Member access match: e.g. `game.user.`, `game.user.ch`, `canvas?.tokens?.pla`, `game.actors.get("id").`
        const memberMatch = textBeforeCursor.match(/((?:[a-zA-Z0-9_$]+(?:\??\.[a-zA-Z0-9_$]+|\[\d+\]|\[["'][^"']+["']\]|(?:\([^)]*\)))*?)(?:\??\.))([a-zA-Z0-9_$]*)$/);
        if (memberMatch) {
            let rootExpr = memberMatch[1];
            // Strip trailing dot or optional dot from root expression
            rootExpr = rootExpr.replace(/\??\.$/, "");
            const propertyPrefix = memberMatch[2];
            const startPos = cursorIndex - propertyPrefix.length;
            return {
                raw: memberMatch[0],
                rootExpr,
                propertyPrefix,
                accessType: "dot",
                quoteChar: null,
                startPos,
                endPos: cursorIndex,
                isRoot: false
            };
        }

        // Root identifier match: e.g. `gam`, `canv`, `myVar`
        const rootMatch = textBeforeCursor.match(/([a-zA-Z0-9_$]+)$/);
        if (rootMatch) {
            const propertyPrefix = rootMatch[1];
            const startPos = cursorIndex - propertyPrefix.length;
            return {
                raw: propertyPrefix,
                rootExpr: "",
                propertyPrefix,
                accessType: "root",
                quoteChar: null,
                startPos,
                endPos: cursorIndex,
                isRoot: true
            };
        }

        return null;
    }

    /**
     * Extract locally declared variable names from script text up to cursor position.
     * @param {string} text - Script text.
     * @param {number} cursorIndex - Caret position.
     * @returns {string[]} Array of unique local variable names.
     */
    static extractLocalVariables(text, cursorIndex) {
        if (!text || cursorIndex <= 0) return [];
        const textBeforeCursor = text.slice(0, cursorIndex);
        const vars = new Set();

        // Match const/let/var declarations: e.g. `const foo = 10, bar = "str";`
        const declRegex = /(?:const|let|var)\s+([^;\n]+)/g;
        let match;
        while ((match = declRegex.exec(textBeforeCursor)) !== null) {
            const raw = match[1];
            const varNameRegex = /(?:^|,)\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
            let varMatch;
            while ((varMatch = varNameRegex.exec(raw)) !== null) {
                const name = varMatch[1];
                if (name && !JS_KEYWORDS.includes(name)) {
                    vars.add(name);
                }
            }
        }

        // Match function declarations: e.g. `function myFunc(...)` or `async function myFunc(...)`
        const funcRegex = /(?:async\s+)?function\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
        while ((match = funcRegex.exec(textBeforeCursor)) !== null) {
            if (match[1]) vars.add(match[1]);
        }

        // Match class declarations: e.g. `class MyClass`
        const classRegex = /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        while ((match = classRegex.exec(textBeforeCursor)) !== null) {
            if (match[1]) vars.add(match[1]);
        }

        // Match for-loop variable declarations: e.g. `for (const item of items)`
        const forRegex = /for\s*\(\s*(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        while ((match = forRegex.exec(textBeforeCursor)) !== null) {
            if (match[1]) vars.add(match[1]);
        }

        return Array.from(vars);
    }

    /**
     * Build the evaluation and inspection scope combining macro context, globals, and locals.
     * @param {object} [macroDoc] - Optional Macro document being edited.
     * @returns {object} Scope mapping names to runtime values.
     */
    static getMacroScope(macroDoc) {
        const gameObj = getGlobalValue("game");
        const canvasObj = getGlobalValue("canvas");
        const chatMessageObj = getGlobalValue("ChatMessage");

        const controlledToken = canvasObj?.tokens?.controlled?.[0] ?? null;
        const userChar = gameObj?.user?.character ?? null;
        const activeActor = controlledToken?.actor ?? userChar ?? null;
        const activeSpeaker = chatMessageObj?.getSpeaker ? chatMessageObj.getSpeaker({ actor: activeActor, token: controlledToken }) : {};

        const scopeObj = {
            speaker: activeSpeaker,
            actor: activeActor,
            token: controlledToken,
            character: userChar,
            args: [],
            this: macroDoc ?? null
        };
        scopeObj.scope = scopeObj;

        const scope = Object.create(null);

        // Assign standard macro execution variables
        scope.speaker = activeSpeaker;
        scope.actor = activeActor;
        scope.token = controlledToken;
        scope.character = userChar;
        scope.scope = scopeObj;
        scope.args = [];
        scope.this = macroDoc ?? null;

        // Populate Foundry ambient globals
        for (const name of FOUNDRY_GLOBALS) {
            const val = getGlobalValue(name);
            if (val !== undefined) {
                scope[name] = val;
            }
        }

        // Populate Standard JS globals
        for (const name of STANDARD_GLOBALS) {
            const val = getGlobalValue(name);
            if (val !== undefined) {
                scope[name] = val;
            }
        }

        const docObj = getGlobalValue("document");
        const consoleObj = getGlobalValue("console");
        const windowObj = getGlobalValue("window");

        if (docObj) scope.document = docObj;
        if (consoleObj) scope.console = consoleObj;
        if (windowObj) scope.window = windowObj;

        return scope;
    }

    /**
     * Safely resolve a property path or root expression against the scope without side-effects.
     * @param {string} expr - Expression path to resolve (e.g. `canvas.tokens.controlled[0]`).
     * @param {object} scope - Scope object.
     * @returns {*} Resolved value or undefined.
     */
    static resolvePath(expr, scope) {
        if (!expr) return undefined;

        const cleanExpr = expr.trim();
        const segments = [];
        const segmentRegex = /(?:^\s*([a-zA-Z_$][a-zA-Z0-9_$]*))|(?:\??\.([a-zA-Z_$][a-zA-Z0-9_$]*))|(?:\[(\d+)\])|(?:\[(["'])([^"']+)\4\])/g;

        let match;
        while ((match = segmentRegex.exec(cleanExpr)) !== null) {
            if (match[1] !== undefined) {
                // Root identifier
                segments.push(match[1]);
            } else if (match[2] !== undefined) {
                // Dot property
                segments.push(match[2]);
            } else if (match[3] !== undefined) {
                // Numeric index
                segments.push(Number(match[3]));
            } else if (match[5] !== undefined) {
                // Bracket string key
                segments.push(match[5]);
            }
        }

        // If regex didn't consume the path, fallback to dot split
        if (segments.length === 0) {
            const rawParts = cleanExpr.split(/\??\./);
            for (const part of rawParts) {
                if (part) segments.push(part);
            }
        }

        if (segments.length === 0) return undefined;

        const rootName = segments[0];
        let current;

        if (rootName in scope) {
            current = scope[rootName];
        } else {
            current = getGlobalValue(rootName);
        }

        if (current === undefined) return undefined;

        for (let i = 1; i < segments.length; i++) {
            if (current === null || current === undefined) {
                return undefined;
            }
            const seg = segments[i];
            try {
                current = current[seg];
            } catch (err) {
                return undefined;
            }
        }

        return current;
    }

    /**
     * Inspect an object's prototype chain to extract property names and classify their kind.
     * Avoids invoking property getters.
     * @param {*} target - Target object to inspect.
     * @param {string} prefix - Filter prefix string.
     * @returns {CompletionCandidate[]} Array of classified candidate matches.
     */
    static inspectProperties(target, prefix = "") {
        if (target === null || target === undefined) return [];

        const propertyMap = new Map();
        let curr = target;
        let depth = 0;
        const maxDepth = 10;
        const excludedProps = new Set([
            "__proto__",
            "__defineGetter__",
            "__defineSetter__",
            "__lookupGetter__",
            "__lookupSetter__"
        ]);

        while (curr !== null && curr !== undefined && depth < maxDepth) {
            let names = [];
            try {
                names = Object.getOwnPropertyNames(curr);
            } catch (e) {
                break;
            }

            for (const name of names) {
                if (excludedProps.has(name) || name === "constructor" && depth > 0) continue;
                if (propertyMap.has(name)) continue;

                let kind = COMPLETION_KINDS.PROPERTY;
                let detail = "";

                try {
                    const desc = Object.getOwnPropertyDescriptor(curr, name);
                    if (desc) {
                        if (typeof desc.value === "function") {
                            kind = desc.value.prototype && Object.keys(desc.value.prototype).length > 0 && /^[A-Z]/.test(name)
                                ? COMPLETION_KINDS.CLASS
                                : COMPLETION_KINDS.METHOD;
                            detail = "function";
                        } else if (desc.get && !desc.value) {
                            kind = COMPLETION_KINDS.GETTER;
                            detail = "getter";
                        } else {
                            kind = COMPLETION_KINDS.PROPERTY;
                            detail = typeof desc.value;
                        }
                    }
                } catch (e) {
                    kind = COMPLETION_KINDS.PROPERTY;
                }

                propertyMap.set(name, {
                    name,
                    kind,
                    detail,
                    isOwn: depth === 0,
                    depth
                });
            }

            // Stop at Object.prototype to avoid polluting with generic Object methods unless inspecting Object itself
            if (curr === Object.prototype) break;

            try {
                curr = Object.getPrototypeOf(curr);
            } catch (e) {
                break;
            }
            depth++;
        }

        const normalizedPrefix = prefix.toLowerCase();
        const candidates = [];

        for (const [name, candidate] of propertyMap.entries()) {
            if (!prefix || name.toLowerCase().startsWith(normalizedPrefix)) {
                candidates.push(candidate);
            }
        }

        // Sort candidates:
        // 1. Exact case prefix matches first
        // 2. Own properties before prototype properties
        // 3. Public properties (no leading '_') before private/protected ('_')
        // 4. Alphabetical
        candidates.sort((a, b) => {
            const aExact = a.name.startsWith(prefix);
            const bExact = b.name.startsWith(prefix);
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;

            const aPrivate = a.name.startsWith("_");
            const bPrivate = b.name.startsWith("_");
            if (!aPrivate && bPrivate) return -1;
            if (aPrivate && !bPrivate) return 1;

            if (a.isOwn && !b.isOwn) return -1;
            if (!a.isOwn && b.isOwn) return 1;

            if (a.depth !== b.depth) return a.depth - b.depth;

            return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        });

        return candidates;
    }

    /**
     * Get root level completions (keywords, locals, globals, macro scope).
     * @param {string} prefix - Root prefix typed.
     * @param {string[]} localVars - Local variable names in script.
     * @param {object} scope - Active macro scope.
     * @returns {CompletionCandidate[]} Array of sorted completion candidates.
     */
    static getRootCompletions(prefix = "", localVars = [], scope = {}) {
        const candidateMap = new Map();
        const normalizedPrefix = prefix.toLowerCase();

        // 1. Local variables
        for (const varName of localVars) {
            if (!prefix || varName.toLowerCase().startsWith(normalizedPrefix)) {
                candidateMap.set(varName, {
                    name: varName,
                    kind: COMPLETION_KINDS.VARIABLE,
                    detail: "local variable"
                });
            }
        }

        // 2. Macro scope variables (actor, token, character, speaker, args, scope, this)
        for (const scopeKey of ["actor", "token", "character", "speaker", "args", "scope", "this"]) {
            if (!prefix || scopeKey.toLowerCase().startsWith(normalizedPrefix)) {
                if (!candidateMap.has(scopeKey)) {
                    candidateMap.set(scopeKey, {
                        name: scopeKey,
                        kind: COMPLETION_KINDS.VARIABLE,
                        detail: "macro context"
                    });
                }
            }
        }

        // 3. Foundry globals
        for (const name of FOUNDRY_GLOBALS) {
            if (!prefix || name.toLowerCase().startsWith(normalizedPrefix)) {
                if (!candidateMap.has(name)) {
                    const isClass = /^[A-Z]/.test(name);
                    candidateMap.set(name, {
                        name,
                        kind: isClass ? COMPLETION_KINDS.CLASS : COMPLETION_KINDS.VARIABLE,
                        detail: "foundry global"
                    });
                }
            }
        }

        // 4. Standard JS Globals
        for (const name of STANDARD_GLOBALS) {
            if (!prefix || name.toLowerCase().startsWith(normalizedPrefix)) {
                if (!candidateMap.has(name)) {
                    const isClass = /^[A-Z]/.test(name);
                    candidateMap.set(name, {
                        name,
                        kind: isClass ? COMPLETION_KINDS.CLASS : COMPLETION_KINDS.VARIABLE,
                        detail: "global"
                    });
                }
            }
        }

        // 5. JavaScript Reserved Keywords
        for (const kw of JS_KEYWORDS) {
            if (!prefix || kw.toLowerCase().startsWith(normalizedPrefix)) {
                if (!candidateMap.has(kw)) {
                    candidateMap.set(kw, {
                        name: kw,
                        kind: COMPLETION_KINDS.KEYWORD,
                        detail: "keyword"
                    });
                }
            }
        }

        // 6. Any other properties on window / global scope
        try {
            const win = typeof window !== "undefined" ? window : globalThis;
            const windowKeys = Object.getOwnPropertyNames(win);
            for (const key of windowKeys) {
                if (key.startsWith("_") || candidateMap.has(key)) continue;
                if (!prefix || key.toLowerCase().startsWith(normalizedPrefix)) {
                    candidateMap.set(key, {
                        name: key,
                        kind: typeof win[key] === "function" ? COMPLETION_KINDS.METHOD : COMPLETION_KINDS.PROPERTY,
                        detail: "window"
                    });
                }
            }
        } catch (e) {
            // Ignore window introspection restriction if any
        }

        const candidates = Array.from(candidateMap.values());

        // Sort candidates
        candidates.sort((a, b) => {
            const aExact = a.name.startsWith(prefix);
            const bExact = b.name.startsWith(prefix);
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;

            const aPrivate = a.name.startsWith("_");
            const bPrivate = b.name.startsWith("_");
            if (!aPrivate && bPrivate) return -1;
            if (aPrivate && !bPrivate) return 1;

            // Prioritize local variables, then macro scope, then keywords, then globals
            const getPriority = (c) => {
                if (c.detail === "local variable") return 1;
                if (c.detail === "macro context") return 2;
                if (c.kind === COMPLETION_KINDS.KEYWORD) return 3;
                if (c.detail === "foundry global") return 4;
                return 5;
            };

            const prioA = getPriority(a);
            const prioB = getPriority(b);
            if (prioA !== prioB) return prioA - prioB;

            return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        });

        return candidates;
    }

    /**
     * Compute completion candidates for given script text and cursor index.
     * @param {string} text - Full script text.
     * @param {number} cursorIndex - Caret position.
     * @param {object} [macroDoc] - Optional Macro document.
     * @param {number} [maxSuggestions=50] - Max suggestion limit.
     * @returns {{candidates: CompletionCandidate[], prefix: string, startPos: number, endPos: number, longestCommonPrefix: string, accessType: string, quoteChar: string|null}|null} Completion result
     */
    static getCompletions(text, cursorIndex, macroDoc = null, maxSuggestions = 50) {
        try {
            const parsed = this.parseExpressionAtCursor(text, cursorIndex);
            if (!parsed) return null;

            const scope = this.getMacroScope(macroDoc);
            let candidates = [];

            if (parsed.isRoot) {
                const localVars = this.extractLocalVariables(text, cursorIndex);
                candidates = this.getRootCompletions(parsed.propertyPrefix, localVars, scope);
            } else {
                const targetObj = this.resolvePath(parsed.rootExpr, scope);
                if (targetObj !== undefined && targetObj !== null) {
                    candidates = this.inspectProperties(targetObj, parsed.propertyPrefix);
                }
            }

            if (candidates.length === 0) return null;

            const candidateNames = candidates.map((c) => c.name);
            const lcp = findLongestCommonPrefix(candidateNames);

            return {
                candidates: candidates.slice(0, maxSuggestions),
                prefix: parsed.propertyPrefix,
                startPos: parsed.startPos,
                endPos: parsed.endPos,
                longestCommonPrefix: lcp,
                accessType: parsed.accessType,
                quoteChar: parsed.quoteChar
            };
        } catch (err) {
            log.debug("Error generating completions:", err);
            return null;
        }
    }
}
