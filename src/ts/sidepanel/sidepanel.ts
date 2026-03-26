import { Editor, Range } from '@tiptap/core';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { FileHandler } from '@tiptap/extension-file-handler';
import Highlight from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import { BulletList, TaskItem, TaskList } from '@tiptap/extension-list';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Placeholder } from '@tiptap/extensions';
import { Markdown } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';
import { all, createLowlight } from 'lowlight';
import collapseActionsHtml from '../../html/action-toggle/collapse-actions.html';
import expandActionsHtml from '../../html/action-toggle/expand-actions.html';
import sidepanelHtml from '../../html/sidepanel.html';
import copiedStatusHtml from '../../html/status-text/copied-status.html';
import loadedStatusHtml from '../../html/status-text/loaded-status.html';
import savedStatusHtml from '../../html/status-text/saved-status.html';
import savingStatusHtml from '../../html/status-text/saving-status.html';
import { globals } from '../global';
import { MyCommandManager } from '../nodes/commands';
import { LinkShortcut } from '../nodes/link-shortcut';
import { ParagraphWithTab } from '../nodes/tab';
import { Timestamp } from '../nodes/timestamp';
import {
    ExtensionMessage,
    ExtensionMessageDeleteRow,
    ExtensionMessageType,
    MenuButtonRule,
    VideoMetadata,
} from '../types/interfaces';
import {
    attachScrollFade,
    duringTransition,
    formatShortcutForOS,
    formatTimecode,
    generateKey,
    getContentSize,
    getElementByClass,
    getVideoMetadata,
    getVideoScreenshot,
    getVideoTime,
    imageTypes,
    isEmptyHtml,
    loadHtmlIntoElement,
    readVideoMetadata,
    uploadFile,
} from '../util';
import { SidepanelIndicator } from './indicator';
import { SELECTORS } from './selectors';

export function attachSidepanel() {
    const video = document.querySelector(SELECTORS.YT.SELECTORS.VIDEO)!;
    const moviePlayer = document.getElementById('movie_player')!;
    const html5Video = getElementByClass(
        SELECTORS.YT.CLASSES.HTML5_VIDEO_CONTAINER,
    )!;
    const injectContainer = document.querySelector('#ytd-player #container')!;

    // Create container.
    const extContainer = document.createElement('div');
    extContainer.className = SELECTORS.EXT.CLASSES.EXT_CONTAINER;
    injectContainer.appendChild(extContainer);

    // Modify CSS of YT elements.
    moviePlayer.classList.add(SELECTORS.EXT.CLASSES.APPLIED_MOVIE_PLAYER);
    html5Video.classList.add(
        SELECTORS.EXT.CLASSES.APPLIED_HTML5_VIDEO_CONTAINER,
    );
    video.classList.add(SELECTORS.EXT.CLASSES.APPLIED_VIDEO);
    getElementByClass(
        SELECTORS.YT.CLASSES.YTP_CHROME_TOP_BUTTONS,
    )!.style!.pointerEvents = 'none';

    // Add moviePlayer container and sidepanel
    extContainer.appendChild(moviePlayer);
    const sidepanelHtmlElement = loadHtmlIntoElement(sidepanelHtml)!;
    extContainer.appendChild(sidepanelHtmlElement);
}

export function loadImages() {
    const sidepanelIndicator = document.getElementById(
        'sidepanel-indicator',
    ) as HTMLImageElement;
    sidepanelIndicator.src = chrome.runtime.getURL('images/younotes_logo.png');
}

