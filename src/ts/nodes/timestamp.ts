import { Node } from '@tiptap/core';
import { changeVideoTime } from '../util';

export const Timestamp = Node.create({
    name: 'timestamp',
    group: 'inline',
    inline: true,
    atom: true, // treat as single atomic unit
    content: 'text*',

    addAttributes() {
        return {
            timestamp: { default: null },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'a[data-timestamp]',
                getAttrs: (dom) => ({
                    timestamp: (dom as HTMLElement).dataset.timestamp || null,
                }),
            },
        ];
    },

    renderHTML({ node }) {
        return [
            'a',
            { 'data-timestamp': node.attrs.timestamp, class: 'bs tiptap' },
            0,
        ];
    },

    addNodeView() {
        return ({ node }) => {
            const container = document.createElement('div');
            container.dataset.timestamp = node.attrs.timestamp;

            const content = document.createElement('a');
            content.classList.add('bs', 'tiptap');
            content.textContent = node.textContent;
            content.style.cursor = 'pointer';
            content.addEventListener('click', (e) => {
                e.stopImmediatePropagation(); // prevent container click
                e.preventDefault();
                changeVideoTime(node.attrs.timestamp);
            });

            return {
                dom: content,
            };
        };
    },
});
