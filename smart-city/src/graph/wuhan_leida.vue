<template>
    <div class="dropdown">
        <div class="title" @click="toggleDropdown">
            {{ tit }}
        </div>
    </div>
    <div ref="leidaRef" style="width: 388px; height: 280px"></div>
</template>

<script>
import * as echarts from 'echarts';
export default {
    name: "leida",
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
            tit: "▎武汉aaa据分析与预测",
            showDropdown: false, // 下拉菜单显示状态
        };
    },
    mounted() {
        this.$eventBus.on("show-wuhan-data-r", showMenu => {
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
            my_chat = this.$echarts.init(this.$refs.leidaRef, "default");
            const initOption = {
            tooltip: {
                trigger: 'item'
            },
            // grid: {
            //         top: "15%",
            //         left: "5%",
            //         right: "15%",
            //         bottom: "5%",
            //         // 把x轴和y轴纳入 grid
            //         // containLabel: true,
            //     },
            visualMap: {
                top: 'middle',
                right: 10,
                color: ['yellow', 'rgb(0,255,237)'],
                calculable: true
            },
            radar: {
                indicator: [
                { text: 'IE8-', max: 400 },
                { text: 'IE9+', max: 400 },
                { text: 'Safari', max: 400 },
                { text: 'Firefox', max: 400 },
                { text: 'Chrome', max: 400 }
                ]
            },
            series: (function () {
                var series = [];
                for (var i = 1; i <= 28; i++) {
                series.push({
                    type: 'radar',
                    symbol: 'none',
                    lineStyle: {
                    width: 1
                    },
                    emphasis: {
                    areaStyle: {
                        color: 'rgba(0,250,0,0.3)'
                    }
                    },
                    data: [
                    {
                        value: [
                        (40 - i) * 10,
                        (38 - i) * 4 + 60,
                        i * 5 + 10,
                        i * 9,
                        (i * i) / 2
                        ],
                        name: i + 2000 + ''
                    }
                    ]
                });
                }
                return series;
            })()
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
