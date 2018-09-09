const path = require('path');

module.exports = {
    entry: './notifications.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist')
    }
};