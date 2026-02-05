import { globals } from '../global';
import {
    ExtensionMessageDeleteRow,
    ExtensionMessageType,
    GridSessionStateKeys,
    GridSessionStateType,
    GridSortOptions,
    GridStateType,
    VideoMetadata,
} from '../types/interfaces';
import { loadHtmlIntoElement, parseContentSize } from '../util';
import { changePage, changeSearchStr, changeSort, deleteRow } from './data';
import {
    getDate,
    navigateToUrl,
    showConfirmationModal,
    showModal,
} from './utils';

export const popupState: GridStateType = {
    // Session storage values.
    sort: GridSortOptions.MOST_RECENT,
    page: 1,
    searchStr: null,
    // Non-saved values.
    pageSize: 5, // Hard-coded.
    totalRows: [],
    filteredRows: [],
    rows: [],
};

// Helpers for session storage.
export async function loadPopupSessionState(): Promise<void> {
    const sessionState: GridSessionStateType = await chrome.storage.session.get(
        [
            GridSessionStateKeys.sort,
            GridSessionStateKeys.page,
            GridSessionStateKeys.searchStr,
        ],
    );
    popupState.sort = sessionState.sort ?? popupState.sort;
    popupState.page = sessionState.page ?? popupState.page;
    popupState.searchStr = sessionState.searchStr ?? popupState.searchStr;

    await changeSort(popupState.sort);
    await changePage(popupState.page);
    await changeSearchStr(popupState.searchStr ?? '');
    await calculateRows();
    await render();
}

export async function getAllVideosMetadata(): Promise<VideoMetadata[]> {
    let allKeys = await chrome.storage.local.getKeys();
    let metadataKeys = allKeys.filter((key) => key.startsWith('metadata_'));
    let metadataResult: { [key: string]: VideoMetadata } =
        await chrome.storage.local.get(metadataKeys);
    let metadata = Object.values(metadataResult);
    console.log(metadata);
    return metadata;
}