export async function setupSidepanelOpenClose(): Promise<void> {
    // Sidepanel functionality....
    const ytdPlayer = document.querySelector(
        SELECTORS.YT.SELECTORS.YTD_PLAYER,
    )!;
    const extContainer = document.querySelector('.ext-container')!;
    const html5Video = getElementByClass(
        SELECTORS.YT.CLASSES.HTML5_VIDEO_CONTAINER,
    )!;
    const sidepanel = document.getElementById('sidepanel')!;
    const sidepanelContent = document.getElementById('sidepanel-content')!;
    const sidepanelBtn = document.getElementById('sidepanel-btn')!;
    const handle = document.querySelector('.resize-handle')! as HTMLElement;

    // Auto hide functionality.
    let autoHideId: number;
    const autoHide = () => {
        autoHideId = setTimeout(() => {
            hide();
        }, 3000);
    };
    const clearAutoHide = () => {
        if (autoHideId != null) {
            clearTimeout(autoHideId);
        }
    };

    // Setup button hover.
    const appear = () => {
        sidepanelBtn.style.left = '-40px';
        globals.appeared = true;
        if (!globals.open) {
            clearAutoHide();
            autoHide();
        }
    };
    const hide = () => {
        sidepanelBtn.style.left = '0px';
        globals.appeared = false;
        if (!globals.open) {
            clearAutoHide();
        }
    };

    // Setup function to track width upper & lower limits of YTD player.
    let lastYtdPlayerWidth: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
        const ytdPlayerWidth = ytdPlayer.getBoundingClientRect().width;
        const sidepanelIntendedWidth = Number(
            (sidepanel.style.width ?? '0px').replace('px', ''),
        );

        // Only invoke on width changes.
        // For some reason `ResizeObserver` fires on alot more than resize.
        if (ytdPlayerWidth != lastYtdPlayerWidth) {
            globals.width.lowerLimit = (ytdPlayerWidth * 1) / 4;
            globals.width.upperLimit = (ytdPlayerWidth * 3) / 4;

            // Ensure sidepanel doesn't pass those limits.
            if (sidepanelIntendedWidth < globals.width.lowerLimit) {
                sidepanel.style.width = `${globals.width.lowerLimit}px`;
                duringTransition(250, () =>
                    window.dispatchEvent(new Event('resize')),
                );
            } else if (sidepanelIntendedWidth > globals.width.upperLimit) {
                sidepanel.style.width = `${globals.width.upperLimit}px`;
                duringTransition(250, () =>
                    window.dispatchEvent(new Event('resize')),
                );
            }
            lastYtdPlayerWidth = ytdPlayerWidth;
        }
    });

    // Setup open/close of sidepanel.
    const close = async () => {
        globals.open = false;
        if (globals.appeared) {
            clearAutoHide();
            autoHide();
        }

        const sidepanelWidth = sidepanel.getBoundingClientRect().width;
        if (sidepanelWidth != 0) {
            globals.width.lastWidth = sidepanel.getBoundingClientRect().width;
            sidepanelContent.style.width = `${globals.width.lastWidth}px`; // Fix to prevent weird wrapping.
        }
        sidepanel.style.width = '0px';

        if (ytdPlayer) {
            resizeObserver.unobserve(ytdPlayer); // Get rid of resize observer.
        }
        handle.style.pointerEvents = 'none';
        extContainer.addEventListener('mousemove', appear);
        extContainer.addEventListener('mouseleave', hide);
        duringTransition(250, () => window.dispatchEvent(new Event('resize')));
    };
    const open = async () => {
        extContainer.removeEventListener('mousemove', appear);
        extContainer.removeEventListener('mouseleave', hide);
        clearAutoHide();
        globals.open = true;
        if (!globals.appeared) {
            appear();
        }

        const videoWidth = html5Video.getBoundingClientRect().width;
        const target = videoWidth * 0.4;
        if (
            globals.width.lastWidth == null ||
            globals.width.lastWidth < globals.width.lowerLimit! ||
            globals.width.lastWidth > globals.width.upperLimit!
        ) {
            let width = `${target}px`;
            sidepanelContent.style.width = width;
            sidepanel.style.width = width;
        } else {
            let width = `${globals.width.lastWidth}px`;
            sidepanelContent.style.width = width;
            sidepanel.style.width = width;
        }

        // Setup resize observer to clamp sidepanel width.
        resizeObserver.observe(ytdPlayer);

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

    // Store callbacks for later.
    globals.callbacks.open = open;
    globals.callbacks.close = close;
}

