import { Editor } from '@tiptap/core';

type GlobalValuesType = {
    version: string;
    debug: boolean;
    width: {
        lowerLimit: number | null;
        upperLimit: number | null;
        lastWidth: number | null;
        min: number;
    };
    appeared: boolean; // Flag for if side tab is visible.
    open: boolean; // Flag for if sidepanel is open
    actionsExpanded: boolean; // Flag for if actions are expanded
    used: boolean; // Flag for if YouNotes was used on the current page.
    editor?: Editor;
    callbacks: {
        open?: () => void;
        close?: () => void;
        expandActions?: () => void;
        collapseActions?: () => void;
        load?: (input: string) => void;
        save?: (input: string) => void;
        clear?: () => void;
        delete?: () => void;
    };
};

export const globals: GlobalValuesType = {
    version: '1.0.1',
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
    used: false,
    callbacks: {},
};
