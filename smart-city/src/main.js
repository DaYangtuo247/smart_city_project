import { createApp } from "vue";
import App from "./App.vue";
// import store from "./store";
import mitt from 'mitt'; // vue3中eventBus事件总线的方法被废弃，需要引入第三方库
import axios from "axios";
import * as echarts from "echarts";

// 引入全局样式文件
import "assets/css/global.css";
// 引入主题
import theme from "@/assets/theme.json";
echarts.registerTheme("default", theme);

const app = createApp(App);

// axios 配置接口默认路径，后端地址
axios.defaults.baseURL = "http://localhost:8080/api";
app.config.globalProperties.$http = axios;

// 把echarts挂载到 Vue原型上，以便在全局访问
app.config.globalProperties.$echarts = echarts;

// 在应用实例上添加一个全局事件总线属性
app.config.globalProperties.$eventBus = mitt();

app.mount("#app");