export async function setupSidepanelResize(): Promise<void> {
    // Setup resize handle.
    const moviePlayer = document.getElementById(SELECTORS.YT.IDS.MOVIE_PLAYER)!;
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
        ) {
            return;
        }
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
    const target = document.querySelector('.content');
    const contentContainer = document.getElementById('content-container')!;
    const lowlight = createLowlight(all);

    // Setup editor.
    var editor = new Editor({
        element: target,
        extensions: [
            StarterKit.configure({
                link: {
                    defaultProtocol: 'https',
                },
                bulletList: false,
                undoRedo: {
                    depth: 100,
                },
                codeBlock: false,
                listKeymap: false,
                dropcursor: {
                    color: '#38383a',
                },
                paragraph: false,
            }),
            BulletList,
            ParagraphWithTab,
            TaskItem.configure({
                nested: true,
            }),
            TaskList,
            Placeholder.configure({
                placeholder: 'Take some notes ...',
            }),
            Highlight,
            Markdown,
            Timestamp,
            Image.configure({
                allowBase64: true,
                inline: false,
                resize: {
                    enabled: true,
                    alwaysPreserveAspectRatio: true,
                },
            }),
            FileHandler.configure({
                allowedMimeTypes: [
                    'image/png',
                    'image/jpeg',
                    'image/gif',
                    'image/webp',
                ],
                onDrop: (currentEditor, files, pos) => {
                    files.forEach((file) => {
                        const fileReader = new FileReader();
                        fileReader.readAsDataURL(file);
                        fileReader.onload = () => {
                            currentEditor
                                .chain()
                                .insertContent([
                                    {
                                        type: 'image',
                                        attrs: {
                                            src: fileReader.result,
                                        },
                                    },
                                ])
                                .focus()
                                .run();
                        };
                    });
                },
                onPaste: (currentEditor, files) => {
                    files.forEach((file) => {
                        const fileReader = new FileReader();

                        fileReader.readAsDataURL(file);
                        fileReader.onload = () => {
                            currentEditor
                                .chain()
                                .insertContent([
                                    {
                                        type: 'image',
                                        attrs: {
                                            src: fileReader.result,
                                        },
                                    },
                                    {
                                        type: 'paragraph',
                                    },
                                ])
                                .focus()
                                .run();
                        };
                    });
                },
            }),
            CodeBlockLowlight.configure({
                enableTabIndentation: true,
                tabSize: 4,
                lowlight,
            }),
            MyCommandManager.configure({
                rules: [
                    // Command to add timestamp.
                    {
                        trigger: '/ts',
                        action: (editor: Editor, range: Range) => {
                            const timestamp = getVideoTime();
                            const timecode = formatTimecode(timestamp);
                            editor
                                .chain()
                                .deleteRange(range)
                                .insertContent({
                                    type: 'timestamp',
                                    attrs: { timestamp },
                                    content: [{ type: 'text', text: timecode }],
                                })
                                .focus()
                                .run();
                        },
                    },
                    // Command to take screenshots.
                    {
                        trigger: '/ss',
                        action: (editor: Editor, range: Range) => {
                            editor
                                .chain()
                                .deleteRange(range)
                                .insertContent([
                                    {
                                        type: 'image',
                                        attrs: {
                                            src: getVideoScreenshot(),
                                        },
                                    },
                                    {
                                        type: 'paragraph',
                                    },
                                ])
                                .focus(editor.state.selection.to + 1)
                                .run();
                        },
                    },
                    // Date.
                    {
                        trigger: '/date',
                        action: (editor: Editor, range: Range) => {
                            const now = new Date();
                            const localDate = now.toLocaleDateString();
                            editor
                                .chain()
                                .deleteRange(range)
                                .insertContent({
                                    type: 'paragraph',
                                    content: [
                                        { type: 'text', text: localDate },
                                    ],
                                })
                                .focus()
                                .run();
                        },
                    },
                    // Upload image.
                    {
                        trigger: '/img',
                        action: async (editor: Editor, range: Range) => {
                            const dataUrl = await uploadFile(imageTypes);
                            editor
                                .chain()
                                .deleteRange(range)
                                .insertContent([
                                    {
                                        type: 'image',
                                        attrs: {
                                            src: dataUrl,
                                        },
                                    },
                                    {
                                        type: 'paragraph',
                                    },
                                ])
                                .focus(editor.state.selection.to + 1)
                                .run();
                        },
                    },
                ],
            }),
            Subscript,
            Superscript,
            LinkShortcut,
        ],
        editorProps: {
            attributes: {
                class: 'no-focus',
            },
            // This makes the editor scroll despite not being at the bottom!
            // Works with CSS class '.bs .tiptap > *:last-child'
            scrollThreshold: { top: 0, right: 0, bottom: 30, left: 0 },
        },
        content: '',
    });
    editor.commands.blur();

    // Ignore YT hotkeys.
    document.querySelector('.content')!.addEventListener('keydown', (e) => {
        e.stopPropagation();
    });
    document.querySelector('.content')!.addEventListener('keyup', (e) => {
        e.stopPropagation();
    });

    // Clicking on body focuses text editor.
    contentContainer.addEventListener('click', (e) => {
        if (!editor.isFocused) {
            editor.chain().focus().run();
        }
    });

    // Give vertical scroll fade to content container.
    attachScrollFade(contentContainer, {
        direction: 'vertical',
        fadeSize: 24,
    });

    // Save editor globally.
    globals.editor = editor;
}

