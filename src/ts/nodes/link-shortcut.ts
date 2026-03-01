import { Extension } from '@tiptap/core';

export const LinkShortcut = Extension.create({
    addKeyboardShortcuts() {
        return {
            'Mod-k': ({ editor }) => {
                if (editor.state.selection.empty) {
                    return false;
                }
                const url = prompt('Enter URL:');
                if (url != null) {
                    editor.chain().setLink({ href: url }).run();
                }

                return true;
            },
        };
    },
});
