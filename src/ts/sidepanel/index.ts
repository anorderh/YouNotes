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
    const ytNavigateStartEvent = 'yt-navigate-start';
    const ytNavigateFinishEvent = 'yt-navigate-finish';

    let attached: boolean = false;
    let navigating: boolean = false;

    window.addEventListener(ytNavigateStartEvent, () => {
        navigating = true;
    });
    window.addEventListener(ytNavigateFinishEvent, () => {
        navigating = false;
    });

    new MutationObserver(async (mutations, observe) => {
        const video: HTMLVideoElement = document.querySelector(
            SELECTORS.YT.SELECTORS.VIDEO,
        )!;
        const moviePlayer = document.getElementById(
            SELECTORS.YT.IDS.MOVIE_PLAYER,
        )!;
        const watchPage = document.querySelector(
            SELECTORS.YT.SELECTORS.YTD_WATCH_PAGE,
        )!;
        const watchMetadata: HTMLElement = document.querySelector(
            SELECTORS.YT.SELECTORS.YTD_WATCH_METADATA,
        )!;
        const videoRenderer = document.querySelector(
            'ytd-video-primary-info-renderer',
        )!;

        // Skip if...
        if (
            // Youtube is still navigating
            navigating ||
            // Youtube HTML elements are not present.
            !video ||
            !moviePlayer ||
            !watchMetadata ||
            !videoRenderer ||
            // Watch page is present.
            watchPage?.role != 'main' ||
            // // Video is not ready.
            // video.readyState <= 3 ||
            // Movie HTML elements are on the page, & not held by youtube-api.
            moviePlayer?.parentNode == null ||
            (moviePlayer.parentNode as HTMLElement).id != 'container'
        ) {
            return;
        }

        // Mark as attached.
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
    }).observe(document, {
        childList: true,
        subtree: true,
    });
})();
