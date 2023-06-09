import { createApp } from "vue";
import App from "./App.vue";

// import axios from 'axios'
// import echarts from 'echarts'

// 引入全局样式文件
import "assets/css/global.css";

// // axios 配置接口默认路径
// axios.defaults.baseURL = 'http://127.0.0.1:8080/api'

// window.$vueApp.config.globalProperties.$http = axios

// // 把echarts挂载到 Vue原型上，以便在全局访问
// window.$vueApp.config.globalProperties.$echarts = echarts

createApp(App).mount("#app");
