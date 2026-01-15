const prefixer = require('postcss-prefix-selector');

module.exports = {
    plugins: [
        prefixer({
            prefix: '.bs', // Your unique class
            transform(prefix, selector, prefixedSelector, filePath, rule) {
                // If the selector is 'body' or ':root', replace it with the prefix
                if (selector === 'body' || selector === ':root') {
                    return prefix;
                }
                // Otherwise, use the standard prefixed version (e.g., .my-ext-container .btn)
                return prefixedSelector;
            },
        }),
    ],
};
