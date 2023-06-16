<template>
    <div class="dropdown">
        <div class="title" @click="toggleDropdown">
            {{ tit }}
            <i class="arrow" :class="{ 'arrow-up': showDropdown, 'arrow-down': !showDropdown }">⇓</i>
        </div>
        <ul v-show="showDropdown">
            <li v-for="(data, index) in allData" :key="index" @click="switchData(index)">
                <template v-if="data.title !== tit">{{ data.name }}</template>
            </li>
        </ul>
    </div>
    <div ref="analyseRef" style="width: 388px; height: 260px"></div>
</template>

<script>
export default {
    name: "analyse",
    data() {
        return {
            // 图表的实例对象
            chartInstance: null,
            // 从服务器中获取的所有数据
            allData: null,
            // 当前显示的一级分类数据类型
            currentIndex: 0,
            currentDataIndex: 0, // 添加当前显示的数据索引
            url: "/图书馆借阅统计分析.json",
            tit: "▎图书馆年级借阅书目统计（册）",
            showDropdown: false, // 下拉菜单显示状态
        };
    },
    mounted() {
        this.$eventBus.on("show-library-data-r", showMenu => {
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
        // 初始化图表的方法
        initChart() {
            this.chartInstance = this.$echarts.init(this.$refs.analyseRef, "default");

            const initOption = {
                tooltip: {
                    trigger: "item",
                },
                legend: {
                    orient: "vertical",
                    left: "right",
                    top: "middle",
                },
                series: [
                    {
                        type: "pie",
                        radius: ["25%", "70%"],
                        avoidLabelOverlap: false,
                        label: {
                            show: true,
                            position: "inside",
                            fontSize: 14,
                            color: "white",
                        },
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: "rgba(0, 0, 0, 0.5)",
                            },
                            label: {
                                show: true,
                                fontSize: 18,
                                fontWeight: "bold",
                            },
                        },
                        labelLine: {
                            show: false,
                        },
                        data: this.allData,
                    },
                ],
            };
            this.chartInstance.setOption(initOption);
        },
        // 发送请求，获取数据
        async getData() {
            this.allData = null;
            const { data: res } = await this.$http.get(this.url);
            this.allData = res;
            // 更新数据
            this.updateChart();
        },
        // 更新图表配置项
        updateChart() {
            // 处理数据
            const valueData = this.allData[this.currentDataIndex].children;
            const legenDateArr = valueData.map(item => item.name);
            const seriesDataArr = valueData.map(item => {
                return {
                    name: item.name,
                    value: item.value,
                    children: item.children,
                };
            });
            const dataOption = {
                legend: {
                    data: legenDateArr,
                },
                series: [
                    {
                        data: seriesDataArr,
                    },
                ],
            };
            this.chartInstance.setOption(dataOption);
        },
        removeChart() {
            this.chartInstance.dispose();
            this.chartInstance = null;
        },
        toggleDropdown() {
            this.showDropdown = !this.showDropdown;
        },
        switchData(index) {
            this.currentDataIndex = index;
            this.tit = this.allData[this.currentDataIndex].name;
            this.showDropdown = false;
            this.getData();
        },
    },
};
</script>
