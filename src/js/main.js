import sidepanelHtml from '../html/sidepanel.html';
import { getElementByClass, loadHtmlIntoElement } from './util';

export const CON = {
    EXT: {
        CLASSES: {
            EXT_CONTAINER: 'ext-container',
            APPLIED_HTML5_VIDEO_CONTAINER: 'applied-html5-video-container',
            APPLIED_VIDEO: 'applied-video',
            SIDEPANEL: 'sidepanel',
        },
        IDs: {
            SIDEPANEL_ICON: 'sidepanel-icon',
        },
    },
    YT: {
        CLASSES: {
            HTML5_VIDEO_CONTAINER: 'html5-video-container',
            YTP_CHROME_TOP_BUTTONS: 'ytp-chrome-top-buttons',
        },
        IDS: {
            MOVIE_PLAYER: 'movie_player',
        },
        SELECTORS: {
            VIDEO: 'video',
        },
    },
};

(async () => {
    // Wait until video loads to add sidepanel.
    const videoObserver = new MutationObserver(async (mutations, observe) => {
        if (document.querySelector('.ext-container')) {
            // FIX: Prevent re-entry, incase concurrent callbacks are scheduled.
            observe.disconnect();
            return;
        } else {
            const extContainer = document.querySelector('.ext-container');
            const video = document.querySelector(CON.YT.SELECTORS.VIDEO);
            if (video) {
                const html5Video = getElementByClass(
                    CON.YT.CLASSES.HTML5_VIDEO_CONTAINER
                );

                // Create container.
                const extContainer = document.createElement('div');
                extContainer.className = CON.EXT.CLASSES.EXT_CONTAINER;
                html5Video.parentNode.insertBefore(extContainer, html5Video);

                // Modify CSS of YT elements.
                html5Video.classList.add(
                    CON.EXT.CLASSES.APPLIED_HTML5_VIDEO_CONTAINER
                );
                video.classList.add(CON.EXT.CLASSES.APPLIED_VIDEO);
                getElementByClass(
                    CON.YT.CLASSES.YTP_CHROME_TOP_BUTTONS
                ).style.pointerEvents = 'none';

                // Add html5video container and sidepanel
                extContainer.appendChild(html5Video);
                const sidepanelHtmlElement = await loadHtmlIntoElement(
                    sidepanelHtml
                );
                extContainer.appendChild(sidepanelHtmlElement);

                // Sidepanel functionality....
                const sidepanel = document.getElementById('sidepanel');
                const sidepanelBtn = document.getElementById('sidepanel-btn');
                const sidepanelIcon = document.getElementById('sidepanel-icon');
                const handle = document.querySelector('.resize-handle');
                let isOpen = false;
                let isResizing = false;

                // Setup button hover.
                const appear = () => {
                    if (!isOpen) {
                        sidepanelBtn.style.left = '-40px';
                    }
                };
                const hide = () => {
                    if (!isOpen) {
                        sidepanelBtn.style.left = '0px';
                    }
                };

                // Setup open.close of sidepanel.
                let lastWidth;
                const close = () => {
                    isOpen = false;
                    lastWidth = sidepanel.getBoundingClientRect().width;
                    sidepanel.style.width = '0px';
                    handle.style.pointerEvents = 'none';
                    extContainer.addEventListener('mouseenter', appear);
                    extContainer.addEventListener('mouseleave', hide);
                };
                const open = () => {
                    extContainer.removeEventListener('mouseenter', appear);
                    extContainer.removeEventListener('mouseleave', hide);
                    isOpen = true;
                    const videoWidth = html5Video.getBoundingClientRect().width;
                    const inferredWidth = videoWidth * 0.4;
                    if (lastWidth == null || lastWidth < inferredWidth) {
                        sidepanel.style.width = `${inferredWidth}px`;
                    } else {
                        sidepanel.style.width = `${lastWidth}px`;
                    }
                    handle.style.pointerEvents = 'auto';
                };

                isOpen ? open() : close(); // Init.
                sidepanelBtn.addEventListener('click', (e) => {
                    isOpen ? close() : open(); // React.
                });

                // Setup resize handle.
                let startX, startWidth;
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
                    sidepanel.style.width = `${startWidth + delta}px`;
                });
                document.addEventListener('mouseup', () => {
                    isResizing = false;
                    document.body.style.removeProperty('cursor');
                    sidepanel.classList.remove('resizing');
                });

                // Avoid invoking YT hover for extension.
                // Need to be careful about this, bc this is ruining other event listner impl
                // sidepanel.addEventListener(
                //     'mousemove',
                //     (e) => {
                //         sidepanel.style.cursor = 'auto';
                //         // e.stopPropagation();
                //     },
                //     true
                // );
                // sidepanel.addEventListener(
                //     'wheel',
                //     (e) => {
                //         console.log('caught');
                //         // e.stopPropagation();
                //     },
                //     true
                // );

                observe.disconnect();
            }
        }
    });
    videoObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });
})();
