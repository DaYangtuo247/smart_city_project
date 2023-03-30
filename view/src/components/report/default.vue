<template>
    <div class="com-container">
        <div class="com-chart" ref="trendRef"></div>
    </div>
</template>

<script>
export default {
    name: "Trend",
    data() {
        return {
            // 图表的实例对象
            chartInstance: null,
            // 从服务器中获取的所有数据
            allData: null
        };
    },
    mounted() {
        this.initChart();
        this.getData();
        window.addEventListener("resize", this.screenAdapter);
        // 主动触发 响应式配置
        this.screenAdapter();
    },
    destroyed() {
        window.removeEventListener("resize", this.screenAdapter);
    },
    methods: {
        // 初始化图表的方法
        initChart() {
            this.chartInstance = this.$echarts.init(this.$refs.trendRef, "darkTheme");
            const initOption = {};
            this.chartInstance.setOption(initOption);
        },
        // 发送请求，获取数据
        async getData() {
            // this.$http.get()
            // 对 addData赋值
            this.updateChart();
        },
        // 更新图表配置项
        updateChart() {
            // 处理数据
            const dataOption = {};
            this.chartInstance.setOption(dataOption);
        },
        // 不同分辨率的响应式
        screenAdapter() {
            const adapterOption = {};
            this.chartInstance.setOption(adapterOption);
            this.chartInstance.resize();
        }
    }
};
</script>

<style lang="less" scoped></style>