export async function setupSidepanelLoadAndSave(): Promise<void> {
    // Save & edit content across different URLs.
    const editor = globals.editor!;
    const statusElement = document.getElementById('status')!;
    const sizeElement = document.getElementById('size-text')!;
    const sidepanelIndicator: HTMLImageElement = (document.getElementById(
        'sidepanel-indicator',
    ) as HTMLImageElement)!;
    let onUpdate: ({ editor }: { editor: Editor }) => Promise<void>;
    let savedUrl: string | null = null;

    // Track link changes via `href`/
    new MutationObserver(async () => {
        if (chrome.storage != null) {
            let currUrl = location.href;
            /*
                Ensure page...
                    1. Has changed
                    2. Is a youtube video watch page.
            */
            if (savedUrl != null && savedUrl === currUrl) return;
            if (
                !/^https:\/\/www\.youtube\.com\/watch(\?.*)?$/.test(
                    window.location.href,
                )
            )
                return;

            // New 'href' identified, track url, used state, and reload content.
            savedUrl = currUrl;
            globals.used = false;
            const metadataKey = generateKey.metadata();
            const contentKey = generateKey.content();
            const fetch = async (
                key: string,
            ): Promise<string | VideoMetadata | null> => {
                let result = await chrome.storage.local.get(key);
                if (!result) return null;
                const { [key]: output } = result as { [key: string]: string };
                return output;
            };

            // Load initial content.
            const content = (await fetch(contentKey)) as string | null;
            if (!isEmptyHtml(content ?? '')) {
                // Count load as a 'use';
                const metadata = await readVideoMetadata();
                if (metadata && !globals.used) {
                    metadata.uses += 1;
                    await chrome.storage.local.set({
                        [metadataKey!]: metadata,
                    });
                    globals.used = true;
                }

                // Existing html.
                editor
                    .chain()
                    .setContent(content, {
                        emitUpdate: false,
                        parseOptions: {
                            preserveWhitespace: true,
                        },
                    })
                    .run();
                SidepanelIndicator.toggle(true);
                statusElement.innerHTML = loadedStatusHtml;
                sizeElement.innerHTML = getContentSize(content ?? '');
            } else {
                // Empty html.
                editor.chain().setContent('', { emitUpdate: false }).run();
                SidepanelIndicator.toggle(false);
                statusElement.innerHTML = 'Welcome to YouNotes!';
                sizeElement.innerHTML = '0 B';
            }

            // Track & save updates.
            let waitTimeout: number | undefined;
            let saveTimeout: number | undefined;
            if (onUpdate != null) editor.off('update', onUpdate);
            onUpdate = async ({ editor }) => {
                const currContent = editor.getHTML();

                if (waitTimeout) {
                    clearTimeout(waitTimeout);
                }
                if (saveTimeout) {
                    // Change occurred during save, stop save.
                    clearTimeout(saveTimeout);
                    statusElement.innerHTML = '';
                }

                waitTimeout = window.setTimeout(async () => {
                    statusElement.innerHTML = savingStatusHtml;
                    saveTimeout = window.setTimeout(async () => {
                        if (!isEmptyHtml(currContent ?? '')) {
                            const contentSize = getContentSize(currContent);
                            const existingMetadata = await readVideoMetadata();
                            const freshMetadata = await getVideoMetadata();
                            freshMetadata.size = contentSize;
                            freshMetadata.uses = existingMetadata?.uses ?? 1;
                            await chrome.storage.local.set({
                                [metadataKey!]: freshMetadata,
                            });
                            await chrome.storage.local.set({
                                [contentKey!]: currContent,
                            });
                            SidepanelIndicator.toggle(true);
                            sizeElement.innerHTML = contentSize;
                        } else {
                            await chrome.storage.local.remove(contentKey!);
                            await chrome.storage.local.remove(metadataKey!);
                            // Not needed, the Popup recalculates every render.
                            // await chrome.runtime.sendMessage({
                            //     type: ExtensionMessageType.DELETE_ROW,
                            //     url: location.href,
                            // } as ExtensionMessageDeleteRow);

                            SidepanelIndicator.toggle(false);
                            sizeElement.innerHTML = '0 B';
                        }
                        statusElement.innerHTML = savedStatusHtml;
                        saveTimeout = undefined;
                    }, 300);
                }, 150);
            };
            editor.on('update', onUpdate);
        }
    }).observe(document, { childList: true, subtree: true });
}

