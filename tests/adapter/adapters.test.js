import { describe, it } from "node:test";
import assert from "node:assert/strict";
import "../setup.js";
import {
    BaseFoundryVTTAdapter,
    FoundryVTTV12Adapter,
    FoundryVTTV13Adapter,
    FoundryVTTV14Adapter,
    initializeFoundryAdapter
} from "../../src/adapter/foundry/index.js";

describe("Foundry Version Adapters", () => {
    describe("BaseFoundryVTTAdapter", () => {
        it("initializes with version 0 and empty controllers map", () => {
            const adapter = new BaseFoundryVTTAdapter();
            assert.equal(adapter.version, 0);
            assert.equal(adapter.controllers.size, 0);
        });

        it("attaches and detaches controller for MacroConfig app", () => {
            const adapter = new BaseFoundryVTTAdapter();
            const textarea = document.createElement("textarea");
            textarea.setAttribute("name", "command");

            const app = {
                id: "macro-app-1",
                document: { id: "macro-doc-1", command: "" }
            };

            const html = document.createElement("div");
            html.appendChild(textarea);

            const controller = adapter.attachController(app, html);
            assert.ok(controller);
            assert.equal(adapter.controllers.size, 1);
            assert.equal(adapter.controllers.get("macro-app-1"), controller);

            adapter.detachController(app);
            assert.equal(adapter.controllers.size, 0);
        });

        it("registers renderMacroConfig and closeMacroConfig hooks", () => {
            const adapter = new BaseFoundryVTTAdapter();
            adapter.registerHooks();

            assert.ok(Hooks._events.has("renderMacroConfig"));
            assert.ok(Hooks._events.has("closeMacroConfig"));
        });
    });

    describe("FoundryVTTV12Adapter", () => {
        it("identifies as version 12 and extracts textarea from jQuery wrapper", () => {
            const adapter = new FoundryVTTV12Adapter();
            assert.equal(adapter.version, 12);

            const textarea = document.createElement("textarea");
            textarea.setAttribute("name", "command");

            const jqueryMock = {
                find: (sel) => sel === 'textarea[name="command"]' ? [textarea] : []
            };

            const found = adapter.getCommandElement({}, jqueryMock);
            assert.equal(found, textarea);
        });
    });

    describe("FoundryVTTV13Adapter", () => {
        it("identifies as version 13 and extracts textarea from app.element or html", () => {
            const adapter = new FoundryVTTV13Adapter();
            assert.equal(adapter.version, 13);

            const textarea = document.createElement("textarea");
            textarea.setAttribute("name", "command");

            const app = {
                element: {
                    querySelector: (sel) => sel === 'textarea[name="command"]' ? textarea : null
                }
            };

            const found = adapter.getCommandElement(app, null);
            assert.equal(found, textarea);
        });
    });

    describe("FoundryVTTV14Adapter", () => {
        it("identifies as version 14 and extracts textarea from ApplicationV2 app.element", () => {
            const adapter = new FoundryVTTV14Adapter();
            assert.equal(adapter.version, 14);

            const textarea = document.createElement("textarea");
            textarea.setAttribute("name", "command");

            const app = {
                element: {
                    querySelector: (sel) => sel === 'textarea[name="command"]' ? textarea : null
                }
            };

            const found = adapter.getCommandElement(app, null);
            assert.equal(found, textarea);
        });
    });

    describe("initializeFoundryAdapter", () => {
        it("instantiates FoundryVTTV13Adapter for v13.x", () => {
            globalThis.game.version = "13.330";
            const adapter = initializeFoundryAdapter();
            assert.equal(adapter.version, 13);
            assert.equal(adapter instanceof FoundryVTTV13Adapter, true);
        });

        it("instantiates FoundryVTTV14Adapter for v14.x", () => {
            globalThis.game.version = "14.000";
            const adapter = initializeFoundryAdapter();
            assert.equal(adapter.version, 14);
            assert.equal(adapter instanceof FoundryVTTV14Adapter, true);
        });

        it("instantiates FoundryVTTV12Adapter for v12.x", () => {
            globalThis.game.version = "12.331";
            const adapter = initializeFoundryAdapter();
            assert.equal(adapter.version, 12);
            assert.equal(adapter instanceof FoundryVTTV12Adapter, true);
        });
    });
});
