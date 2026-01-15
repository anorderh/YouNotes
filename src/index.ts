import { SELECTORS } from './ts/selectors';
import {
    attachSidepanel,
    setupSidepanelEditor,
    setupSidepanelOpenClose,
    setupSidepanelResize,
} from './ts/sidepanel';

// Run code in asynchronous context.
(async () => {
    let attached = false;
    // Watch webpage.
    new MutationObserver(async (mutations, observe) => {
        // Skip if attached or extension already injected.
        if (attached || document.querySelector('.ext-container')) return;

        // Skip if video element not loaded yet.
        if (!document.querySelector(SELECTORS.YT.SELECTORS.VIDEO)) return;

        // Mark extension as injected & stop listening.
        attached = true;
        observe.disconnect();

        // Inject.
        await attachSidepanel();
        await setupSidepanelOpenClose();
        await setupSidepanelResize();
        await setupSidepanelEditor();
    }).observe(document.body, {
        childList: true,
        subtree: true,
    });
})();
