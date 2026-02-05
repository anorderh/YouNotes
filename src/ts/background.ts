// chrome.commands.onCommand.addListener((shortcut) => {
//     if (shortcut === 'reload') {
//         chrome.runtime.reload();
//     }
// });

// Presumably not supported in Vivaldi.
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    if (msg.action === 'openPopup') {
        const windowId = sender.tab!.windowId;
        chrome.action.openPopup({
            windowId: windowId,
        });
    }
});
