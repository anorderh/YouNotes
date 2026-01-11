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
                const handle = document.querySelector('.resize-handle');
                let isOpen = true;
                let isResizing = false;

                // Setup open/close event.
                sidepanelBtn.addEventListener('click', (e) => {
                    if (sidepanelBtn.textContent == 'Open') {
                        isOpen = false;
                        sidepanel.style.width = '0px';
                        sidepanelBtn.textContent = 'Closed';
                        handle.style.pointerEvents = 'none';
                    } else {
                        isOpen = true;
                        sidepanel.style.width = '300px';
                        sidepanelBtn.textContent = 'Open';
                        handle.style.pointerEvents = 'auto';
                    }
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

                observe.disconnect();
            }
        }
    });
    videoObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });
})();
