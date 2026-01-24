import { Editor } from '@tiptap/core';

type GlobalValuesType = {
    debug: boolean;
    width: {
        lowerLimit: number | null;
        upperLimit: number | null;
        lastWidth: number | null;
        min: number;
    };
    appeared: boolean;
    open: boolean;
    actionsExpanded: boolean;
    storageKeyPrefix: string;
    editor?: Editor;
    callbacks: {
        open?: () => void;
        close?: () => void;
        expandActions?: () => void;
        collapseActions?: () => void;
    };
};

export const globals: GlobalValuesType = {
    debug: false,
    width: {
        lowerLimit: null,
        upperLimit: null,
        lastWidth: null,
        min: 350,
    },
    appeared: false,
    open: false,
    actionsExpanded: false,
    storageKeyPrefix: 'yt-notes:',
    callbacks: {},
};
