import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import sidepanelHtml from '../html/sidepanel.html';
import { globals } from './global';
import { SELECTORS } from './selectors';
import {
    duringTransition,
    getElementByClass,
    loadHtmlIntoElement,
} from './util';

export function attachSidepanel(): void {
    const video = document.querySelector(SELECTORS.YT.SELECTORS.VIDEO)!;
    const moviePlayer = document.getElementById('movie_player')!;
    const html5Video = getElementByClass(
        SELECTORS.YT.CLASSES.HTML5_VIDEO_CONTAINER
    )!;

    // Create container.
    const extContainer = document.createElement('div');
    extContainer.className = SELECTORS.EXT.CLASSES.EXT_CONTAINER;
    console.log(video);
    console.log(moviePlayer);
    console.log('scary!');
    moviePlayer.parentNode!.insertBefore(extContainer, moviePlayer);

    // Modify CSS of YT elements.
    moviePlayer.classList.add(SELECTORS.EXT.CLASSES.APPLIED_MOVIE_PLAYER);
    html5Video.classList.add(
        SELECTORS.EXT.CLASSES.APPLIED_HTML5_VIDEO_CONTAINER
    );
    video.classList.add(SELECTORS.EXT.CLASSES.APPLIED_VIDEO);
    getElementByClass(
        SELECTORS.YT.CLASSES.YTP_CHROME_TOP_BUTTONS
    )!.style!.pointerEvents = 'none';

    // Add moviePlayer container and sidepanel
    extContainer.appendChild(moviePlayer);
    const sidepanelHtmlElement = loadHtmlIntoElement(sidepanelHtml)!;
    extContainer.appendChild(sidepanelHtmlElement);
}

export async function setupSidepanelOpenClose(): Promise<void> {
    // Sidepanel functionality....
    const extContainer = document.querySelector('.ext-container')!;
    const html5Video = getElementByClass(
        SELECTORS.YT.CLASSES.HTML5_VIDEO_CONTAINER
    )!;
    const sidepanel = document.getElementById('sidepanel')!;
    const sidepanelContent = document.getElementById('sidepanel-content')!;
    const sidepanelBtn = document.getElementById('sidepanel-btn')!;
    const sidepanelIcon = document.getElementById('sidepanel-icon')!;
    const handle = document.querySelector('.resize-handle')! as HTMLElement;

    // Setup button hover.
    // TODO: Link thids with the chrome-bottom-btns visibility
    const appear = () => {
        if (!globals.open) {
            sidepanelBtn.style.left = '-40px';
        }
    };
    const hide = () => {
        if (!globals.open) {
            sidepanelBtn.style.left = '0px';
        }
    };

    // Setup open.close of sidepanel.
    const close = () => {
        globals.open = false;
        globals.width.lastWidth = sidepanel.getBoundingClientRect().width;
        sidepanelContent.style.width = `${globals.width.lastWidth}px`; // Fix to prevent weird wrapping.
        sidepanel.style.width = '0px';
        handle.style.pointerEvents = 'none';
        extContainer.addEventListener('mouseenter', appear);
        extContainer.addEventListener('mouseleave', hide);
        duringTransition(250, () => window.dispatchEvent(new Event('resize')));
    };
    const open = () => {
        extContainer.removeEventListener('mouseenter', appear);
        extContainer.removeEventListener('mouseleave', hide);
        globals.open = true;
        const videoWidth = html5Video.getBoundingClientRect().width;
        globals.width.upperLimit = videoWidth * 0.75;
        const target = videoWidth * 0.4;
        globals.width.lowerLimit = videoWidth * 0.25;
        if (
            globals.width.lastWidth == null ||
            globals.width.lastWidth < globals.width.lowerLimit ||
            globals.width.lastWidth > globals.width.upperLimit
        ) {
            sidepanel.style.width = `${target}px`;
        } else {
            sidepanel.style.width = `${globals.width.lastWidth}px`;
        }
        handle.style.pointerEvents = 'auto';
        duringTransition(250, () => window.dispatchEvent(new Event('resize')));
        setTimeout(() => {
            sidepanelContent.style.width = ``; // Fix to prevent weird wrapping.
        }, 250);
    };

    globals.open ? open() : close(); // Init.
    sidepanelBtn.addEventListener('click', (e) => {
        globals.open ? close() : open(); // React.
    });
}

export async function setupSidepanelResize(): Promise<void> {
    // Setup resize handle.
    const sidepanel = document.getElementById('sidepanel')!;
    const handle = document.querySelector('.resize-handle')! as HTMLElement;
    let startX: number, startWidth: number;
    let isResizing = false;
    handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = sidepanel.offsetWidth;
        document.body.style.cursor = 'ew-resize';
        sidepanel.classList.add('resizing');
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const delta = startX - e.clientX; // Left handle.
        // const delta = e.clientX - startX; // Right handle.

        // Enforce limits on resizing.
        const calculated = startWidth + delta;
        if (
            calculated > globals.width.upperLimit! ||
            calculated < globals.width.lowerLimit!
        )
            return;
        sidepanel.style.width = `${calculated}px`;
        window.dispatchEvent(new Event('resize'));
    });
    document.addEventListener('mouseup', () => {
        isResizing = false;
        document.body.style.removeProperty('cursor');
        sidepanel.classList.remove('resizing');
    });
}

// Events docs: https://tiptap.dev/docs/editor/api/events
export async function setupSidepanelEditor(): Promise<void> {
    // Setup editor.
    var editor = new Editor({
        element: document.querySelector('.content'),
        extensions: [StarterKit],
        editorProps: {
            attributes: {
                class: 'no-focus',
            },
        },
        content: '',
    });

    // Ignore YT hotkeys.
    document.querySelector('.content')!.addEventListener('keydown', (e) => {
        e.stopPropagation();
    });
    document.querySelector('.content')!.addEventListener('keyup', (e) => {
        e.stopPropagation();
    });

    // Clicking on body focuses text editor.
    document
        .getElementById('content-container')
        ?.addEventListener('click', (e) => {
            if (!editor.isFocused) {
                editor.chain().focus().run();
            }
        });

    // Save & edit content across different URLs.
    const statusElement = document.getElementById('status')!;
    let onUpdate: ({ editor }: { editor: Editor }) => Promise<void>;
    let key: string | null = null;
    let savedUrl: string | null = null;
    new MutationObserver(async () => {
        let currUrl = location.href;
        if (savedUrl != null && savedUrl === currUrl) return;

        // New 'href' identified, track url and reload content.
        savedUrl = currUrl;
        key = `${globals.storageKeyPrefix}${location.href}`;

        // Load initial content.
        const { [key]: content } = await chrome.storage.local.get(key);
        if (!!content) {
            editor.chain().setContent(content, { emitUpdate: false }).run();
            statusElement.textContent = 'Content loaded!';
        } else {
            editor.chain().setContent('', { emitUpdate: false }).run();
            statusElement.textContent = 'Take some notes!';
        }

        // Track & save updates.
        let saveTimeout: number | undefined;
        if (onUpdate != null) editor.off('update', onUpdate);
        onUpdate = async ({ editor }) => {
            const currContent = editor.getHTML();
            if (saveTimeout) clearTimeout(saveTimeout);
            statusElement.textContent = 'Saving content...';
            saveTimeout = window.setTimeout(async () => {
                await chrome.storage.local.set({ [key!]: currContent });
                statusElement.textContent = 'Content saved!';
                saveTimeout = undefined;
            }, 1500);
        };
        editor.on('update', onUpdate);
    }).observe(document, { childList: true, subtree: true });
}