export async function setupSidepanelMenubar(): Promise<void> {
    let editor = globals.editor!;

    // Track editor state.
    function updateEditorButtons(editor: Editor) {
        if (!editor) return;

        const rules: Record<string, MenuButtonRule> = {
            undo: { can: editor.can().chain().undo().run() },
            redo: { can: editor.can().chain().redo().run() },
            h1: {
                isActive: editor.isActive('heading', { level: 1 }),
                can: true,
            },
            h2: {
                isActive: editor.isActive('heading', { level: 2 }),
                can: true,
            },
            h3: {
                isActive: editor.isActive('heading', { level: 3 }),
                can: true,
            },
            bulletlist: {
                isActive: editor.isActive('bulletList'),
                can: editor.can().chain().toggleBulletList().run(),
            },
            numberedlist: {
                isActive: editor.isActive('orderedList'),
                can: editor.can().chain().toggleOrderedList().run(),
            },
            blockquote: {
                isActive: editor.isActive('blockquote'),
                can: editor.can().chain().toggleBlockquote().run(),
            },
            codeblock: {
                isActive: editor.isActive('codeBlock'),
                can: editor.can().chain().toggleCodeBlock().run(),
            },
            bold: {
                isActive: editor.isActive('bold'),
                can: editor.can().chain().toggleBold().run(),
            },
            italic: {
                isActive: editor.isActive('italic'),
                can: editor.can().chain().toggleItalic().run(),
            },
            strikethrough: {
                isActive: editor.isActive('strike'),
                can: editor.can().chain().toggleStrike().run(),
            },
            'menu-code': {
                isActive: editor.isActive('code'),
                can: editor.can().chain().toggleCode().run(),
            },
            underline: {
                isActive: editor.isActive('underline'),
                can: editor.can().chain().toggleUnderline().run(),
            },
            highlight: {
                isActive: editor.isActive('highlight'),
                can: editor.can().chain().toggleHighlight().run(),
            },
            'menu-link': {
                isActive: editor.isActive('link'),
                can: editor.can().chain().toggleLink().run(),
            },
            superscript: {
                isActive: editor.isActive('superscript'),
                can: editor.can().chain().toggleSuperscript().run(),
            },
            subscript: {
                isActive: editor.isActive('subscript'),
                can: editor.can().chain().toggleSubscript().run(),
            },
            tasklist: {
                isActive: editor.isActive('taskList'),
                can: editor.can().chain().toggleTaskList().run(),
            },
        };

        Object.entries(rules).forEach(([id, rule]) => {
            const btn = document.getElementById(id) as HTMLButtonElement | null;
            if (!btn) return;

            // Persistent visual state for formatting
            if (rule.isActive !== undefined) {
                btn.classList.toggle('toggled', !!rule.isActive);
            }

            // Disabled state
            if (rule.can !== undefined) {
                btn.disabled = !rule.can;
            }
        });
    }
    editor.on('transaction', () => updateEditorButtons(editor));

    // Attach scrollfade.
    var menuBarContainer = document.getElementById('menu-bar-container')!;
    attachScrollFade(menuBarContainer, {
        direction: 'horizontal',
        fadeSize: 24,
    });

    menuBarContainer.addEventListener(
        'wheel',
        (event) => {
            if (event.shiftKey) return; // preserve native behavior
            const isMostlyVertical =
                Math.abs(event.deltaY) > Math.abs(event.deltaX);
            if (!isMostlyVertical) return;
            event.preventDefault();

            let delta = event.deltaY;
            if (event.deltaMode === 1) {
                delta *= 16;
            }

            // clamp to avoid insane mouse spikes
            const max = 80;
            delta = Math.max(-max, Math.min(max, delta));
            menuBarContainer.scrollLeft += delta;
        },
        { passive: false },
    );

    // Helper to check if editor exists
    function safeCommand(fn: () => void) {
        if (!editor) return;
        fn();
    }

    // Implement menu bar buttons.
    // Undo / Redo
    document.getElementById('menu-undo')?.addEventListener('click', () => {
        editor.chain().focus().undo().run();
    });
    document.getElementById('menu-redo')?.addEventListener('click', () => {
        editor.chain().focus().redo().run();
    });

    // Headings
    document.getElementById('h1')?.addEventListener('click', () => {
        editor.chain().focus().toggleHeading({ level: 1 }).run();
    });
    document.getElementById('h2')?.addEventListener('click', () => {
        editor.chain().focus().toggleHeading({ level: 2 }).run();
    });
    document.getElementById('h3')?.addEventListener('click', () => {
        editor.chain().focus().toggleHeading({ level: 3 }).run();
    });

    // Bold / Italic / Underline / Strikethrough
    document.getElementById('bold')?.addEventListener('click', () => {
        editor.chain().focus().toggleBold().run();
    });
    document.getElementById('italic')?.addEventListener('click', () => {
        editor.chain().focus().toggleItalic().run();
    });
    document.getElementById('underline')?.addEventListener('click', () => {
        editor.chain().focus().toggleUnderline().run();
    });
    document.getElementById('strikethrough')?.addEventListener('click', () => {
        editor.chain().focus().toggleStrike().run();
    });

    // Superscript / subscript.
    document.getElementById('superscript')?.addEventListener('click', () => {
        editor.chain().focus().toggleSuperscript().run();
    });
    document.getElementById('subscript')?.addEventListener('click', () => {
        editor.chain().focus().toggleSubscript().run();
    });

    // Lists
    document.getElementById('bulletlist')?.addEventListener('click', () => {
        editor.chain().focus().toggleBulletList().run();
    });
    document.getElementById('numberedlist')?.addEventListener('click', () => {
        editor.chain().focus().toggleOrderedList().run();
    });
    document.getElementById('tasklist')?.addEventListener('click', () => {
        editor.chain().focus().toggleTaskList().run();
    });

    // Code / Code Block
    document.getElementById('menu-code')?.addEventListener('click', () => {
        editor.chain().focus().toggleCode().run();
    });
    document.getElementById('codeblock')?.addEventListener('click', () => {
        editor.chain().focus().toggleCodeBlock().run();
    });

    // Blockquote
    document.getElementById('blockquote')?.addEventListener('click', () => {
        editor.chain().focus().toggleBlockquote().run();
    });

    // Highlight
    document.getElementById('highlight')?.addEventListener('click', () => {
        editor.chain().focus().toggleHighlight().run();
    });

    // Link
    document.getElementById('menu-link')?.addEventListener('click', () => {
        const previousHref = editor.getAttributes('link').href;
        let url = prompt('Enter URL:', previousHref ?? '');
        if (!url) return;

        url = url.trim();
        if (!url) return;

        editor.chain().focus().run();

        const selection = editor.state.selection;
        const hasSelection = selection && selection.from !== selection.to;

        if (hasSelection) {
            // If there is selected text, just set the link
            editor.chain().setLink({ href: url }).run();
        } else {
            // No selection → insert the URL then make it a link
            const { state } = editor;
            const { from } = state.selection;

            editor
                .chain()
                .insertContent(url)
                .setTextSelection({ from, to: from + url.length })
                .setLink({ href: url })
                .setTextSelection(from + url.length)
                .run();

            // Move cursor to end of inserted link (so typing continues after it)
            const posAfterLink = editor.state.selection.to;
            editor.chain().focus(posAfterLink).run();
        }
    });

    // Clear formatting
    document
        .getElementById('menu-clear-formatting')
        ?.addEventListener('click', () => {
            editor.chain().focus().unsetAllMarks().clearNodes().run();
        });
}

