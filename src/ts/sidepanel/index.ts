import '../tooltip';
import { SELECTORS } from './selectors';
import {
    attachSidepanel,
    listenToPopup,
    loadImages,
    setupSidepanelActions,
    setupSidepanelEditor,
    setupSidepanelHotkeys,
    setupSidepanelLoadAndSave,
    setupSidepanelMenubar,
    setupSidepanelOpenClose,
    setupSidepanelResize,
    watchSidepanelChanges,
} from './sidepanel';

// Run code in asynchronous context.
(async () => {
    let attached = false;
    // Watch webpage.
    new MutationObserver(async (mutations, observe) => {
        // Skip if attached or extension already injected.
        if (attached || document.querySelector('.ext-container')) return;

        // Skip if video element or movie player element not loaded yet.
        const video = document.querySelector(SELECTORS.YT.SELECTORS.VIDEO);
        const moviePlayer = document.getElementById(
            SELECTORS.YT.IDS.MOVIE_PLAYER,
        );
        if (!video || !moviePlayer) {
            return;
        }

        // Skip if moviePlayer is currently being moved or is in player API.
        // If the extension ever breaks, look here!
        if (
            moviePlayer?.parentNode == null ||
            (moviePlayer.parentNode as HTMLElement).id == 'player-api'
        ) {
            return;
        }

        // Mark extension as injected & stop listening.
        attached = true;
        observe.disconnect();

        // Inject.
        attachSidepanel();
        loadImages();
        await setupSidepanelOpenClose();
        await setupSidepanelResize();
        await setupSidepanelEditor();
        await setupSidepanelLoadAndSave();
        await setupSidepanelMenubar();
        await setupSidepanelActions();
        await setupSidepanelHotkeys();
        await watchSidepanelChanges();
        await listenToPopup();
    }).observe(document.body, {
        childList: true,
        subtree: true,
    });
})();
