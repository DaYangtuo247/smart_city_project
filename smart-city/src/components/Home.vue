<template>
    <div class="com-container">
        <Map ref="map"></Map>
        <header>
            <div>
                <img src="~@/assets/images/header-bg.png" alt="" class="header-bg" />
            </div>
            <div class="nav-right">
                <div>
                    <span class="date">{{ systemTime.date }}</span
                    ><span class="time">{{ systemTime.time }}</span>
                </div>
            </div>
        </header>
        <button @click="showAiWindow('父组件')" class="ai-btn">Ai</button>
        <Ai v-if="AiVisiable" ref="ai"></Ai>
        <img src="~@/assets/images/bottom-bg.png" alt="" class="bottom-bg" />
    </div>
</template>

<script>
import Map from "components/Map.vue";
import Ai from "components/Ai.vue";

export default {
    name: "ScreenPage",
    components: {
        Map: Map,
        Ai: Ai,
    },
    data() {
        return {
            // AI窗口的可见性
            AiVisiable: false,
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
        this.systemTime.timer = setInterval(() => {
            this.dateFormat();
        }, 1000);
    },
    beforeDestroy() {
        this.dataDestroy();
    },
    methods: {
        showAiWindow(data) {
            if (this.AiVisiable == true) {
                this.AiVisiable = false;
            } else {
                this.AiVisiable = true;
            }
            this.$nextTick(() => {
                //data是传递给弹窗页面的值
                this.$refs.dialog.init(data);
            });
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
    },
};
</script>

<style>
.ai-btn {
    position: absolute;
    right: 50px;
    bottom: 100px;
    width: 40px;
    height: 30px;
    z-index: 999999;
}
header {
    position: absolute;
    z-index: 999999;
    width: 100%;
}
header .header-bg {
    width: 100%;
}

header .nav-right {
    font-family: "Alibaba";
    position: absolute;
    right: 35px;
    top: 18px;
    color: white;
}

header .date {
    font-size: 14px;
    margin-right: 10px;
}

header .time {
    font-size: 20px;
}

.bottom-bg {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
}
</style>
