import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    base: "/smart-city/",
    build: {
        outDir: "smart-city",
    },
    server: {
        port: 8888,
        open: true,
    },
    plugins: [vue()],
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
            components: "/src/components",
            assets: "/src/assets",
            graphData: "/src/graphData",
        },
    },
});
