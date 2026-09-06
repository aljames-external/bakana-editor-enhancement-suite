import { describe, it } from "node:test";
import assert from "node:assert/strict";
import "../setup.js";
import { Completer } from "../../src/completion/completer.js";
import { COMPLETION_KINDS } from "../../src/lib/constants.js";

describe("Completer Engine", () => {
    describe("parseExpressionAtCursor", () => {
        it("returns null for empty text or trailing whitespace", () => {
            assert.equal(Completer.parseExpressionAtCursor("", 0), null);
            assert.equal(Completer.parseExpressionAtCursor("const a = 1; ", 13), null);
            assert.equal(Completer.parseExpressionAtCursor("game.user. \n", 12), null);
        });

        it("parses root identifiers", () => {
            const parsed = Completer.parseExpressionAtCursor("gam", 3);
            assert.ok(parsed);
            assert.equal(parsed.isRoot, true);
            assert.equal(parsed.propertyPrefix, "gam");
            assert.equal(parsed.startPos, 0);
            assert.equal(parsed.endPos, 3);
        });

        it("parses member dot expressions", () => {
            const text = "game.user.ch";
            const parsed = Completer.parseExpressionAtCursor(text, 12);
            assert.ok(parsed);
            assert.equal(parsed.isRoot, false);
            assert.equal(parsed.rootExpr, "game.user");
            assert.equal(parsed.propertyPrefix, "ch");
            assert.equal(parsed.startPos, 10);
            assert.equal(parsed.endPos, 12);
            assert.equal(parsed.accessType, "dot");
        });

        it("parses trailing dot member expressions", () => {
            const text = "game.user.";
            const parsed = Completer.parseExpressionAtCursor(text, 10);
            assert.ok(parsed);
            assert.equal(parsed.isRoot, false);
            assert.equal(parsed.rootExpr, "game.user");
            assert.equal(parsed.propertyPrefix, "");
            assert.equal(parsed.startPos, 10);
            assert.equal(parsed.endPos, 10);
        });

        it("parses optional chaining expressions", () => {
            const text = "canvas?.tokens?.pla";
            const parsed = Completer.parseExpressionAtCursor(text, 19);
            assert.ok(parsed);
            assert.equal(parsed.isRoot, false);
            assert.equal(parsed.rootExpr, "canvas?.tokens");
            assert.equal(parsed.propertyPrefix, "pla");
        });

        it("parses bracket string expressions", () => {
            const text = 'game["act';
            const parsed = Completer.parseExpressionAtCursor(text, 9);
            assert.ok(parsed);
            assert.equal(parsed.isRoot, false);
            assert.equal(parsed.rootExpr, "game");
            assert.equal(parsed.propertyPrefix, "act");
            assert.equal(parsed.accessType, "bracket");
            assert.equal(parsed.quoteChar, '"');
            assert.equal(parsed.startPos, 6);
        });
    });

    describe("extractLocalVariables", () => {
        it("extracts const, let, var variable names", () => {
            const script = `
                const myConst = 10;
                let myLet1 = "a", myLet2 = "b";
                var myVar = true;
            `;
            const vars = Completer.extractLocalVariables(script, script.length);
            assert.ok(vars.includes("myConst"));
            assert.ok(vars.includes("myLet1"));
            assert.ok(vars.includes("myLet2"));
            assert.ok(vars.includes("myVar"));
        });

        it("extracts function and class declarations", () => {
            const script = `
                function calculateDamage(amount) {}
                async function fetchActors() {}
                class CustomSpellEffect {}
                for (const target of targets) {}
            `;
            const vars = Completer.extractLocalVariables(script, script.length);
            assert.ok(vars.includes("calculateDamage"));
            assert.ok(vars.includes("fetchActors"));
            assert.ok(vars.includes("CustomSpellEffect"));
            assert.ok(vars.includes("target"));
        });
    });

    describe("resolvePath", () => {
        const scope = {
            game: globalThis.game,
            canvas: globalThis.canvas,
            myObj: {
                level1: {
                    level2: {
                        value: 42
                    }
                },
                items: ["first", "second"]
            }
        };

        it("resolves nested property paths", () => {
            assert.equal(Completer.resolvePath("myObj.level1.level2.value", scope), 42);
            assert.equal(Completer.resolvePath("game.user.name", scope), "Gamemaster");
        });

        it("resolves array indices", () => {
            assert.equal(Completer.resolvePath("myObj.items[0]", scope), "first");
            assert.equal(Completer.resolvePath("myObj.items[1]", scope), "second");
        });

        it("returns undefined safely for missing properties without throwing", () => {
            assert.equal(Completer.resolvePath("myObj.nonExistent.sub", scope), undefined);
            assert.equal(Completer.resolvePath("unknownRoot.property", scope), undefined);
        });
    });

    describe("inspectProperties", () => {
        const testObj = {
            active: true,
            count: 10,
            computeValue() { return 100; },
            get dynamicProperty() { return "dynamic"; },
            _privateField: "secret"
        };

        it("classifies methods, properties, and getters", () => {
            const props = Completer.inspectProperties(testObj, "");
            const names = props.map((p) => p.name);

            assert.ok(names.includes("active"));
            assert.ok(names.includes("computeValue"));
            assert.ok(names.includes("dynamicProperty"));
            assert.ok(names.includes("_privateField"));

            const methodCandidate = props.find((p) => p.name === "computeValue");
            assert.equal(methodCandidate?.kind, COMPLETION_KINDS.METHOD);

            const getterCandidate = props.find((p) => p.name === "dynamicProperty");
            assert.equal(getterCandidate?.kind, COMPLETION_KINDS.GETTER);
        });

        it("filters properties by prefix", () => {
            const props = Completer.inspectProperties(testObj, "comp");
            assert.equal(props.length, 1);
            assert.equal(props[0].name, "computeValue");
        });

        it("sorts public properties before private ones", () => {
            const props = Completer.inspectProperties(testObj, "");
            const publicIdx = props.findIndex((p) => !p.name.startsWith("_"));
            const privateIdx = props.findIndex((p) => p.name.startsWith("_"));
            assert.ok(publicIdx < privateIdx);
        });
    });

    describe("getRootCompletions", () => {
        it("includes macro scope, local variables, globals, and keywords", () => {
            const scope = Completer.getMacroScope();
            const localVars = ["myLocalTarget"];
            const completions = Completer.getRootCompletions("my", localVars, scope);

            const names = completions.map((c) => c.name);
            assert.ok(names.includes("myLocalTarget"));
        });

        it("matches Foundry globals", () => {
            const scope = Completer.getMacroScope();
            const completions = Completer.getRootCompletions("gam", [], scope);
            const names = completions.map((c) => c.name);
            assert.ok(names.includes("game"));
        });

        it("matches JS reserved keywords", () => {
            const scope = Completer.getMacroScope();
            const completions = Completer.getRootCompletions("as", [], scope);
            const names = completions.map((c) => c.name);
            assert.ok(names.includes("async"));
        });
    });

    describe("getCompletions", () => {
        it("returns full completion result object with candidates and LCP", () => {
            const script = "game.user.n";
            const result = Completer.getCompletions(script, script.length);
            assert.ok(result);
            assert.equal(result.prefix, "n");
            assert.ok(result.candidates.length >= 1);
            assert.ok(result.candidates.some((c) => c.name === "name"));
        });

        it("returns null if no matches found", () => {
            const script = "game.user.nonExistentZzzz";
            const result = Completer.getCompletions(script, script.length);
            assert.equal(result, null);
        });
    });
});
