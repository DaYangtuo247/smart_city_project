<template>
    <div class="screen-container" :style="containerStyle">
        <header class="screen-header">
            <div>
                <img v-show="theme == 'darkTheme'" src="~@/assets/images/header_border_dark.png" alt="" />
            </div>
            <span class="title">智慧城市</span>
            <div class="title-right">
                <!-- 打开天气插件会导致地图缩放和无法加载模型，尚不清楚原因 -->
                <!-- <a href="https://www.qweather.com/" target="_blank" class="weather-plug"><div id="he-plugin-simple"></div></a> -->
                <div class="datetime">{{ systemDateTime }}</div>
            </div>
        </header>
        <div class="screen-body">
            <section class="screen-left">
                <div id="left-top">
                    <!-- 城市相关信息趋势图 -->
                    <Trend ref="trend"></Trend>
                </div>
                <div id="left-bottom">
                    <!-- 人流量统计图 -->
                    <Seller ref="seller"></Seller>
                </div>
            </section>
            <section class="screen-middle">
                <div id="middle-top">
                    <!-- 中心地图 -->
                    <single-map ref="map"></single-map>
                </div>
                <div id="middle-bottom">
                    <!-- UrbanGPT -->
                    <Rank ref="rank"></Rank>
                </div>
            </section>
            <section class="screen-right">
                <div id="right-top">
                    <!-- 城市交通分析 -->
                    <Hot ref="hot"></Hot>
                </div>
                <div id="right-bottom">
                    <!-- 城市空气质量分析 -->
                    <Stock ref="stock"></Stock>
                </div>
            </section>
        </div>
    </div>
</template>

<script>
import Hot from "@/components/Hot";
import Map from "@/components/Map";
import Rank from "@/components/Rank";
import Seller from "@/components/Seller";
import Stock from "@/components/Stock";
import Trend from "@/components/Trend";

import { mapState } from "vuex";

export default {
    name: "ScreenPage",
    components: {
        Hot,
        "single-map": Map,
        Rank,
        Seller,
        Stock,
        Trend
    },
    data() {
        return {
            // 当前的系统时间
            systemDateTime: null,
            // 用于保存当前系统日期的定时器id
            timerID: null
        };
    },
    created() {
        // 注册服务端广播的全屏事件
        // this.$socket.registerCallBack('fullScreen', this.recvData)
        // // 注册服务器广播的主题切换事件
        // this.$socket.registerCallBack('themeChange', this.recvThemeChange)
        this.currentTime();
    },
    computed: {
        
        
    },
    destroyed() {
        // 组件销毁时，销毁事件
        // this.$socket.unRegisterCallBack('fullScreen')
        // this.$socket.unRegisterCallBack('themeChange')
        clearInterval(this.timerID);
    },
    methods: {
        // 服务端广播全屏事件的客户端响应
        recvData(data) {
            // 取出是那一个图表进行切换
            const chartName = data.chartName;
            // 判断切换成什么类型[true全屏，false取消全屏]
            const targetValue = data.value;

            this.$nextTick(() => {
                this.$refs[chartName].screenAdapter();
            });
        },
        currentTime() {
            this.systemDateTime = new Date().toLocaleString();

            this.timerID && clearInterval(this.timerID);

            this.timerID = setInterval(() => {
                this.systemDateTime = new Date().toLocaleString();
            }, 1000);
        }
    }
};
</script>
<style lang="less" scoped>
// 全屏样式的定义
.fullscreen {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    z-index: 9999;
}

.screen-container {
    width: 100%;
    height: 100%;
    padding: 0 20px;
    background-color: #161522;
    color: #fff;
    box-sizing: border-box;
}
.screen-header {
    width: 100%;
    height: 64px;
    font-size: 20px;
    position: relative;
    font-family: "nav-font" !important;
    > div {
        img {
            width: 100%;
        }
    }
    .title {
        position: absolute;
        left: 50%;
        top: 50%;
        font-size: 20px;
        transform: translate(-50%, -50%);
    }
    .title-right {
        display: flex;
        align-items: center;
        position: absolute;
        right: 0px;
        top: 50%;
        transform: translateY(-80%);
    }
    .qiehuan {
        width: 28px;
        height: 21px;
        cursor: pointer;
    }
    .datetime {
        font-size: 15px;
        margin-left: 10px;
    }
}
.screen-body {
    width: 100%;
    height: 100%;
    display: flex;
    margin-top: 10px;
    .screen-left {
        height: 100%;
        width: 20%;
        #left-top {
            height: 53%;
            position: relative;
        }
        #left-bottom {
            height: 31%;
            margin-top: 25px;
            position: relative;
        }
    }
    .screen-middle {
        height: 100%;
        width: 58%;
        margin-left: 1.6%;
        margin-right: 1.6%;
        #middle-top {
            width: 100%;
            height: 61%;
            position: relative;
        }
        #middle-bottom {
            margin-top: 25px;
            width: 100%;
            height: 23%;
            position: relative;
        }
    }
    .screen-right {
        height: 100%;
        width: 20%;
        #right-top {
            height: 46%;
            position: relative;
        }
        #right-bottom {
            height: 38%;
            margin-top: 25px;
            position: relative;
        }
    }
}
.resize {
    position: absolute;
    right: 20px;
    top: 20px;
    cursor: pointer;
}

.weather {
    display: block;
    overflow: hidden;
    width: 115px;
    height: 24px;
    margin-right: 10px;
    text-decoration: none;
    cursor: pointer;
}
.weather:active{
    text-decoration: none;
}
</style>
