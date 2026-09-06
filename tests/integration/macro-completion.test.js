import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import "../setup.js";
import { Completer } from "../../src/completion/completer.js";
import { EditorController } from "../../src/completion/editorController.js";

describe("Macro Completion Integration", () => {
    let textarea;
    let controller;
    let macroDoc;

    beforeEach(() => {
        macroDoc = {
            id: "macroDoc123",
            name: "Test Macro",
            type: "script",
            command: "",
            author: "user123"
        };

        // Setup mock canvas token and character
        globalThis.canvas.tokens.controlled = [
            {
                id: "token123",
                name: "Fighter Token",
                x: 100,
                y: 200,
                actor: {
                    id: "actor123",
                    name: "Fighter Actor",
                    system: {
                        attributes: {
                            hp: { value: 28, max: 30 },
                            ac: { value: 18 }
                        }
                    },
                    items: [
                        { id: "item1", name: "Longsword", type: "weapon" }
                    ],
                    rollAbilityTest: () => {}
                }
            }
        ];

        textarea = document.createElement("textarea");
        textarea.setAttribute("name", "command");
        document.body.appendChild(textarea);
        controller = new EditorController(textarea, macroDoc);
    });

    afterEach(() => {
        controller.destroy();
        if (textarea.parentNode) {
            textarea.parentNode.removeChild(textarea);
        }
        globalThis.canvas.tokens.controlled = [];
    });

    it("completes macro execution context variable 'actor'", () => {
        textarea.value = "actor.syst";
        textarea.selectionStart = 10;
        textarea.selectionEnd = 10;

        textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
        assert.equal(textarea.value, "actor.system");
    });

    it("completes deeply nested properties: 'actor.system.attributes.hp.'", () => {
        textarea.value = "actor.system.attributes.hp.";
        textarea.selectionStart = 27;
        textarea.selectionEnd = 27;

        textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
        assert.equal(controller.popup.isVisible(), true);

        const candidateNames = controller.popup.candidates.map((c) => c.name);
        assert.ok(candidateNames.includes("value"));
        assert.ok(candidateNames.includes("max"));
    });

    it("completes 'token.x' and 'token.y'", () => {
        textarea.value = "const startX = token.";
        textarea.selectionStart = textarea.value.length;
        textarea.selectionEnd = textarea.value.length;

        const completions = Completer.getCompletions(textarea.value, textarea.selectionStart, macroDoc);
        assert.ok(completions);
        const names = completions.candidates.map((c) => c.name);
        assert.ok(names.includes("x"));
        assert.ok(names.includes("y"));
        assert.ok(names.includes("actor"));
    });

    it("completes 'this.' properties of the active Macro document", () => {
        textarea.value = "this.";
        textarea.selectionStart = 5;
        textarea.selectionEnd = 5;

        const completions = Completer.getCompletions(textarea.value, 5, macroDoc);
        assert.ok(completions);
        const names = completions.candidates.map((c) => c.name);
        assert.ok(names.includes("name"));
        assert.ok(names.includes("type"));
        assert.ok(names.includes("command"));
    });

    it("completes 'speaker.' properties", () => {
        textarea.value = "speaker.";
        textarea.selectionStart = 8;
        textarea.selectionEnd = 8;

        const completions = Completer.getCompletions(textarea.value, 8, macroDoc);
        assert.ok(completions);
        const names = completions.candidates.map((c) => c.name);
        assert.ok(names.includes("scene"));
        assert.ok(names.includes("actor"));
        assert.ok(names.includes("alias"));
    });

    it("completes methods on actor (e.g. rollAbilityTest)", () => {
        textarea.value = "actor.roll";
        textarea.selectionStart = 10;
        textarea.selectionEnd = 10;

        textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
        assert.equal(textarea.value, "actor.rollAbilityTest");
    });
});
