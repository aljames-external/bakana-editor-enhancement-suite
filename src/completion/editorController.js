import { Completer } from "./completer.js";
import { SuggestionPopup } from "./suggestionPopup.js";
import { getCaretCoordinates } from "../lib/caretPosition.js";
import { MODULE_ID, DEFAULT_SETTINGS } from "../lib/constants.js";
import { log } from "../lib/logger.js";

/**
 * Controller attached to a Macro editor textarea to provide DevTools-style tab completion.
 */
export class EditorController {
    /**
     * Create an editor controller for a command input element.
     * @param {HTMLTextAreaElement} element - Textarea element
     * @param {object} [macroDoc] - Macro Document being edited
     */
    constructor(element, macroDoc = null) {
        this.element = element;
        this.macroDoc = macroDoc;
        this.popup = new SuggestionPopup();
        this._activeCompletion = null;

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onInput = this._onInput.bind(this);
        this._onBlur = this._onBlur.bind(this);
        this._onClick = this._onClick.bind(this);

        this._attachEvents();
    }

    /**
     * Get module configuration settings.
     * @returns {object} Module settings
     */
    get settings() {
        try {
            if (game?.settings?.get) {
                return {
                    enableTabCompletion: game.settings.get(MODULE_ID, "enableTabCompletion") ?? DEFAULT_SETTINGS.enableTabCompletion,
                    tabSize: game.settings.get(MODULE_ID, "tabSize") ?? DEFAULT_SETTINGS.tabSize,
                    autoIndent: game.settings.get(MODULE_ID, "autoIndent") ?? DEFAULT_SETTINGS.autoIndent,
                    maxSuggestions: game.settings.get(MODULE_ID, "maxSuggestions") ?? DEFAULT_SETTINGS.maxSuggestions
                };
            }
        } catch (e) {
            // Settings not registered yet
        }
        return DEFAULT_SETTINGS;
    }

    /**
     * Attach DOM event listeners to the textarea.
     * @private
     */
    _attachEvents() {
        if (!this.element) return;
        this.element.addEventListener("keydown", this._onKeyDown);
        this.element.addEventListener("input", this._onInput);
        this.element.addEventListener("blur", this._onBlur);
        this.element.addEventListener("click", this._onClick);
    }

    /**
     * Handle keydown events on the textarea.
     * @param {KeyboardEvent} event
     * @private
     */
    _onKeyDown(event) {
        if (!this.settings.enableTabCompletion) return;

        const isTab = event.key === "Tab";
        const isShift = event.shiftKey;
        const isEnter = event.key === "Enter";
        const isEscape = event.key === "Escape";
        const isArrowDown = event.key === "ArrowDown";
        const isArrowUp = event.key === "ArrowUp";

        // 1. Popup navigation when popup is visible
        if (this.popup.isVisible()) {
            if (isTab) {
                event.preventDefault();
                event.stopPropagation();
                if (isShift) {
                    this.popup.setSelectedIndex(this.popup.selectedIndex - 1);
                } else {
                    this.popup.setSelectedIndex(this.popup.selectedIndex + 1);
                }
                return;
            }

            if (isEnter) {
                event.preventDefault();
                event.stopPropagation();
                const selected = this.popup.getSelectedCandidate();
                if (selected) {
                    this._commitCandidate(selected);
                }
                return;
            }

            if (isArrowDown) {
                event.preventDefault();
                event.stopPropagation();
                this.popup.setSelectedIndex(this.popup.selectedIndex + 1);
                return;
            }

            if (isArrowUp) {
                event.preventDefault();
                event.stopPropagation();
                this.popup.setSelectedIndex(this.popup.selectedIndex - 1);
                return;
            }

            if (isEscape) {
                event.preventDefault();
                event.stopPropagation();
                this.popup.hide();
                this._activeCompletion = null;
                return;
            }
        }

        // 2. Tab key handling when popup is NOT visible
        if (isTab) {
            event.preventDefault();
            event.stopPropagation();

            if (isShift) {
                this._outdentCurrentLine();
                return;
            }

            this._handleTabCompletion();
            return;
        }

        // 3. Auto-indent on Enter when popup is NOT visible
        if (isEnter && this.settings.autoIndent && !event.shiftKey && !event.ctrlKey && !event.altKey) {
            this._handleAutoIndent(event);
            return;
        }
    }

