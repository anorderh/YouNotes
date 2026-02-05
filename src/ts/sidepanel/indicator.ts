export class SidepanelIndicator {
    static icon = (): HTMLImageElement =>
        document.getElementById('sidepanel-icon') as HTMLImageElement;
    static indicator = (): HTMLImageElement =>
        document.getElementById('sidepanel-indicator') as HTMLImageElement;

    static toggle(input: boolean) {
        requestAnimationFrame(() => {
            if (input) {
                this.indicator().style.filter = 'grayscale(0%)';
                this.icon().style.filter = 'brightness(100%)';
            } else {
                this.indicator().style.filter = 'grayscale(100%)';
                this.icon().style.filter = 'brightness(150%)';
            }
        });
    }
}
