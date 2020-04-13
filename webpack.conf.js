const HardSourceWebpackPlugin = require("hard-source-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const isDev = process.env.BUILD_ENV === "dev" ? true:false;
const target = process.env.BUILD_TARGET || "vue";
console.log(`building in dev mode: ${isDev}`);
console.log(`building with target: ${target}`);

const plugins =  [
    new HardSourceWebpackPlugin()
];
if (isDev)
    plugins.push(new HtmlWebpackPlugin({ template: `./main/${target}-app/index.html` }));

module.exports = {
    context: __dirname + '/src',
    mode: isDev ? "development":"production",
    devtool: isDev ? "cheap-module-eval-source-map":false,
    optimization: {
        minimize: isDev ? false:true
    },
    devServer: {
        contentBase: __dirname + '/dist',
        watchContentBase: true,
        compress: true,
        bonjour: true,
        clientLogLevel: 'debug',
        port: 3000
    },
    entry: {
        main: isDev ? `./main/${target}-app/index.js`:`./components/index-${target}.js`
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
                use: [ 'style-loader', 'css-loader' ],
            },
            {
                test: /\.less$/,
                use: [ 'style-loader', 'css-loader', 'less-loader' ],
            }
        ],
    },
    plugins
}
