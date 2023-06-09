module.exports = {
    publicPath: "/smart-city",
    outputDir: "smart-city",
    devServer: {
        port: 8888,
        open: true //自动打开浏览器
    },
    configureWebpack: {
        resolve: {
            alias: {
                components: "@/components",
                content: "@/components/content",
                common: "@/components/common",
                assets: "@/assets",
                network: "@/network",
                views: "@/views",
                utils: "@/utils"
            }
        }
    }
};
