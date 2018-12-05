const path = require('path');

'use strict';

module.exports = {
    devtool: 'source-map',
    entry: './src/app.ts',
    output:  {
        path: path.resolve(__dirname, '../hexgl_public')
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader'
            }
        ]
    },
    resolve: {
        extensions: [ '.ts', '.tsx', '.js' ]
    }
};
