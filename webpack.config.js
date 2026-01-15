const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { watch } = require('fs');

module.exports = {
    mode: 'development', // or 'production'
    devtool: 'source-map', // No eval, to support webpack with Chrome
    entry: {
        content: './src/index.ts',
        background: './src/background.ts',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                type: 'asset/source',
            },
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
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
    watch: true,
};
