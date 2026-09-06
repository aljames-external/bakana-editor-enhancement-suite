import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import "../setup.js";
import { SuggestionPopup } from "../../src/completion/suggestionPopup.js";
import { COMPLETION_KINDS } from "../../src/lib/constants.js";

describe("SuggestionPopup Component", () => {
    let popup;
    const candidates = [
        { name: "controlled", kind: COMPLETION_KINDS.PROPERTY, detail: "object" },
        { name: "get", kind: COMPLETION_KINDS.METHOD, detail: "function" },
        { name: "placeables", kind: COMPLETION_KINDS.PROPERTY, detail: "array" }
    ];

    beforeEach(() => {
        popup = new SuggestionPopup();
    });

    it("initializes hidden with listbox role", () => {
        assert.equal(popup.isVisible(), false);
        assert.equal(popup.element.getAttribute("role"), "listbox");
    });

    it("renders candidates on show() and becomes visible", () => {
        const caretCoords = { clientX: 100, clientY: 100, height: 16 };
        popup.show(candidates, 0, caretCoords, "con", () => {});

        assert.equal(popup.isVisible(), true);
        assert.equal(popup.candidates.length, 3);
        assert.equal(popup.element.children.length, 3);

        const firstItem = popup.element.children[0];
        assert.ok(firstItem.className.includes("bakana-completion-selected"));
        assert.equal(firstItem.getAttribute("aria-selected"), "true");
    });

    it("cycles selection indices cleanly", () => {
        const caretCoords = { clientX: 100, clientY: 100, height: 16 };
        popup.show(candidates, 0, caretCoords, "", () => {});

        popup.setSelectedIndex(1);
        assert.equal(popup.selectedIndex, 1);
        assert.equal(popup.getSelectedCandidate()?.name, "get");

        // Forward wrap
        popup.setSelectedIndex(3);
        assert.equal(popup.selectedIndex, 0);

        // Backward wrap
        popup.setSelectedIndex(-1);
        assert.equal(popup.selectedIndex, 2);
    });

    it("hides and cleans up on destroy()", () => {
        popup.hide();
        assert.equal(popup.isVisible(), false);

        popup.destroy();
        assert.equal(popup.element, null);
    });
});
