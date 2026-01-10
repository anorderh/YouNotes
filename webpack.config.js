const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development', // or 'production'
    devtool: 'source-map', // No eval, to support webpack with Chrome
    entry: {
        content: './src/index.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'webpack.bundle.js',
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/html', to: 'html' },
                { from: 'src/css', to: 'css' },
                { from: 'src/manifest.json', to: '.' },
                { from: 'src/images', to: 'images' },
            ],
        }),
    ],
    module: {
        rules: [
            {
                test: /\.html$/,
                type: 'asset/source',
            },
        ],
    },
};
