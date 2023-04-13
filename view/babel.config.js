// 这是项目发布阶段需要用到的插件
const prodPlugins = [];

module.exports = {
    presets: ["@vue/cli-plugin-babel/preset"],
    plugins: [
        // 发布模式时，使用到的插件
        ...prodPlugins,
        "@babel/plugin-syntax-dynamic-import"
    ]
};
