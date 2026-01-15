type GlobalValuesType = {
    debug: boolean;
    width: {
        lowerLimit: number | null;
        upperLimit: number | null;
        lastWidth: number | null;
    };
    open: boolean;
    storageKeyPrefix: string;
};

export const globals: GlobalValuesType = {
    debug: false,
    width: {
        lowerLimit: null,
        upperLimit: null,
        lastWidth: null,
    },
    open: false,
    storageKeyPrefix: 'yt-notes:',
};
