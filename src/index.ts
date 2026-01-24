import { SELECTORS } from './ts/selectors';
import {
    attachSidepanel,
    loadImages,
    setupSidepanelActions,
    setupSidepanelEditor,
    setupSidepanelHotkeys,
    setupSidepanelMenubar,
    setupSidepanelOpenClose,
    setupSidepanelResize,
    watchSidepanelChanges,
} from './ts/sidepanel';
import './ts/tooltip';

// Run code in asynchronous context.
(async () => {
    let attached = false;
    // Watch webpage.
    new MutationObserver(async (mutations, observe) => {
        // Skip if attached or extension already injected.
        if (attached || document.querySelector('.ext-container')) return;

        // Skip if video element or movie player element not loaded yet.
        if (
            !document.querySelector(SELECTORS.YT.SELECTORS.VIDEO) ||
            !document.getElementById(SELECTORS.YT.IDS.MOVIE_PLAYER)
        )
            return;

        // Mark extension as injected & stop listening.
        attached = true;
        observe.disconnect();

        // Inject.
        await attachSidepanel();
        await loadImages();
        await setupSidepanelOpenClose();
        await setupSidepanelResize();
        await setupSidepanelEditor();
        await setupSidepanelMenubar();
        await setupSidepanelActions();
        await setupSidepanelHotkeys();
        await watchSidepanelChanges();
    }).observe(document.body, {
        childList: true,
        subtree: true,
    });
})();
