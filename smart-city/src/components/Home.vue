<template>
    <div class="com-container">
        <Map ref="map"></Map>
        <!-- 顶部导航 -->
        <header>
            <img src="~@/assets/images/header-bg.png" alt="" class="header-bg" />
            <div class="nav-left" v-if="weatherData">
                <ul>
                    <li style="position: relative; height: 40px; width: 40px"><img :src="`/smart-city/src/assets/images/weather/${weatherData.lives[0].weather}.png`" alt="" /></li>
                    <li class="temperature">{{ weatherData.lives[0].temperature }}°C</li>
                    <li>
                        <p class="head">风向描述</p>
                        <p class="content">{{ weatherData.lives[0].winddirection }}</p>
                    </li>
                    <li>
                        <p class="head">风力级别</p>
                        <p class="content">{{ weatherData.lives[0].windpower }}</p>
                    </li>
                    <li>
                        <p class="head">空气湿度</p>
                        <p class="content">{{ weatherData.lives[0].humidity }}</p>
                    </li>
                </ul>
            </div>
            <div class="nav-right">
                <div>
                    <span class="date">{{ systemTime.date }}</span
                    ><span class="time">{{ systemTime.time }}</span>
                </div>
            </div>
        </header>
        <!-- AI -->
        <div>
            <div @click="showAiWindow()" class="ai-btn">
                <transition name="fade">
                    <span v-if="!AiVisible">
                        <img src="~@/assets/images/AI.png" alt="" />
                    </span>
                    <span v-else>
                        <img :class="{ rotate: isRotated }" class="ai-image" src="/smart-city/src/assets/images/close.png" alt="" />
                    </span>
                </transition>
            </div>
            <Ai v-if="AiVisible" ref="ai"></Ai>
        </div>
        <img src="~@/assets/images/bottom-bg.png" alt="" class="bottom-bg" />
        <!-- echarts图表 -->
        <liftGraph></liftGraph>
        <rightGraph></rightGraph>
    </div>
</template>

<script>
import Map from "components/Map.vue";
import Ai from "components/Ai.vue";
import liftGraph from "components/left_graph.vue";
import rightGraph from "components/right_graph.vue";

export default {
    name: "ScreenPage",
    components: {
        Map,
        Ai,
        liftGraph,
        rightGraph,
    },
    data() {
        return {
            weatherData: null,
            // AI窗口的可见性
            AiVisible: false, // 控制显示AI文字还是图片
            isRotated: false, // 控制图片旋转
            // 当前的系统时间
            systemDateTime: null,
            // 用于保存当前系统日期的定时器id
            timerID: null,
            systemTime: {
                timer: null,
                time: "",
                date: "",
            },
        };
    },
    mounted() {
        this.dateFormat();
        this.getWeacher();
        this.systemTime.timer = setInterval(() => {
            this.dateFormat();
        }, 1000);
    },
    beforeDestroy() {
        this.dataDestroy();
    },
    methods: {
        showAiWindow() {
            this.AiVisible = !this.AiVisible; // 切换显示状态
            this.isRotated = !this.isRotated; // 切换旋转状态
        },
        dataDestroy() {
            // 在Vue实例销毁前，清除我们的定时器
            if (this.systemTime.timer) {
                clearInterval(this.systemTime.timer);
            }
        },
        dateFormat() {
            let date = new Date();
            let year = date.getFullYear();
            let month = date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1;
            let day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
            let hours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
            let minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
            let seconds = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
            this.systemTime.date = year + "." + month + "." + day + " " + "星期" + "日一二三四五六".charAt(date.getDay());
            this.systemTime.time = hours + ":" + minutes + ":" + seconds;
        },
        async getWeacher() {
            try {
                const response = await this.$http.get("https://restapi.amap.com/v3/weather/weatherInfo?key=c409f28e7cbdd534efae2dcc10991175&city=420100&extensions=base&output=JSON");
                this.weatherData = response.data;
            } catch (error) {
                console.error(error);
            }
        },
    },
};
</script>
<style src="../assets/css/home.css"></style>
