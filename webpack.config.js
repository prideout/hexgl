const path = require('path');

'use strict';

module.exports = {
    devtool: 'source-map',
    entry: './src/index.ts',
    output:  {
        path: path.resolve(__dirname, '../lightrace_pages')
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
