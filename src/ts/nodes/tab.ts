// 1. Import the extension
import { Paragraph } from '@tiptap/extension-paragraph';

export const ParagraphWithTab = Paragraph.extend({
    addKeyboardShortcuts() {
        return {
            Enter: () => {
                const { state, view } = this.editor;
                const { $from } = state.selection;

                // Only apply inside paragraph
                if (
                    this.editor.isActive('bulletList') ||
                    this.editor.isActive('orderedList') ||
                    this.editor.isActive('taskList') ||
                    this.editor.isActive('codeBlock') ||
                    this.editor.isActive('blockquote')
                ) {
                    return false;
                }

                const paragraph = $from.parent;
                const text = paragraph.textContent;

                // Count leading tabs
                let indentCount = 0;
                while (
                    indentCount < text.length &&
                    text[indentCount] === '\t'
                ) {
                    indentCount++;
                }

                // Let default split happen first
                const tr = state.tr.split(state.selection.from);
                view.dispatch(tr);

                // Insert indentation into new paragraph
                if (indentCount > 0) {
                    const newPos = tr.selection.from;
                    view.dispatch(
                        view.state.tr.insertText(
                            '\t'.repeat(indentCount),
                            newPos,
                        ),
                    );
                }
                return true;
            },
            Tab: () => {
                const { state, view } = this.editor;
                const { $from } = state.selection;
                if (
                    this.editor.isActive('bulletList') ||
                    this.editor.isActive('orderedList') ||
                    this.editor.isActive('taskList') ||
                    this.editor.isActive('codeBlock') ||
                    this.editor.isActive('blockquote')
                ) {
                    return false;
                }

                const paragraphStart = $from.start();
                const paragraph = $from.parent;
                const text = paragraph.textContent;

                // Find indent boundary.
                let indentCount = 0;
                while (
                    indentCount < text.length &&
                    text[indentCount] === '\t'
                ) {
                    indentCount++;
                }

                const insertPos = paragraphStart + indentCount;
                const tr = state.tr.insertText('\t', insertPos);
                view.dispatch(tr);
                this.editor.commands.setTextSelection(insertPos + 1);

                return true;
            },

            'Shift-Tab': () => {
                const { state } = this.editor;
                const { $from } = state.selection;
                if (
                    this.editor.isActive('bulletList') ||
                    this.editor.isActive('orderedList') ||
                    this.editor.isActive('taskList') ||
                    this.editor.isActive('codeBlock') ||
                    this.editor.isActive('blockquote')
                ) {
                    return false;
                }

                const paragraphStart = $from.start();
                const paragraph = $from.parent;
                const text = paragraph.textContent;

                // Find indent boundary.
                let indentCount = 0;
                while (
                    indentCount < text.length &&
                    text[indentCount] === '\t'
                ) {
                    indentCount++;
                }

                if (indentCount === 0) {
                    return false;
                }
                const removePos = paragraphStart + indentCount - 1;
                this.editor.commands.deleteRange({
                    from: removePos,
                    to: removePos + 1,
                });
                this.editor.commands.setTextSelection(removePos);

                return true;
            },
        };
    },
});
