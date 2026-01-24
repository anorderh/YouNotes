import { Editor, Extension, Range } from '@tiptap/core';

export interface CommandRule {
    trigger: string;
    action: (editor: Editor, range: Range) => void;
}

export const MyCommandManager = Extension.create({
    addOptions() {
        return {
            rules: [] as CommandRule[],
        };
    },
    name: 'commandManager',
    addKeyboardShortcuts() {
        return {
            Enter: () => {
                const { state } = this.editor;
                const $pos = state.selection.$from;
                const textBefore = $pos.parent.textBetween(
                    0,
                    $pos.parentOffset,
                    '\0',
                    '\0',
                );

                // Check every command.
                for (const rule of this.options.rules) {
                    if (textBefore.endsWith(rule.trigger)) {
                        const from = state.selection.from - rule.trigger.length;
                        const to = state.selection.from;

                        rule.action(this.editor, { from, to });
                        return true; // block default newline
                    }
                }
                return false;
            },
        };
    },
});
