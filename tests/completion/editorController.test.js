import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import "../setup.js";
import { EditorController } from "../../src/completion/editorController.js";

describe("EditorController Component", () => {
    let textarea;
    let controller;

    beforeEach(() => {
        textarea = document.createElement("textarea");
        textarea.setAttribute("name", "command");
        document.body.appendChild(textarea);
        controller = new EditorController(textarea, null);
    });

    afterEach(() => {
        controller.destroy();
        if (textarea.parentNode) {
            textarea.parentNode.removeChild(textarea);
        }
    });

    it("inserts tab spaces on empty line when Tab is pressed", () => {
        textarea.value = "";
        textarea.selectionStart = 0;
        textarea.selectionEnd = 0;

        const tabEvent = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
        textarea.dispatchEvent(tabEvent);

        assert.equal(tabEvent.defaultPrevented, true);
        assert.equal(textarea.value, "  ");
    });

    it("autocompletes single matching candidate immediately on Tab", () => {
        textarea.value = "game.user.n";
        textarea.selectionStart = 11;
        textarea.selectionEnd = 11;

        const tabEvent = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
        textarea.dispatchEvent(tabEvent);

        assert.equal(tabEvent.defaultPrevented, true);
        assert.equal(textarea.value, "game.user.name");
    });

    it("shows popup during typing input and commits selection on Tab", () => {
        textarea.value = "game.user.n";
        textarea.selectionStart = 11;
        textarea.selectionEnd = 11;

        // User types: input event fires
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        assert.equal(controller.popup.isVisible(), true);

        // User presses Tab: commits candidate
        const tabEvent = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
        textarea.dispatchEvent(tabEvent);

        assert.equal(tabEvent.defaultPrevented, true);
        assert.equal(controller.popup.isVisible(), false);
        assert.equal(textarea.value, "game.user.name");
    });

    it("navigates popup with ArrowDown and commits on Tab", () => {
        textarea.value = "game.";
        textarea.selectionStart = 5;
        textarea.selectionEnd = 5;

        // Open popup
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        assert.equal(controller.popup.isVisible(), true);

        // ArrowDown to next item
        textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
        assert.equal(controller.popup.selectedIndex, 1);

        const chosenCandidate = controller.popup.getSelectedCandidate();
        assert.ok(chosenCandidate);

        // Commit with Tab
        const tabEvent = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
        textarea.dispatchEvent(tabEvent);

        assert.equal(tabEvent.defaultPrevented, true);
        assert.equal(controller.popup.isVisible(), false);
        assert.equal(textarea.value, `game.${chosenCandidate.name}`);
    });

    it("commits selected candidate on Enter", () => {
        textarea.value = "game.";
        textarea.selectionStart = 5;
        textarea.selectionEnd = 5;

        // Open popup
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        assert.equal(controller.popup.isVisible(), true);

        const chosenCandidate = controller.popup.getSelectedCandidate();
        assert.ok(chosenCandidate);

        // Commit with Enter
        const enterEvent = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
        textarea.dispatchEvent(enterEvent);

        assert.equal(enterEvent.defaultPrevented, true);
        assert.equal(controller.popup.isVisible(), false);
        assert.equal(textarea.value, `game.${chosenCandidate.name}`);
    });

    it("closes popup on Escape", () => {
        textarea.value = "game.";
        textarea.selectionStart = 5;
        textarea.selectionEnd = 5;

        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        assert.equal(controller.popup.isVisible(), true);

        const escEvent = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
        textarea.dispatchEvent(escEvent);

        assert.equal(escEvent.defaultPrevented, true);
        assert.equal(controller.popup.isVisible(), false);
    });

    it("auto-indents on Enter preserving indentation and adding on brace", () => {
        textarea.value = "  function test() {";
        textarea.selectionStart = 19;
        textarea.selectionEnd = 19;

        const enterEvent = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
        textarea.dispatchEvent(enterEvent);

        assert.equal(enterEvent.defaultPrevented, true);
        assert.equal(textarea.value, "  function test() {\n    ");
    });

    it("outdents current line on Shift+Tab", () => {
        textarea.value = "    const x = 10;";
        textarea.selectionStart = 8;
        textarea.selectionEnd = 8;

        const shiftTabEvent = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true });
        textarea.dispatchEvent(shiftTabEvent);

        assert.equal(shiftTabEvent.defaultPrevented, true);
        assert.equal(textarea.value, "  const x = 10;");
    });
});
