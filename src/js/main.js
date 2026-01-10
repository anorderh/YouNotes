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

    // Wait until video loads to add sidepanel.
    const videoObserver = new MutationObserver(async (mutations, observe) => {
        // FIX: Prevent re-entry, incase concurrent callbacks are scheduled.
        if (document.querySelector('.ext-container')) {
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

                // Add open/close event.
                const sidepanel = document.getElementById('sidepanel');
                const sidepanelBtn = document.getElementById('sidepanel-btn');
                sidepanelBtn.addEventListener('click', (e) => {
                    console.log('clickity');
                    if (sidepanelBtn.textContent == 'Open') {
                        console.log('CLOSED');
                        sidepanel.style.width = '0px';
                        sidepanelBtn.textContent = 'Closed';
                    } else {
                        console.log('OPEN');
                        sidepanel.style.width = '300px';
                        sidepanelBtn.textContent = 'Open';
                    }
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
