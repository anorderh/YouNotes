import sidepanelHtml from '../html/sidepanel.html';
import { loadHtmlIntoElement, matchSize } from './util';

export const YT = {
    CLASSES: {},
    IDS: {
        MOVIE_PLAYER: 'movie_player',
    },
};

(async () => {
    // Wait until video loads to add sidepanel.
    const videoObserver = new MutationObserver(async (mutations, observe) => {
        // FIX: Prevent re-entry, incase concurrent callbacks are scheduled.
        if (document.querySelector('.video-container')) {
            observe.disconnect();
            return;
        }

        const video = document.querySelector('video');
        if (video) {
            // Create & insert container.
            const container = document.createElement('div');
            container.className = 'video-container';
            video.parentNode.insertBefore(container, video);

            // Modify video CSS.
            video.classList.add('grabbed-video');

            // Put video inside container.
            container.appendChild(video);

            // Add sidepanel.
            const sidepanelElement = await loadHtmlIntoElement(sidepanelHtml);
            container.appendChild(sidepanelElement);

            const moviePlayer = document.getElementById(YT.IDS.MOVIE_PLAYER);
            // Once container exists, ensure its height matches the movie_player obj.
            matchSize(container, moviePlayer);
            window.addEventListener('resize', (event) => {
                matchSize(container, moviePlayer);
            });

            // Prevent pauses & fullscreen from propagating in sidepanel.
            const sidepanelContainer = document.getElementById('sidepanel-ctn');
            sidepanelContainer.addEventListener(
                'click',
                (e) => {
                    console.log('FUCK YOU -FROM CONTAINER');
                    // Prob need to renable this.
                    // e.stopPropagation();
                    // e.preventDefault();
                },
                true
            );
            sidepanelContainer.addEventListener(
                'dblclick',
                (e) => {
                    console.log('FUCK YOU X2 -FROM CONTAINER');
                    e.preventDefault();
                    e.stopPropagation();
                },
                true
            );

            // Setup open & close functionaity.
            const sidepanel = document.getElementById('sidepanel');
            const sidepanelBtn = document.getElementById('sidepanel-btn');
            sidepanelBtn.addEventListener(
                'click',
                (e) => {
                    console.log('BITCH I RAN -FROM BTN');
                    if (sidepanelBtn.textContent == 'Open') {
                        console.log('CLOSED');
                        sidepanel.style.width = '0px';
                        sidepanelBtn.textContent = 'Closed';
                    } else {
                        console.log('OPEN');
                        sidepanel.style.width = '300px';
                        sidepanelBtn.textContent = 'Open';
                    }
                },
                true
            );

            observe.disconnect();
        }
    });
    videoObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });
})();
