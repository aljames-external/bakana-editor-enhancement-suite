/**
 * Helper to safely localize a key, falling back to a default string if the key is not found.
 * @param {string} key - The translation key
 * @param {string} [fallback=key] - The fallback string if the key is not found
 * @returns {string} The localized string or fallback
 */
export function localize(key, fallback = key) {
    if (typeof key !== "string" || !key) return fallback ?? "";
    return game?.i18n?.has?.(key) ? game.i18n.localize(key) : fallback;
}

/**
 * Compare two semantic version strings. Returns true if v1 is newer than v2.
 * @param {string} v1 - Version 1
 * @param {string} v2 - Version 2
 * @returns {boolean} True if v1 > v2
 */
export function isNewerVersion(v1, v2) {
    if (foundry?.utils?.isNewerVersion) {
        return foundry.utils.isNewerVersion(v1, v2);
    }
    const p1 = String(v1 ?? "").split(".").map(Number);
    const p2 = String(v2 ?? "").split(".").map(Number);
    const length = Math.max(p1.length, p2.length);
    for (let i = 0; i < length; i++) {
        const n1 = p1[i] ?? 0;
        const n2 = p2[i] ?? 0;
        if (n1 > n2) return true;
        if (n1 < n2) return false;
    }
    return false;
}

/**
 * Version utility for semantic range verification across Foundry VTT releases.
 */
export const version = {
    /**
     * Check whether a semantic version string is clamped between min and max (inclusive).
     * @param {string} current - The current version string to test
     * @param {string} min - Minimum allowed version string
     * @param {string} [max] - Optional maximum allowed version string
     * @returns {boolean} True if current is between min and max inclusive, false otherwise.
     */
    clamp(current, min, max) {
        if (!current || !min) return false;
        if (isNewerVersion(min, current)) return false;
        if (max === undefined || max === null) return true;
        return !isNewerVersion(current, max);
    }
};

/**
 * Calculate the longest common prefix among an array of strings.
 * @param {string[]} strings - Array of candidate strings
 * @returns {string} The longest common prefix
 */
export function findLongestCommonPrefix(strings) {
    if (!strings || strings.length === 0) return "";
    if (strings.length === 1) return strings[0];

    let prefix = strings[0];
    for (let i = 1; i < strings.length; i++) {
        const str = strings[i];
        let j = 0;
        while (j < prefix.length && j < str.length && prefix[j] === str[j]) {
            j++;
        }
        prefix = prefix.slice(0, j);
        if (prefix === "") break;
    }
    return prefix;
}

/**
 * Escape special regex characters in a string.
 * @param {string} str - Raw string to escape
 * @returns {string} Regex-escaped string
 */
export function escapeRegExp(str) {
    return String(str ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export { notify } from "./logger.js";
