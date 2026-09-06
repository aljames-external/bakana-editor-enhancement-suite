import { describe, it } from "node:test";
import assert from "node:assert/strict";
import "../setup.js";
import { version, findLongestCommonPrefix, escapeRegExp, localize } from "../../src/lib/utils.js";

describe("Utils Library", () => {
    describe("version.clamp", () => {
        it("returns true when version is within range", () => {
            assert.equal(version.clamp("13.330", "13", "14"), true);
            assert.equal(version.clamp("12.300", "12", "13"), true);
            assert.equal(version.clamp("14.000", "14"), true);
        });

        it("returns false when version is outside range", () => {
            assert.equal(version.clamp("12.300", "13", "14"), false);
            assert.equal(version.clamp("15.000", "13", "14"), false);
        });

        it("handles invalid or missing version values gracefully", () => {
            assert.equal(version.clamp(null, "13"), false);
            assert.equal(version.clamp("", "13"), false);
        });
    });

    describe("findLongestCommonPrefix", () => {
        it("returns empty string for empty input", () => {
            assert.equal(findLongestCommonPrefix([]), "");
        });

        it("returns the single string for 1-element array", () => {
            assert.equal(findLongestCommonPrefix(["hello"]), "hello");
        });

        it("finds common prefix among multiple strings", () => {
            assert.equal(findLongestCommonPrefix(["game", "gamepad", "gamer"]), "game");
            assert.equal(findLongestCommonPrefix(["token", "target", "table"]), "t");
            assert.equal(findLongestCommonPrefix(["alpha", "beta"]), "");
        });
    });

    describe("escapeRegExp", () => {
        it("escapes special regex characters", () => {
            assert.equal(escapeRegExp("foo.bar*baz?"), "foo\\.bar\\*baz\\?");
            assert.equal(escapeRegExp("a[b]c(d)"), "a\\[b\\]c\\(d\\)");
        });
    });

    describe("localize", () => {
        it("returns fallback when key is not a string", () => {
            assert.equal(localize(null, "default"), "default");
        });

        it("returns key when localization is present", () => {
            assert.equal(localize("BEES.TestKey", "default"), "BEES.TestKey");
        });
    });
});
