import { formatShortcutForOS } from './util';

// Map storing elements' rendered tooltips.
const tooltips = new WeakMap();

// Utils for showing & hiding tools.
function showTooltip(element: HTMLElement) {
    let text: string = element.dataset.tooltip ?? '';
    let alignment: string = element.dataset.tooltipAlign ?? 'center';
    let hotkey: string | null = element.dataset.tooltipHotkey ?? null;

    const rect = element.getBoundingClientRect();
    let x: number = rect.left;
    let y: number = rect.bottom + 5;

    var tooltip = document.createElement('div');
    tooltip.style.position = 'fixed';
    tooltip.className = 'tooltip';
    tooltip.innerHTML = text;
    if (hotkey != null) {
        // Render hotkey in tooltip.
        var hotkeyEle: HTMLElement = document.createElement('span');
        hotkeyEle.classList.add('hotkey-box');
        hotkeyEle.textContent = formatShortcutForOS(hotkey.split('+'));
        tooltip.appendChild(hotkeyEle);
    }
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    document.body.appendChild(tooltip);

    // Re-center once we know tooltip width.
    const tooltipRect = tooltip.getBoundingClientRect();
    switch (alignment) {
        case 'center': {
            tooltip.style.left =
                rect.left +
                rect.width / 2 -
                tooltipRect.width / 2 +
                window.scrollX +
                'px';
            break;
        }
        case 'left': {
            tooltip.style.left = x - tooltipRect.width - 5 + 'px';
            tooltip.style.top =
                rect.bottom - rect.height / 2 - tooltipRect.height / 2 + 'px';
            break;
        }
        case 'top': {
            tooltip.style.left =
                rect.left +
                rect.width / 2 -
                tooltipRect.width / 2 +
                window.scrollX +
                'px';
            tooltip.style.top =
                rect.bottom - rect.height - tooltipRect.height - 5 + 'px';
        }
    }

    const existing: HTMLElement | null = tooltips.get(element);

    requestAnimationFrame(() => {
        tooltip.style.opacity = '1';
    });
    tooltips.set(element, tooltip);

    // If there was an existing tooltip, remove from DOM.
    if (existing) {
        existing.remove();
    }
}

function hideTooltip(element: HTMLElement) {
    const tooltip: HTMLElement = tooltips.get(element);
    if (tooltip) {
        requestAnimationFrame(() => {
            tooltip.style.opacity = '0';
            tooltip.remove();
        });
    }
}

// Listeners for rendering tooltips on elements.
document.addEventListener('mouseover', (e) => {
    const target = e.target;
    if (target && target instanceof Element) {
        const parent = target.closest('[data-tooltip]') as HTMLElement;
        if (parent) {
            showTooltip(parent);
        }
    }
});

document.addEventListener('mouseout', (e) => {
    const target = e.target;
    if (target && target instanceof Element) {
        const parent = target.closest('[data-tooltip]') as HTMLElement;
        if (parent) {
            hideTooltip(parent);
        }
    }
});
