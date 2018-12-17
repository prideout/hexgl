const path = require('path');

'use strict';

module.exports = {
    devtool: 'source-map',
    entry: './src/app.ts',

    // We do not actually use the following modules, but emscripten emits JS bindings that
    // conditionally uses them. Therefore we need to tell webpack to skip over their "require"
    // statements.
    externals: {
        fs: 'fs',
        crypto: 'crypto',
        path: 'path'
    },

    output:  {
        path: path.resolve(__dirname, '../hexgl_public')
    },

    module: {
        rules: [
            { test: /\.tsx?$/, loader: 'ts-loader' }
        ]
    },

    resolve: {
        extensions: [ '.ts', '.tsx', '.js' ],

        // This must be consistent with tsconfig.json:
        alias: {
          'filament': path.resolve(__dirname, 'filament/filament'),
        }
    },

    performance: {
        assetFilter: function(assetFilename) {
            return false;
        }
    }
};
