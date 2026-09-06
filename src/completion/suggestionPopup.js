import { BADGE_LABELS } from "../lib/constants.js";
import { escapeRegExp } from "../lib/utils.js";

/**
 * Floating autocompletion dropdown menu (DevTools style).
 */
export class SuggestionPopup {
    /**
     * Create a suggestion popup instance.
     */
    constructor() {
        this.element = null;
        this.candidates = [];
        this.selectedIndex = 0;
        this.onSelect = null;
        this.onHover = null;
        this._prefix = "";
        this._buildElement();
    }

    /**
     * Build the popup container DOM element.
     * @private
     */
    _buildElement() {
        if (typeof document === "undefined") return;

        const el = document.createElement("div");
        el.className = "bakana-completion-popup";
        el.style.display = "none";
        el.setAttribute("role", "listbox");
        el.setAttribute("aria-label", "Autocomplete suggestions");

        el.addEventListener("mousedown", (e) => {
            e.preventDefault(); // Prevent blurring textarea
        });

        el.addEventListener("click", (e) => {
            const itemEl = e.target.closest(".bakana-completion-item");
            if (itemEl) {
                const index = parseInt(itemEl.dataset.index, 10);
                if (!isNaN(index) && this.onSelect) {
                    this.selectedIndex = index;
                    this.onSelect(this.candidates[index], index);
                }
            }
        });

        document.body.appendChild(el);
        this.element = el;
    }

    /**
     * Check if popup is currently visible.
     * @returns {boolean} True if visible
     */
    isVisible() {
        return Boolean(this.element && this.element.style.display !== "none");
    }

    /**
     * Render the candidates list inside popup.
     * @param {string} prefix - Currently typed prefix to highlight
     * @private
     */
    _renderItems(prefix = "") {
        if (!this.element) return;
        this._prefix = prefix;
        this.element.innerHTML = "";

        const prefixRegex = prefix ? new RegExp(`^(${escapeRegExp(prefix)})`, "i") : null;

        for (let i = 0; i < this.candidates.length; i++) {
            const candidate = this.candidates[i];
            const item = document.createElement("div");
            item.className = "bakana-completion-item" + (i === this.selectedIndex ? " bakana-completion-selected" : "");
            item.dataset.index = String(i);
            item.setAttribute("role", "option");
            item.setAttribute("aria-selected", String(i === this.selectedIndex));

            // Badge
            const badge = document.createElement("span");
            badge.className = `bakana-completion-badge badge-${candidate.kind}`;
            badge.textContent = BADGE_LABELS[candidate.kind] ?? "•";

            // Label with matched prefix highlighted
            const label = document.createElement("span");
            label.className = "bakana-completion-label";

            if (prefixRegex && prefixRegex.test(candidate.name)) {
                const matchLen = prefix.length;
                const matchSpan = document.createElement("span");
                matchSpan.className = "bakana-completion-match";
                matchSpan.textContent = candidate.name.slice(0, matchLen);

                const restSpan = document.createElement("span");
                restSpan.textContent = candidate.name.slice(matchLen);

                label.appendChild(matchSpan);
                label.appendChild(restSpan);
            } else {
                label.textContent = candidate.name;
            }

            // Detail
            const detail = document.createElement("span");
            detail.className = "bakana-completion-detail";
            detail.textContent = candidate.detail ?? "";

            item.appendChild(badge);
            item.appendChild(label);
            if (candidate.detail) {
                item.appendChild(detail);
            }

            this.element.appendChild(item);
        }

        this._scrollSelectedItemIntoView();
    }

    /**
     * Ensure the selected item is visible in the scroll container.
     * @private
     */
    _scrollSelectedItemIntoView() {
        if (!this.element) return;
        const selected = this.element.children[this.selectedIndex];
        if (selected) {
            selected.scrollIntoView({ block: "nearest" });
        }
    }

    /**
     * Position and display the suggestion popup.
     * @param {object[]} candidates - Array of completion candidates
     * @param {number} selectedIndex - Initial selected index
     * @param {{clientX: number, clientY: number, height: number}} caretCoords - Caret coordinates
     * @param {string} prefix - Typed prefix
     * @param {Function} onSelect - Callback when item is committed
     * @param {Function} [onHover] - Callback when item is hovered
     */
    show(candidates, selectedIndex, caretCoords, prefix, onSelect, onHover) {
        if (!this.element || !candidates || candidates.length === 0) return;

        this.candidates = candidates;
        this.selectedIndex = Math.max(0, Math.min(selectedIndex ?? 0, candidates.length - 1));
        this.onSelect = onSelect;
        this.onHover = onHover;

        this._renderItems(prefix);

        this.element.style.display = "block";

        // Position popup
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const caretHeight = caretCoords.height ?? 16;
        const popupRect = this.element.getBoundingClientRect();

        let top = caretCoords.clientY + caretHeight + 4;
        let left = caretCoords.clientX;

        // Overflow bottom: flip above caret
        if (top + popupRect.height > viewportHeight - 10) {
            top = Math.max(10, caretCoords.clientY - popupRect.height - 4);
        }

        // Overflow right: shift left
        if (left + popupRect.width > viewportWidth - 10) {
            left = Math.max(10, viewportWidth - popupRect.width - 10);
        }

        this.element.style.top = `${top}px`;
        this.element.style.left = `${left}px`;
    }

    /**
     * Update the selected candidate index.
     * @param {number} index - New selected index
     */
    setSelectedIndex(index) {
        if (!this.element || this.candidates.length === 0) return;
        const newIndex = ((index % this.candidates.length) + this.candidates.length) % this.candidates.length;
        if (newIndex === this.selectedIndex) return;

        const oldEl = this.element.children[this.selectedIndex];
        if (oldEl) {
            oldEl.classList.remove("bakana-completion-selected");
            oldEl.setAttribute("aria-selected", "false");
        }

        this.selectedIndex = newIndex;
        const newEl = this.element.children[this.selectedIndex];
        if (newEl) {
            newEl.classList.add("bakana-completion-selected");
            newEl.setAttribute("aria-selected", "true");
        }

        this._scrollSelectedItemIntoView();
    }

    /**
     * Get the currently selected candidate object.
     * @returns {object|null} Selected candidate or null
     */
    getSelectedCandidate() {
        if (!this.candidates || this.candidates.length === 0) return null;
        return this.candidates[this.selectedIndex] ?? null;
    }

    /**
     * Hide the suggestion popup.
     */
    hide() {
        if (this.element) {
            this.element.style.display = "none";
        }
    }

    /**
     * Destroy popup and remove DOM elements.
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.candidates = [];
    }
}
