<template>
    <div class="dropdown">
        <div class="title" @click="toggleDropdown">
            {{ tit }}
        </div>
    </div>
    <div ref="zhuRef" style="width: 388px; height: 280px"></div>
</template>

<script>
import * as echarts from 'echarts';
export default {
    name: "zhu",
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
            tit: "▎来汉人口工作去向",
            showDropdown: false, // 下拉菜单显示状态
        };
    },
    mounted() {
        this.$eventBus.on("show-wuhan-data-l", showMenu => {
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
            let my_chat = this.chartInstance;
            my_chat = this.$echarts.init(this.$refs.zhuRef, "default");
            const initOption = {
                grid: {
                    top: "5%",
                    left: "5%",
                    right: "5%",
                    bottom: "5%",
                    // 把x轴和y轴纳入 grid
                    containLabel: true,
                },
            angleAxis: {
                type: 'category',
                data: ['2017', '2018', '2019', '2020', '2021', '2022', '2023']
            },
            tooltip: {
                trigger: 'axis'
            },
            radiusAxis: {},
            polar: {},
            series: [
                {
                type: 'bar',
                data: [1, 2, 3, 4, 3, 5, 1],
                coordinateSystem: 'polar',
                name: '国企编制',
                stack: 'a',
                emphasis: {
                    focus: 'series'
                }
                },
                {
                type: 'bar',
                data: [2, 4, 6, 1, 3, 2, 1],
                coordinateSystem: 'polar',
                name: '私企员工',
                stack: 'a',
                emphasis: {
                    focus: 'series'
                }
                },
                {
                type: 'bar',
                data: [1, 2, 3, 4, 1, 2, 5],
                coordinateSystem: 'polar',
                name: '自由职业',
                stack: 'a',
                emphasis: {
                    focus: 'series'
                }
                }
            ],
            legend: {
                show: false,
                data: ['A', 'B', 'C'],
                top: 'bottom',
            }
            };
            my_chat.setOption(initOption);
        },
        // 发送请求，获取数据
        async getData() {
            this.allData = null;
            const { data: res } = await this.$http.get(this.url);
            this.allData = res;
            // 更新数据
            // this.updateChart();
        },
        update_chat()
        {
            
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
