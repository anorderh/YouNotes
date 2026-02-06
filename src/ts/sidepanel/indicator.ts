export class SidepanelIndicator {
    static icon = (): HTMLImageElement =>
        document.getElementById('sidepanel-icon') as HTMLImageElement;
    static indicator = (): HTMLImageElement =>
        document.getElementById('sidepanel-indicator') as HTMLImageElement;

    static toggle(input: boolean) {
        const indicator = this.indicator();
        const icon = this.icon();
        requestAnimationFrame(() => {
            if (indicator && icon) {
                if (input) {
                    indicator.style.filter = 'grayscale(0%)';
                    icon.style.filter = 'brightness(100%)';
                } else {
                    indicator.style.filter = 'grayscale(100%)';
                    icon.style.filter = 'brightness(150%)';
                }
            }
        });
    }
}
