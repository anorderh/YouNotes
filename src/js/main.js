import { getElementByClass } from './util';

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

                // Add html5video container and sidepanel
                extContainer.appendChild(html5Video);
                const sidepanel = document.createElement('div');
                sidepanel.className = CON.EXT.CLASSES.SIDEPANEL;
                extContainer.appendChild(sidepanel);

                observe.disconnect();
            }
        }

        // const video = getElementByClass('html5-video-container');
        // if (video) {
        //     // Create & insert container.
        //     const container = document.createElement('div');
        //     container.className = 'video-container';
        //     video.parentNode.insertBefore(container, video);

        //     // Modify video CSS.
        //     video.classList.add('grabbed-video');

        //     // Put video inside container.
        //     container.appendChild(video);

        //     // Add sidepanel.
        //     const sidepanelElement = await loadHtmlIntoElement(sidepanelHtml);
        //     container.appendChild(sidepanelElement);

        //     const moviePlayer = document.getElementById(YT.IDS.MOVIE_PLAYER);
        //     // Once container exists, ensure its height matches the movie_player obj.
        //     matchSize(container, moviePlayer);
        //     window.addEventListener('resize', (event) => {
        //         matchSize(container, moviePlayer);
        //     });

        //     // Prevent pauses & fullscreen from propagating in sidepanel.
        //     const sidepanelBtn = document.getElementById('sidepanel-btn');
        //     sidepanelBtn.addEventListener(
        //         'click',
        //         (e) => {
        //             console.log('clickity');
        //             if (sidepanelBtn.textContent == 'Open') {
        //                 console.log('CLOSED');
        //                 sidepanel.style.width = '0px';
        //                 sidepanelBtn.textContent = 'Closed';
        //             } else {
        //                 console.log('OPEN');
        //                 sidepanel.style.width = '300px';
        //                 sidepanelBtn.textContent = 'Open';
        //             }
        //             e.preventDefault();
        //             e.stopPropagation();
        //         }
        //         // true
        //     );
        //     sidepanelBtn.addEventListener(
        //         'dblclick',
        //         (e) => {
        //             e.preventDefault();
        //             e.stopPropagation();
        //         },
        //         true
        //     );
        //     const sidepanel = document.getElementById('sidepanel');
        //     sidepanel.addEventListener(
        //         'click',
        //         (e) => {
        //             // Prob need to renable this.
        //             e.stopPropagation();
        //             e.preventDefault();
        //         },
        //         true
        //     );
        //     sidepanel.addEventListener(
        //         'dblclick',
        //         (e) => {
        //             e.preventDefault();
        //             e.stopPropagation();
        //         },
        //         true
        //     );

        //     observe.disconnect();
        // }
    });
    videoObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });
})();
