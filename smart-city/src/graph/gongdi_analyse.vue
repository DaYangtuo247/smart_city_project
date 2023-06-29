<template>
    <div class="dropdown">
        <div class="title" @click="toggleDropdown">
            {{ tit }}
        </div>
    </div>
    <div ref="analyseRef" style="width: 388px; height: 320px"></div>
</template>

<script>
import * as echarts from 'echarts';
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
            tit: "▎园区资金投入分布",
            showDropdown: false, // 下拉菜单显示状态
        };
    },
    mounted() {
        this.$eventBus.on("show-gongdi-data-l", showMenu => {
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
                    top: 'bottom'
                },
                toolbox: {
                    show: false,
                    feature: {
                    mark: { show: true },
                    dataView: { show: false, readOnly: true },
                    restore: { show: false },
                    saveAsImage: { show: false }
                    }
                },
                series: [
                    {
                    name: 'Nightingale Chart',
                    type: 'pie',
                    radius: ['20%', '70%'],
                    center: ['50%', '45%'],
                    roseType: 'area',
                    itemStyle: {
                        borderRadius: 8
                    },
                    label: {
                        color: 'rgb(255, 255, 255)'
                    },
                    data: [
                        { value: 40, name: '建设投资' },
                        { value: 38, name: '运营投资' },
                        { value: 32, name: '维护投资' },
                        { value: 30, name: '扶持投资' },
                        { value: 28, name: '建材购买' },
                        { value: 26, name: '宣传投资' },
                    ]
                    }
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
            // this.updateChart();
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