export async function setupSidepanelActions(): Promise<void> {
    let editor = globals.editor!;
    const statusElement = document.getElementById('status')!;

    // Setup collapsible toggle & actions display.
    const collapsibleToggle = document.getElementById(
        SELECTORS.EXT.IDs.COLLAPSIBLE_TOGGLE,
    )!;
    const collapsible = document.getElementById(SELECTORS.EXT.IDs.COLLAPSIBLE)!;
    const collapsibleContent = document.getElementById('collapsible-content')!;
    let collapsibeObserver: ResizeObserver | null;

    const expandActions = () => {
        collapsible.style.height = 'auto';
        const height = collapsible.scrollHeight;

        // Animate from 0 → measured height
        collapsible.style.height = '0px';
        requestAnimationFrame(() => {
            collapsible.style.height = height + 'px';
        });

        globals.actionsExpanded = true;
        collapsibleToggle.innerHTML = collapseActionsHtml;

        // Adjust size if content wraps.
        collapsibeObserver = new ResizeObserver(() => {
            let currHeight = collapsibleContent.getBoundingClientRect().height;
            if (collapsibleContent.style.height != '0px') {
                requestAnimationFrame(() => {
                    collapsible.style.height = currHeight + 'px';
                });
            }
        });
        collapsibeObserver.observe(collapsibleContent);
    };
    const collapseActions = () => {
        const height = collapsible.scrollHeight;
        collapsible.style.height = height + 'px';

        requestAnimationFrame(() => {
            collapsible.style.height = '0px';
        });

        globals.actionsExpanded = false;
        collapsibleToggle.innerHTML = expandActionsHtml;

        if (collapsibeObserver != null) {
            collapsibeObserver.unobserve(collapsibleContent);
            collapsibeObserver = null;
        }
    };

    globals.actionsExpanded ? expandActions() : collapseActions(); // Init.
    collapsibleToggle.addEventListener('click', () => {
        globals.actionsExpanded ? collapseActions() : expandActions();
    });

    // Store callbacks for actions.
    globals.callbacks.expandActions = expandActions;
    globals.callbacks.collapseActions = collapseActions;

    // Setup click handler for action btns.
    document
        .getElementById('copy-action')
        ?.addEventListener('click', async () => {
            const md = editor.getMarkdown();
            await navigator.clipboard.writeText(md);
            statusElement.innerHTML = copiedStatusHtml;
        });
    document
        .getElementById('timestamp-action')
        ?.addEventListener('click', async () => {
            const timestamp = getVideoTime();
            const timecode = formatTimecode(timestamp);
            editor
                .chain()
                .insertContentAt(editor.state.selection.anchor, {
                    type: 'timestamp',
                    attrs: { timestamp },
                    content: [{ type: 'text', text: timecode }],
                })
                .focus()
                .run();
        });
    document
        .getElementById('upload-action')
        ?.addEventListener('click', async () => {
            const dataUrl = await uploadFile(imageTypes);
            editor
                .chain()
                .insertContent([
                    {
                        type: 'image',
                        attrs: {
                            src: dataUrl,
                        },
                    },
                    {
                        type: 'paragraph',
                    },
                ])
                .focus(editor.state.selection.to + 1)
                .run();
        });
    document
        .getElementById('delete-action')
        ?.addEventListener('click', async () => {
            editor.chain().clearContent().focus().run();
        });
    document
        .getElementById('screenshot-action')
        ?.addEventListener('click', async () => {
            editor
                .chain()
                .insertContent([
                    {
                        type: 'image',
                        attrs: {
                            src: getVideoScreenshot(),
                        },
                    },
                    {
                        type: 'paragraph',
                    },
                ])
                .focus(editor.state.selection.to + 1)
                .run();
        });
    document
        .getElementById('date-action')
        ?.addEventListener('click', async () => {
            const now = new Date();
            const localDate = now.toLocaleDateString();
            editor
                .chain()
                .insertContent({
                    type: 'paragraph',
                    content: [{ type: 'text', text: localDate }],
                })
                .focus()
                .run();
        });
}

