import { debug } from './flags.js';

export async function loadHtmlIntoElement(html) {
    const element = document.createElement('template');
    element.innerHTML = html;
    return element.content;
}

export function getElementByClass(className) {
    const elements = document.getElementsByClassName(className);
    if (elements.length > 0) {
        return elements[0];
    } else {
        return null;
    }
}

export function matchSize(input, target) {
    // Set container's dimensions to movie player.
    const rect = target.getBoundingClientRect();
    input.style.height = `${rect.height}px`;
    input.style.width = `${rect.width}px`;
}

export function debugLog(input) {
    debug && console.log(input);
}