    /**
     * Handle Tab key autocompletion triggering.
     * @private
     */
    _handleTabCompletion() {
        const text = this.element.value;
        const cursor = this.element.selectionEnd;
        const textBeforeCursor = text.slice(0, cursor);
        const currentLine = textBeforeCursor.split("\n").pop() ?? "";

        // If line is empty or preceding characters are only whitespace, insert tab spaces
        if (/^\s*$/.test(currentLine)) {
            this._insertText(" ".repeat(this.settings.tabSize));
            return;
        }

        const completion = Completer.getCompletions(
            text,
            cursor,
            this.macroDoc,
            this.settings.maxSuggestions
        );

        if (!completion || completion.candidates.length === 0) {
            // No completions: insert normal tab indentation spaces
            this._insertText(" ".repeat(this.settings.tabSize));
            return;
        }

        this._activeCompletion = completion;

        // Single candidate match: complete immediately
        if (completion.candidates.length === 1) {
            this._commitCandidate(completion.candidates[0]);
            return;
        }

        // Multiple candidates:
        const currentPrefix = completion.prefix;
        const lcp = completion.longestCommonPrefix;

        // If there's a longer common prefix than currently typed, complete up to LCP first
        if (lcp.length > currentPrefix.length) {
            this._replacePrefix(currentPrefix, lcp, completion.startPos, completion.endPos);
            // Refresh completion after LCP replacement
            const newCursor = this.element.selectionEnd;
            const updatedCompletion = Completer.getCompletions(
                this.element.value,
                newCursor,
                this.macroDoc,
                this.settings.maxSuggestions
            );
            if (updatedCompletion) {
                this._activeCompletion = updatedCompletion;
                this._showPopup(updatedCompletion);
            }
        } else {
            // Display popup dropdown with first candidate selected
            this._showPopup(completion);
        }
    }

    /**
     * Display the suggestion popup for the given completion result.
     * @param {object} completion
     * @private
     */
    _showPopup(completion) {
        const coords = getCaretCoordinates(this.element, this.element.selectionEnd);
        this.popup.show(
            completion.candidates,
            0,
            coords,
            completion.prefix,
            (candidate) => this._commitCandidate(candidate)
        );
    }

    /**
     * Commit a chosen candidate into the textarea.
     * @param {object} candidate - Chosen candidate object
     * @private
     */
    _commitCandidate(candidate) {
        if (!this._activeCompletion) {
            const cursor = this.element.selectionEnd;
            this._activeCompletion = Completer.getCompletions(
                this.element.value,
                cursor,
                this.macroDoc,
                this.settings.maxSuggestions
            );
        }

        if (!this._activeCompletion) return;

        const { prefix, startPos, endPos, accessType, quoteChar } = this._activeCompletion;
        let insertStr = candidate.name;

        // Bracket string completion: add closing quote and bracket if opened
        if (accessType === "bracket" && quoteChar) {
            insertStr = `${candidate.name}${quoteChar}]`;
        }

        this._replacePrefix(prefix, insertStr, startPos, endPos);
        this.popup.hide();
        this._activeCompletion = null;
        this.element.focus();
    }

    /**
     * Replace text between startPos and endPos with replacement string.
     * @param {string} prefix - Original prefix
     * @param {string} replacement - Replacement text
     * @param {number} startPos - Start index in text
     * @param {number} endPos - End index in text
     * @private
     */
    _replacePrefix(prefix, replacement, startPos, endPos) {
        this.element.setSelectionRange(startPos, endPos);

        let replaced = false;
        try {
            if (document.queryCommandSupported && document.queryCommandSupported("insertText")) {
                replaced = document.execCommand("insertText", false, replacement);
            }
        } catch (e) {
            replaced = false;
        }

        if (!replaced) {
            this.element.setRangeText(replacement, startPos, endPos, "end");
            this._dispatchInputEvents();
        }
    }

