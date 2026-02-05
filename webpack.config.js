const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { watch } = require('fs');
const webpack = require('webpack');

module.exports = {
    // mode: 'development',
    mode: 'production',
    devtool: 'source-map', // No eval, to support webpack with Chrome
    entry: {
        sidepanel: './src/ts/sidepanel/index.ts',
        popup: './src/ts/popup/index.ts',
        background: './src/ts/background.ts',
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
                { from: 'THIRD_PARTY_NOTICES.txt', to: '.' },
            ],
        }),
        new webpack.BannerPlugin({
            banner: '© 2026 Ant N. All rights reserved, excluding outlined third-party libraries.',
        }),
    ],
    watch: true,
};
