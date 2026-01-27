import '../tooltip';
import { loadPopupSessionState, setupPopupButtons } from './popup';

(async () => {
    await loadPopupSessionState();
    await setupPopupButtons();
})();
