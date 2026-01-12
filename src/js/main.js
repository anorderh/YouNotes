import sidepanelHtml from '../html/sidepanel.html';
import {
    duringTransition,
    getElementByClass,
    loadHtmlIntoElement,
} from './util';

export const CON = {
    EXT: {
        CLASSES: {
            EXT_CONTAINER: 'ext-container',
            APPLIED_HTML5_VIDEO_CONTAINER: 'applied-html5-video-container',
            APPLIED_VIDEO: 'applied-video',
            APPLIED_MOVIE_PLAYER: 'applied-movie-player',
            SIDEPANEL: 'sidepanel',
            APPLIED_CHROME_BOTTOM: 'applied-ytp-chrome-bottom',
        },
        IDs: {
            SIDEPANEL_ICON: 'sidepanel-icon',
        },
    },
    YT: {
        CLASSES: {
            HTML5_VIDEO_CONTAINER: 'html5-video-container',
            YTP_CHROME_TOP_BUTTONS: 'ytp-chrome-top-buttons',
            YTP_CHROME_BOTTOM: 'ytp-chrome-bottom',
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
                const moviePlayer = document.getElementById(
                    CON.YT.IDS.MOVIE_PLAYER
                );
                const html5Video = getElementByClass(
                    CON.YT.CLASSES.HTML5_VIDEO_CONTAINER
                );

                // Create container.
                const extContainer = document.createElement('div');
                extContainer.className = CON.EXT.CLASSES.EXT_CONTAINER;
                moviePlayer.parentNode.insertBefore(extContainer, moviePlayer);

                // Modify CSS of YT elements.
                moviePlayer.classList.add(CON.EXT.CLASSES.APPLIED_MOVIE_PLAYER);
                html5Video.classList.add(
                    CON.EXT.CLASSES.APPLIED_HTML5_VIDEO_CONTAINER
                );
                video.classList.add(CON.EXT.CLASSES.APPLIED_VIDEO);
                getElementByClass(
                    CON.YT.CLASSES.YTP_CHROME_TOP_BUTTONS
                ).style.pointerEvents = 'none';

                // Add moviePlayer container and sidepanel
                extContainer.appendChild(moviePlayer);
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
                let upperLimit, lowerLimit;
                const close = () => {
                    isOpen = false;
                    lastWidth = sidepanel.getBoundingClientRect().width;
                    sidepanel.style.width = '0px';
                    handle.style.pointerEvents = 'none';
                    extContainer.addEventListener('mouseenter', appear);
                    extContainer.addEventListener('mouseleave', hide);
                    duringTransition(250, () =>
                        window.dispatchEvent(new Event('resize'))
                    );
                };
                const open = () => {
                    extContainer.removeEventListener('mouseenter', appear);
                    extContainer.removeEventListener('mouseleave', hide);
                    isOpen = true;
                    const videoWidth = html5Video.getBoundingClientRect().width;
                    upperLimit = videoWidth * 0.75;
                    const target = videoWidth * 0.4;
                    lowerLimit = videoWidth * 0.25;
                    if (
                        lastWidth == null ||
                        lastWidth < lowerLimit ||
                        lastWidth > upperLimit
                    ) {
                        sidepanel.style.width = `${target}px`;
                    } else {
                        sidepanel.style.width = `${lastWidth}px`;
                    }
                    handle.style.pointerEvents = 'auto';
                    duringTransition(250, () =>
                        window.dispatchEvent(new Event('resize'))
                    );
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

                    // Enforce limits on resizing.
                    const calculated = startWidth + delta;
                    if (calculated > upperLimit || calculated < lowerLimit)
                        return;
                    sidepanel.style.width = `${calculated}px`;
                    window.dispatchEvent(new Event('resize'));
                });
                document.addEventListener('mouseup', () => {
                    isResizing = false;
                    document.body.style.removeProperty('cursor');
                    sidepanel.classList.remove('resizing');
                });

                // Fix Youtube hotkeys interfering with text
                // I would assume add an event listener when on the text that ignores?

                observe.disconnect();
            }
        }
    });
    videoObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });
})();