export async function setupSidepanelHotkeys(): Promise<void> {
    let editor = globals.editor!;

    // Capture stage keydown events - to skip privilleged shortcuts.
    document.addEventListener(
        'keydown',
        (event) => {
            switch (event.ctrlKey || event.metaKey) {
                case true: {
                    switch (event.key) {
                        case 'Enter': {
                            if (globals.open) {
                                if (!editor.isFocused) {
                                    editor.commands.focus();
                                } else {
                                    editor.commands.blur();
                                }
                                event.stopImmediatePropagation();
                            }
                        }
                    }
                }
            }
        },
        {
            capture: true,
        },
    );

    // Listen for keydown events.
    document.addEventListener('keydown', async (event) => {
        switch (event.key) {
            case 'Q':
            case 'q': {
                if (globals.open) {
                    editor.commands.blur();
                    await globals.callbacks.close!();
                    break;
                } else {
                    await globals.callbacks.open!();
                    // setTimeout(() => {
                    //     editor.commands.focus();
                    // }, 250);
                }
                break;
            }
            case 'A':
            case 'a': {
                if (globals.open) {
                    if (globals.actionsExpanded) {
                        globals.callbacks.collapseActions!();
                    } else {
                        globals.callbacks.expandActions!();
                    }
                }
                break;
            }
        }
    });
}

