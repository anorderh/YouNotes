import { loadHtmlIntoElement } from '../util';

export function navigateToUrl(url: string) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) return;

        chrome.tabs
            .update(tabs[0].id, {
                url,
            })
            .then(() => {
                // Close as navigation occurs
                window.close();
            });
    });
}

export function getDate(input: string) {
    return new Date(Date.parse(input));
}

export function showModal(html: string) {
    // Setup handlers.
    const popup = document.getElementById('popup-overlay')!;
    const dialog = document.getElementById('dialog')!;
    let openDialog = () => {
        popup.classList.remove('hidden');
        setTimeout(() => {
            popup.style.opacity = '1';
        });
    };
    let closeDialog = () => {
        popup.style.opacity = '';
        setTimeout(() => {
            popup.classList.add('hidden');
        }, 150);
    };

    // Reload dialog & render content.
    dialog.innerHTML = '';
    let dialogContents = loadHtmlIntoElement(html)!;
    dialog.append(dialogContents);
    openDialog();
    popup.addEventListener('click', async () => {
        closeDialog();
    });
    dialog.addEventListener('click', (e) => {
        e.stopImmediatePropagation();
    });

    return dialogContents;
}

export function showConfirmationModal(
    text: string,
    confirmed: () => Promise<void>,
) {
    const popup = document.getElementById('popup-overlay')!;
    const dialog = document.getElementById('dialog')!;
    let openDialog = () => {
        popup.classList.remove('hidden');
        setTimeout(() => {
            popup.style.opacity = '1';
        });
    };
    let closeDialog = () => {
        popup.style.opacity = '';
        setTimeout(() => {
            popup.classList.add('hidden');
        }, 150);
    };

    // Reload dialog & appear.
    dialog.innerHTML = '';
    let dialogContents = loadHtmlIntoElement(`
        <div class="d-flex flex-column justify-content-center align-items-center gap-2">
            <span class="text-white fs-6">${text}</span>
            <div class="d-flex flex-row justify-content-center gap-2">
                <button id="cancel" class="clickable p-2">
                    <span>
                        <i class="fa-solid fa-x me-1"></i>    
                        Cancel
                    </span>
                </button>
                <button id="confirm" class="clickable p-2">
                    <span>
                        <i class="fa-solid fa-check me-1"></i>    
                        Confirm
                    </span>
                </button>
            </div>
        </div>`)!;
    dialog.append(dialogContents);
    openDialog();

    // Setup click handlers.
    let cancel = dialogContents.querySelector('#cancel')!;
    cancel.addEventListener('click', async () => {
        closeDialog();
    });
    let confirm = dialogContents.querySelector('#confirm')!;
    confirm.addEventListener('click', async () => {
        await confirmed();
        closeDialog();
    });
    dialog.addEventListener('click', (e) => {
        e.stopImmediatePropagation();
    });
    popup.addEventListener('click', async () => {
        closeDialog();
    });
}
