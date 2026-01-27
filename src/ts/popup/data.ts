import { GridSessionStateKeys, GridSortOptions } from '../types/interfaces';
import { generateKey } from '../util';
import { popupState } from './popup';

// Handlers for changing data.
export async function changeSort(input: GridSortOptions): Promise<void> {
    popupState.sort = input;
    await chrome.storage.session.set({
        [GridSessionStateKeys.sort]: popupState.sort,
    });
    const sortField = document.getElementById(
        'sort-field',
    )! as HTMLSelectElement;
    sortField.value = input;
}
export async function changePage(input: number): Promise<void> {
    popupState.page = input;
    await chrome.storage.session.set({
        [GridSessionStateKeys.page]: popupState.page,
    });
    const pageField = document.getElementById('pageNumber')!;
    pageField.textContent = input.toString();
}
export async function changeSearchStr(input: string): Promise<void> {
    popupState.searchStr = input;
    await chrome.storage.session.set({
        [GridSessionStateKeys.searchStr]: popupState.searchStr,
    });
    const searchField = document.getElementById(
        'search-field',
    )! as HTMLInputElement;
    searchField.value = input;
}
export async function deleteRow(url: string): Promise<void> {
    const metadataKey = generateKey.metadata(url);
    const contentKey = generateKey.content(url);
    await chrome.storage.local.remove(metadataKey);
    await chrome.storage.local.remove(contentKey);
}