    /**
     * Insert text at current cursor position.
     * @param {string} text - Text to insert
     * @private
     */
    _insertText(text) {
        let inserted = false;
        try {
            if (document.queryCommandSupported && document.queryCommandSupported("insertText")) {
                inserted = document.execCommand("insertText", false, text);
            }
        } catch (e) {
            inserted = false;
        }

        if (!inserted) {
            const start = this.element.selectionStart;
            const end = this.element.selectionEnd;
            this.element.setRangeText(text, start, end, "end");
            this._dispatchInputEvents();
        }
    }

    /**
     * Dispatch native input and change events to notify Foundry forms.
     * @private
     */
    _dispatchInputEvents() {
        this.element.dispatchEvent(new Event("input", { bubbles: true }));
        this.element.dispatchEvent(new Event("change", { bubbles: true }));
    }

    /**
     * Outdent the current line by removing leading indentation spaces.
     * @private
     */
    _outdentCurrentLine() {
        const text = this.element.value;
        const cursor = this.element.selectionStart;
        const lineStart = text.lastIndexOf("\n", cursor - 1) + 1;
        const line = text.slice(lineStart);
        const match = line.match(/^ {1,4}/);

        if (match) {
            const numToRemove = Math.min(match[0].length, this.settings.tabSize);
            this.element.setSelectionRange(lineStart, lineStart + numToRemove);
            this._replacePrefix("", "", lineStart, lineStart + numToRemove);
        }
    }

    /**
     * Handle auto-indentation on Enter.
     * @param {KeyboardEvent} event
     * @private
     */
    _handleAutoIndent(event) {
        event.preventDefault();
        event.stopPropagation();

        const text = this.element.value;
        const cursor = this.element.selectionStart;
        const lineStart = text.lastIndexOf("\n", cursor - 1) + 1;
        const lineBeforeCursor = text.slice(lineStart, cursor);

        const indentMatch = lineBeforeCursor.match(/^(\s*)/);
        let indent = indentMatch ? indentMatch[1] : "";

        // If line ends with opening bracket or brace, increase indent
        if (/[\{\[\(:]\s*$/.test(lineBeforeCursor)) {
            indent += " ".repeat(this.settings.tabSize);
        }

        this._insertText("\n" + indent);
    }

    /**
     * Handle input events on textarea to update popup live if active.
     * @private
     */
    _onInput() {
        if (!this.popup.isVisible()) return;

        const cursor = this.element.selectionEnd;
        const completion = Completer.getCompletions(
            this.element.value,
            cursor,
            this.macroDoc,
            this.settings.maxSuggestions
        );

        if (completion && completion.candidates.length > 0) {
            this._activeCompletion = completion;
            this._showPopup(completion);
        } else {
            this.popup.hide();
            this._activeCompletion = null;
        }
    }

    /**
     * Handle textarea blur event.
     * @private
     */
    _onBlur() {
        // Small delay to allow clicking on popup items
        setTimeout(() => {
            this.popup.hide();
            this._activeCompletion = null;
        }, 150);
    }

    /**
     * Handle textarea click event to close popup if caret moved.
     * @private
     */
    _onClick() {
        if (this.popup.isVisible()) {
            this.popup.hide();
            this._activeCompletion = null;
        }
    }

    /**
     * Destroy controller and clean up all listeners.
     */
    destroy() {
        if (this.element) {
            this.element.removeEventListener("keydown", this._onKeyDown);
            this.element.removeEventListener("input", this._onInput);
            this.element.removeEventListener("blur", this._onBlur);
            this.element.removeEventListener("click", this._onClick);
        }
        if (this.popup) {
            this.popup.destroy();
        }
        this._activeCompletion = null;
    }
}
