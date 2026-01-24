import { globals } from './global';
import { SELECTORS } from './selectors';

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
                        el.className ? `.${el.className}` : '',
                    );
                } else {
                    console.log(i, el);
                }
            });
        },
        true,
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

export function isEmptyHtml(html: string): boolean {
    if (!html || html.trim() === '') return true;
    const root = document.createElement('div');
    root.innerHTML = html;
    root.querySelectorAll('br').forEach((br) => br.remove());

    // 1. Check for meaningful text.
    if (root.textContent?.trim()) return false;

    // 2. Check for meaningful elements.
    const meaningfulSelectors = [
        'img',
        'video',
        'audio',
        'iframe',
        'embed',
        'object',
        'svg',
        'canvas',
        'hr',
        '[data-type]', // tiptap / prosemirror nodes
    ];
    return !root.querySelector(meaningfulSelectors.join(','));
}

export function attachScrollFade(
    el: HTMLElement,
    { direction = 'vertical', fadeSize = 16 } = {},
) {
    if (!el) return;

    el.classList.add('scroll-fade');
    if (direction === 'horizontal') {
        el.classList.add('horizontal');
    }

    function update() {
        if (direction === 'vertical') {
            const atTop = el.scrollTop === 0;
            const atBottom =
                el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

            el.style.setProperty('--fade-top', atTop ? '0px' : `${fadeSize}px`);
            el.style.setProperty(
                '--fade-bottom',
                atBottom ? '0px' : `${fadeSize}px`,
            );
        } else {
            const atLeft = el.scrollLeft === 0;
            const atRight =
                el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;

            el.style.setProperty(
                '--fade-left',
                atLeft ? '0px' : `${fadeSize}px`,
            );
            el.style.setProperty(
                '--fade-right',
                atRight ? '0px' : `${fadeSize}px`,
            );
        }
    }

    // Observe size changes (important for dynamic content)
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);

    el.addEventListener('scroll', update, { passive: true });

    // Initial state
    requestAnimationFrame(update);

    // Return cleanup if needed
    return () => {
        resizeObserver.disconnect();
        el.removeEventListener('scroll', update);
    };
}

export function getContentSize(html: string): string {
    const bytes = new TextEncoder().encode(html).length;

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;

    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export function getVideoTime(): number {
    const video = document.querySelector(
        SELECTORS.YT.SELECTORS.VIDEO,
    )! as HTMLVideoElement;
    return video.currentTime;
}

export function changeVideoTime(time: number) {
    const video = document.querySelector(
        SELECTORS.YT.SELECTORS.VIDEO,
    )! as HTMLVideoElement;
    video.currentTime = time;
}

export function formatTimecode(timeInSeconds: number): string {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '0:00';

    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    const paddedSeconds = seconds.toString().padStart(2, '0');
    const paddedMinutes =
        hours > 0 ? minutes.toString().padStart(2, '0') : minutes.toString();

    if (hours > 0) {
        return `${hours}:${paddedMinutes}:${paddedSeconds}`;
    } else {
        return `${minutes}:${paddedSeconds}`;
    }
}

export function getVideoScreenshot() {
    const video = document.querySelector(
        SELECTORS.YT.SELECTORS.VIDEO,
    )! as HTMLVideoElement;

    let canvas = document.createElement('canvas');
    // 50%
    canvas.width = 960;
    canvas.height = 540;
    let ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    let dataUrl = canvas.toDataURL('image/jpeg', 1.0);

    return dataUrl;
}

export function getCollapsibleToggles(id: string) {
    const collapsible = document.getElementById(id)!;

    function open() {
        collapsible.style.height = 'auto';
        const height = collapsible.scrollHeight;

        // Animate from 0 → measured height
        collapsible.style.height = '0px';
        requestAnimationFrame(() => {
            collapsible.style.height = height + 'px';
        });
    }
    function close() {
        const height = collapsible.scrollHeight;
        collapsible.style.height = height + 'px';

        requestAnimationFrame(() => {
            collapsible.style.height = '0px';
        });
    }
    return [open, close];
}

export const imageTypes: string[] = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
];

// Returns data URL representing base64 encoding.
export function uploadFile(allowedTypes: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = allowedTypes.join(',');
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }
            if (!allowedTypes.includes(file.type)) {
                reject(
                    new Error(
                        `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
                    ),
                );
                return;
            }

            // Use file reader to get data url.
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result;
                if (typeof dataUrl !== 'string') {
                    reject(new Error('Failed to read file as Data URL'));
                    return;
                }
                resolve(dataUrl);
            };
            reader.onerror = () => {
                reject(new Error('File reading error'));
            };
            reader.readAsDataURL(file);
        };
        input.onerror = () => reject(new Error('File input error'));
        input.click();
    });
}

export function formatShortcutForOS(keys: string[]) {
    const platform = navigator.platform;
    const isMac = /mac|iphone|ipad|ipod|MacIntel/.test(platform);

    // Platform-specific mapping
    const keyMap: Record<string, string> = isMac
        ? {
              Ctrl: '⌘',
              Cmd: '⌘',
              Shift: '⇧',
              Alt: '⌥',
              Option: '⌥',
              Enter: '⏎',
              Backspace: '⌫',
          }
        : {
              Ctrl: 'Ctrl',
              Cmd: 'Ctrl',
              Shift: 'Shift',
              Alt: 'Alt',
              Option: 'Alt',
              Enter: 'Enter',
              Backspace: 'Backspace',
          };

    // Map each key
    const mappedKeys = keys.map((k) => keyMap[k] ?? k);

    // Join with plus sign
    return mappedKeys.join(isMac ? '' : '+');
}
