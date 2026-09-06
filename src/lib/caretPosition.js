/**
 * Properties to copy from the textarea to the mirror element for caret calculation.
 * @type {Readonly<string[]>}
 */
const PROPERTIES_TO_COPY = Object.freeze([
    "direction",
    "boxSizing",
    "width",
    "height",
    "overflowX",
    "overflowY",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "borderStyle",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "fontStretch",
    "fontSize",
    "fontSizeAdjust",
    "lineHeight",
    "fontFamily",
    "textAlign",
    "textTransform",
    "textIndent",
    "textDecoration",
    "letterSpacing",
    "wordSpacing",
    "tabSize",
    "MozTabSize"
]);

/**
 * Calculate the pixel coordinates of the caret inside a textarea element.
 * @param {HTMLTextAreaElement} element - Target textarea element
 * @param {number} position - Caret character index (selectionEnd)
 * @returns {{top: number, left: number, height: number, clientX: number, clientY: number}} Caret position relative to element and viewport
 */
export function getCaretCoordinates(element, position) {
    if (!element || typeof document === "undefined") {
        return { top: 0, left: 0, height: 16, clientX: 0, clientY: 0 };
    }

    const computed = window.getComputedStyle ? window.getComputedStyle(element) : element.style;
    const isFirefox = Boolean(typeof navigator !== "undefined" && navigator.userAgent.includes("Firefox"));

    const mirrorDiv = document.createElement("div");
    mirrorDiv.id = "bakana-editor-caret-mirror";

    const style = mirrorDiv.style;
    style.whiteSpace = "pre-wrap";
    style.wordWrap = "break-word";
    style.position = "absolute";
    style.visibility = "hidden";
    style.top = "0px";
    style.left = "-9999px";

    for (const prop of PROPERTIES_TO_COPY) {
        if (computed[prop]) {
            style[prop] = computed[prop];
        }
    }

    if (isFirefox) {
        if (element.scrollHeight > parseInt(computed.height, 10)) {
            style.overflowY = "scroll";
        }
    } else {
        style.overflow = "hidden";
    }

    style.width = `${element.clientWidth}px`;

    const textContent = element.value.substring(0, position);
    mirrorDiv.textContent = textContent;

    const span = document.createElement("span");
    const remainingText = element.value.substring(position);
    span.textContent = remainingText.length > 0 ? remainingText : ".";
    mirrorDiv.appendChild(span);

    document.body.appendChild(mirrorDiv);

    const borderTopParsed = parseInt(computed.borderTopWidth ?? "0", 10);
    const borderLeftParsed = parseInt(computed.borderLeftWidth ?? "0", 10);
    const spanOffsetTop = span.offsetTop + (isNaN(borderTopParsed) ? 0 : borderTopParsed);
    const spanOffsetLeft = span.offsetLeft + (isNaN(borderLeftParsed) ? 0 : borderLeftParsed);

    const parsedLineHeight = parseInt(computed.lineHeight ?? "16", 10);
    const spanHeight = !isNaN(parsedLineHeight) && parsedLineHeight > 0
        ? parsedLineHeight
        : (span.offsetHeight > 0 ? span.offsetHeight : 16);

    const top = spanOffsetTop - element.scrollTop;
    const left = spanOffsetLeft - element.scrollLeft;

    const rect = element.getBoundingClientRect();
    const clientX = rect.left + left;
    const clientY = rect.top + top;

    document.body.removeChild(mirrorDiv);

    return {
        top,
        left,
        height: spanHeight,
        clientX,
        clientY
    };
}
