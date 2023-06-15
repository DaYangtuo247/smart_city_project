<template>
    <div ref="TrendRef" style="width: 388px; height: 260px"></div>
</template>

<script>
export default {
    name: "Trend",
    data() {
        return {
            // 图表的实例对象
            chartInstance: null,
            // 从服务器中获取的所有数据
            allData: null,
            activeName: "people",
            url: "/图书馆人流量趋势.json",
        };
    },
    mounted() {
        this.$eventBus.on("show-libary-data", showMenu => {
            if (showMenu) {
                // 在div渲染结束后在初始化图表
                this.$nextTick(() => {
                    this.initChart();
                    this.getData();
                });
            } else {
                this.removeChart();
            }
        });
    },
    methods: {
        initChart() {
            this.chartInstance = this.$echarts.init(this.$refs.TrendRef, "default");
            const initOption = {
                textStyle: {
                    fontSize: 10, // 设置字体大小
                },
                title: {
                    text: "图书馆人流量趋势",
                },
                grid: {
                    left: "3%",
                    top: "35%",
                    right: "4%",
                    bottom: "1%",
                    // 把x轴和y轴纳入 grid
                    containLabel: true,
                },
                // 工具提示
                tooltip: {
                    // 当鼠标移入坐标轴的显示提示
                    trigger: "axis",
                },
                legend: {
                    left: "center",
                    top: "18%",
                    // 图例的icon类型
                    icon: "circle",
                },
                xAxis: {
                    type: "category",
                    // 紧挨边缘
                    boundaryGap: false,
                },
                yAxis: {
                    type: "value",
                },
            };
            this.chartInstance.setOption(initOption);
        },
        // 获取服务器数据
        async getData() {
            this.allData = null;
            const { data: res } = await this.$http.get(this.url);
            this.allData = res;
            this.updateChart();
        },
        // 更新图表
        updateChart() {
            // 半透明的颜色值
            const colorArr1 = [
                "rgba(11, 168, 44, 0.5)",
                "rgba(44, 110, 255, 0.5)",
                "rgba(22, 242, 217, 0.5)",
                "rgba(254, 33, 30, 0.5)",
                "rgba(250, 105, 0, 0.5)",
                "rgba(250, 254, 0, 0.5)",
                "rgba(0, 234, 255, 0.5)",
            ];
            // 全透明的颜色值
            const colorArr2 = [
                "rgba(11, 168, 44, 0)",
                "rgba(44, 110, 255, 0)",
                "rgba(22, 242, 217, 0)",
                "rgba(254, 33, 30, 0)",
                "rgba(250, 105, 0, 0)",
                "rgba(250, 254, 0, 0)",
                "rgba(0, 234, 255, 0)",
            ];

            // x轴数据
            const month = this.allData.common.month;
            // y轴数据 series下的数据
            const valueArr = this.allData[this.activeName].data;

            const seriesArr = valueArr.map((item, index) => {
                return {
                    // 图例的数据需要和series的name匹配
                    name: item.name,
                    type: "line",
                    data: item.data,
                    // 同个类目轴上系列配置相同的stack值后，后一个系列的值会在前一个系列的值上相加。
                    stack: this.activeName,
                    // 区域填充样式。
                    areaStyle: {
                        color: new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            // 0% 颜色
                            {
                                offset: 0,
                                color: colorArr1[index],
                            },
                            // 100% 颜色
                            {
                                offset: 1,
                                color: colorArr2[index],
                            },
                        ]),
                    },
                };
            });
            // 准备图例的数据
            const legendArr = valueArr.map(item => item.name);

            const dataOption = {
                xAxis: {
                    data: month,
                },
                legend: {
                    data: legendArr,
                },
                series: seriesArr,
            };
            this.chartInstance.setOption(dataOption);
        },
        removeChart() {
            this.chartInstance.dispose();
            this.chartInstance = null;
        },
    },
};
</script>
