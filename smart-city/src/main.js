import { createApp } from "vue";
import App from "./App.vue";

import * as echarts from "echarts";

// 引入全局样式文件
import "assets/css/global.css";

const app = createApp(App);

// 把echarts挂载到 Vue原型上，以便在全局访问
app.config.globalProperties.$echarts = echarts;

app.mount("#app");