export async function watchSidepanelChanges(): Promise<void> {
    let sidepanelCtn = document.getElementById('sidepanel-ctn')!;
    const content = document.querySelector('.content')!;
    const focusIndicator = document.getElementById('focus-indicator');
    const focusText = document.getElementById('focus-text')!;
    const focusHotkey = document.getElementById('focus-key')!;

    // Setup logo click event.
    // const extLogo = document.getElementById('ext-logo')!;
    // extLogo.addEventListener('click', () => {
    //     chrome.runtime.sendMessage({
    //         action: 'openPopup',
    //     });
    // });

    // React to sidepanel container changes.
    let contentBuffer = document.getElementById('content-buffer')!;
    new ResizeObserver(() => {
        const rect = sidepanelCtn.getBoundingClientRect();

        // Apply new buffer.
        const newBuffer = rect.height * 0.5;
        contentBuffer.style.height = newBuffer + 'px';
        globals.editor!.view.setProps({
            scrollMargin: {
                top: 0,
                right: 0,
                bottom: newBuffer,
                left: 0,
            },
        });

        // Calc visiblity of focus indicator.
        if (rect.width < 300) {
            focusText.classList.add('d-none');
        } else {
            focusText.classList.remove('d-none');
        }
    }).observe(sidepanelCtn);

    // React to sidepanel container focus.
    focusHotkey.textContent = formatShortcutForOS(['Ctrl', 'Enter']);
    const menuBarItems = [
        ...Array.from(document.getElementsByClassName('menu-icon')),
        ...Array.from(document.getElementsByClassName('menu-icon-size')),
        ...Array.from(document.getElementsByClassName('separator')),
    ];
    const enable = () => {
        menuBarItems.forEach((e) => e.classList.remove('inactive'));
    };
    const disable = () => {
        menuBarItems.forEach((e) => e.classList.add('inactive'));
    };
    content.addEventListener('focusin', () => {
        // enable();
        focusText.textContent = 'Unfocus';
        focusIndicator?.classList.replace('options-text', 'active-text');
    });
    content.addEventListener('focusout', (event) => {
        // disable();
        focusText.textContent = 'Focus';
        focusIndicator?.classList.replace('active-text', 'options-text');
    });
    // disable();
    focusText.textContent = 'Focus';
}

export async function listenToPopup() {
    chrome.runtime.onMessage.addListener(
        async (message: ExtensionMessage, sender, sendResponse) => {
            if (message.source != 'content_script') {
                switch (message.type) {
                    case ExtensionMessageType.DELETE_ROW: {
                        const typed: ExtensionMessageDeleteRow =
                            message as ExtensionMessageDeleteRow;
                        if (location.href === typed.url) {
                            const editor = globals.editor!;
                            editor.commands.clearContent();
                        }
                        break;
                    }
                }
            }
            return true;
        },
    );
}
