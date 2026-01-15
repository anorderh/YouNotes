import { globals } from './global';

export function loadHtmlIntoElement(html: string): HTMLElement | null {
    const element = document.createElement('template');
    element.innerHTML = html;
    const el = element.content.firstElementChild;
    if (!el) {
        throw new Error('HTML must have a single root element');
    }
    return el as HTMLElement;
}

export function getElementByClass(className: string): HTMLElement | null {
    const elements = document.getElementsByClassName(className);
    if (elements.length > 0) {
        return elements[0] as HTMLElement;
    } else {
        return null;
    }
}

export function matchSize(input: HTMLElement, target: HTMLElement) {
    // Set container's dimensions to movie player.
    const rect = target.getBoundingClientRect();
    input.style.height = `${rect.height}px`;
    input.style.width = `${rect.width}px`;
}

export function debugLog(input: string) {
    globals.debug && console.log(input);
}

export function startLoggingClicks() {
    document.addEventListener(
        'click',
        (e) => {
            console.log('CLICK PATH:');
            e.composedPath().forEach((el, i) => {
                if (el instanceof HTMLElement) {
                    console.log(
                        i,
                        el.tagName,
                        el.id ? `#${el.id}` : '',
                        el.className ? `.${el.className}` : ''
                    );
                } else {
                    console.log(i, el);
                }
            });
        },
        true
    );
}

export function duringTransition(duration: number, callback: Function) {
    const start = performance.now();

    function tick(now: number) {
        callback();
        if (now - start < duration) {
            requestAnimationFrame(tick);
        }
    }

    requestAnimationFrame(tick);
}
