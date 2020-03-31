const HardSourceWebpackPlugin = require("hard-source-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")

const isDev = process.env.NODE_ENV === "dev" || true;

module.exports = {
    context: __dirname + '/src',
    mode: isDev ? "development":"production",
    devtool: isDev ? "cheap-module-eval-source-map":null,
    optimization: {
        minimize: isDev ? false:true
    },
    entry: {
        main: "./index.js"
    },
    output: {
        path: __dirname + "/dist",
        filename: "index.bundle.js"
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                use: [ 'html-loader' ]
            }, {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.less$/,
                use: ['style-loader', 'css-loader', 'less-loader'],
            },
            {
                test: /\.(png|jpeg|ttf|...)$/,
                use: [ { loader: 'url-loader' } ]
            }
        ],
    },
    plugins: [
        new HardSourceWebpackPlugin(),
        new HtmlWebpackPlugin({ template: "./index.html" })
    ]
}
