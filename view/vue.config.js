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
    },
    chainWebpack: config => {
        // 发布模式
        config.when(process.env.NODE_ENV === "production", cofnig => {
            config
                .entry("app")
                .clear()
                .add("./src/main-prod.js");

            //  打包时排除指定包 手动添加 CDN
            config.set("externals", {
                vue: "Vue",
                "vue-router": "VueRouter",
                axios: "axios",
                lodash: "_",
                echarts: "echarts"
            });
            config.plugin("html").tap(args => {
                args[0].isProd = true;
                return args;
            });
        });

        // 开发模式
        config.when(process.env.NODE_ENV === "development", cofnig => {
            config.plugin("html").tap(args => {
                args[0].isProd = false;
                return args;
            });
            config
                .entry("app")
                .clear()
                .add("./src/main-dev.js");
        });
    }
};
