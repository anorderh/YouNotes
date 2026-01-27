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