export function getRowHtml(metadata: VideoMetadata) {
    return `
        <div class="search-grid-row rounded shadow-sm p-3 clickable">
            <div class="d-flex flex-column">
                <div class="d-flex flex-row justify-content-between">
                    <span style="line-height: 22px" class="fs-6 mb-2 fw-semibold">${metadata.title}</span>
                    <div title="Actions" style="height: min-content;" class="d-flex flex-row gap-3 ms-4">
                        <btn data-tooltip="Delete" class="icon-btn">
                            <i class="fa-solid fa-trash fa-xl" id="delete"></i>
                        </btn>
                    </div>
                </div>
                <div class="d-flex flex-row justify-content-between mt-4 mx-2">
                    <div class="d-flex flex-column gap-2 mx-2">
                        <span data-tooltip="Channel Name" class="normal-text fst-italic">
                            <i class="fa-solid fa-user fa-md me-2"></i>
                            ${metadata.channelName}
                        </span>
                        <span data-tooltip="Duration" class="normal-text">
                            <i class="fa-solid fa-clock fa-md me-2"></i>
                            ${metadata.duration}
                        </span>
                    </div>
                    <div title="Info" class="d-flex flex-column gap-2 mx-2">
                        <span data-tooltip="Last Edited" class="normal-text text-nowrap">
                            <i class="fa-solid fa-pen fa-md me-2"></i>
                            ${getDate(metadata.lastEdit).toLocaleDateString()}
                        </span>
                        <span data-tooltip="Size" class="normal-text">
                            <i class="fa-solid fa-hard-drive fa-md me-2"></i>
                            ${metadata.size}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export async function calculateRows(): Promise<void> {
    // Read rows from local storage.
    let totalRows = await getAllVideosMetadata();
    popupState.totalRows = totalRows;

    let rows = totalRows;

    // Apply search str.
    const applySearch = (metadata: VideoMetadata, searchStr: string) => {
        if (searchStr === '' || searchStr == null) return true;
        return (
            metadata.title.toLowerCase().includes(searchStr.toLowerCase()) ||
            metadata.channelName.toLowerCase().includes(searchStr.toLowerCase())
        );
    };
    rows = rows.filter((v) => applySearch(v, popupState.searchStr ?? ''));

    // Apply sort.
    switch (popupState.sort) {
        case GridSortOptions.MOST_RECENT: {
            rows = rows.sort(
                (a, b) =>
                    getDate(b.lastEdit).getTime() -
                    getDate(a.lastEdit).getTime(),
            );
            break;
        }
        case GridSortOptions.MOST_ACTIVE: {
            rows = rows.sort((a, b) => b.uses - a.uses);
            break;
        }
        case GridSortOptions.A_Z: {
            rows.sort((a, b) =>
                a.title.toLowerCase().localeCompare(b.title.toLowerCase()),
            );
            break;
        }
        case GridSortOptions.LARGEST_SIZE: {
            rows = rows.sort(
                (a, b) => parseContentSize(b.size) - parseContentSize(a.size),
            );
            break;
        }
        case GridSortOptions.OLDEST: {
            rows = rows.sort(
                (a, b) =>
                    getDate(a.lastEdit).getTime() -
                    getDate(b.lastEdit).getTime(),
            );
            break;
        }
    }

    // Track filtered rows.
    popupState.filteredRows = rows;

    // Apply page.
    const calcBounds = () => {
        return {
            lower: popupState.pageSize * (popupState.page - 1),
            upper: popupState.pageSize * popupState.page,
        };
    };
    let bounds = calcBounds();
    if (rows.length < bounds.lower) {
        // Quickly patch page if current count is out of range.
        changePage(1);
        bounds = calcBounds();
    }
    rows = rows.slice(bounds.lower, bounds.upper);

    const videoInterval = document.getElementById('video-interval')!;
    if (popupState.filteredRows.length > 0) {
        videoInterval.textContent = `${bounds.lower + 1} - ${Math.min(bounds.upper, popupState.filteredRows.length)}`;
    } else {
        videoInterval.textContent = 'None';
    }
    const videoCount = document.getElementById('video-count')!;
    videoCount.textContent = `${popupState.filteredRows.length} ${popupState.filteredRows.length == 1 ? 'video' : 'videos'}`;

    // Save into state.
    popupState.rows = rows;
}

export async function render() {
    // Render rows for each video in search grid rows.
    const searchGridContents = document.getElementById('search-grid-contents')!;
    searchGridContents.innerHTML = '';
    if (popupState.rows.length == 0) {
        const el = loadHtmlIntoElement(`
            <div class="h-100 w-100 d-flex justify-content-center align-items-center">
                <span style="opacity: 0.8" class="options-text fst-italic">No notes found</span>
            </div>`)!;
        searchGridContents.append(el);
    } else {
        for (let r of popupState.rows) {
            const html = getRowHtml(r);
            const el = loadHtmlIntoElement(html)!;

            // Add visit listener.
            el.addEventListener('click', () => {
                navigateToUrl(r.url);
            });
            // Setup delete listener.
            el.querySelector('#delete')!.addEventListener(
                'click',
                (event: Event) => {
                    showConfirmationModal('Confirm delete?', async () => {
                        await deleteRow(r.url);
                        await calculateRows();
                        await render();

                        // Communicate deletion to tabs on current page.
                        chrome.tabs.query(
                            { url: r.url, currentWindow: true },
                            async (tabs) => {
                                for (let t of tabs) {
                                    if (t?.id) {
                                        await chrome.tabs.sendMessage(t.id, {
                                            source: 'popup',
                                            type: ExtensionMessageType.DELETE_ROW,
                                            url: r.url,
                                        } as ExtensionMessageDeleteRow);
                                    }
                                }
                            },
                        );
                    });
                    event.stopImmediatePropagation();
                },
            );

            searchGridContents.append(el);
        }
    }

    // Update interactive elements' visibility.

    // Render disabled states for page ctrls.
    const prevPage = document.getElementById('prevPage')! as HTMLButtonElement;
    const nextPage = document.getElementById('nextPage')! as HTMLButtonElement;
    if (popupState.page > 1) {
        prevPage.disabled = false;
    } else {
        prevPage.disabled = true;
    }
    if (popupState.page * popupState.pageSize < popupState.totalRows.length) {
        nextPage.disabled = false;
    } else {
        nextPage.disabled = true;
    }
}

export async function setupPopupButtons() {
    const searchField = document.getElementById(
        'search-field',
    )! as HTMLInputElement;
    const sortField = document.getElementById(
        'sort-field',
    )! as HTMLSelectElement;
    const prevPage = document.getElementById('prevPage')! as HTMLElement;
    const nextPage = document.getElementById('nextPage')! as HTMLElement;

    searchField.addEventListener('input', async (event: any) => {
        await changeSearchStr(event.target.value);
        await calculateRows();
        await render();
    });
    sortField.addEventListener('change', async (event: any) => {
        await changeSort(event.target.value);
        await calculateRows();
        await render();
    });
    prevPage.addEventListener('click', async (event: any) => {
        if (popupState.page > 1) {
            await changePage(popupState.page - 1);
            await calculateRows();
            await render();
        }
    });
    nextPage.addEventListener('click', async (event: any) => {
        if (
            popupState.page * popupState.pageSize <
            popupState.totalRows.length
        ) {
            await changePage(popupState.page + 1);
            await calculateRows();
            await render();
        }
    });

    // Setup license button.
    const infoBtn = document.getElementById('info-btn')!;
    infoBtn.addEventListener('click', () => {
        const modal = showModal(`
            <div style="width: 200px" class="d-flex flex-column p-2 gap-3">
                    <span class="d-flex flex-row justify-content-center align-items-center gap-2">
                        <img src="../images/younotes_logo.png" style="height: 40px;"></img>
                        <span>YouNotes</span>
                    </span>
                    <span class="text-center">Version ${globals.version}</span>
                    <span>This extension does not collect or transmit any personal data.</span>
                    <div class="d-flex flex-column gap-1">
                        <span class="fw-semibold">Chrome Web Store page:</span>
                        <span style="overflow-wrap: anywhere;">https://chromewebstore.google.com/detail/gehcckelgmjikeplalgonkhdojacadmg</span>
                    </div>
                    <div class="d-flex flex-column gap-1">
                        <span class="fw-semibold">Email Support:</span>
                        <span>younotes.help@gmail.com</span>
                    </div>
                    <div class="d-flex flex-column gap-1">
                        <span class="fw-semibold">Third Party Libraries:</span>
                        <div>TipTap editor</div>
                        <div>CodeMirror editor</div>
                        <div>Lowlight syntax highlighting</div>
                    </div>
                    <div class="d-flex flex-column justify-content-center align-items-center gap-2">
                        <button id="license-btn" class="component text-btn clickable p-1 cursor-pointer">
                            Open Licenses
                        </button>
                    </div>
                    <span class="text-center">Developed by <br/>Anthony Norderhaug &copy; 2026</span>
                </div>
            `);
        const licenseBtn = modal.querySelector('#license-btn')!;
        licenseBtn.addEventListener('click', () => {
            const url = chrome.runtime.getURL('THIRD_PARTY_NOTICES.txt');
            window.open(url);
        });
    });

    // Setup header buttons
    const webStoreBtn = document.getElementById('webstore-btn')!;
    webStoreBtn.addEventListener('click', async () => {
        await chrome.tabs.create({
            url: 'https://chromewebstore.google.com/detail/gehcckelgmjikeplalgonkhdojacadmg',
        });
    });
    const emailBtn = document.getElementById('email-btn')!;
    emailBtn.addEventListener('click', async () => {
        await chrome.tabs.create({
            url: 'https://mail.google.com/mail/?view=cm&fs=1&to=younotes.help@gmail.com',
        });
    });
}
