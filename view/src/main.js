import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import axios from "axios";
import echarts from "echarts";

// 引入全局样式文件
import "./assets/css/global.less";

// 引入字体文件
import "./assets/font/iconfont.css";

// 引入 socket_service
// import SocketService from './utils/socket_service'
// SocketService.Instance.connect()
// Vue.prototype.$socket = SocketService.Instance

// axios 配置接口默认路径
axios.defaults.baseURL = "http://127.0.0.1:8080/api";

Vue.prototype.$http = axios;

// 把echarts挂载到 Vue原型上，以便在全局访问
Vue.prototype.$echarts = echarts;
// 引入主题
import "./assets/lib/theme/darkTheme";
import "./assets/lib/theme/lightTheme";

Vue.config.productionTip = false;

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount("#app");
