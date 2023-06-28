<template>
    <div class="dropdown">
        <div class="title" @click="toggleDropdown">
            {{ tit }}
        </div>
    </div>
    <div ref="moveRef" style="width: 388px; height: 280px"></div>
</template>

<script>
import * as echarts from 'echarts';
export default {
    name: "move",
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
            // Generate data
            let category = [];
            let dottedBase = +new Date();
            let lineData = [];
            let barData = [];
            for (let i = 0; i < 20; i++) {
            let date = new Date((dottedBase += 3600 * 24 * 1000));
            category.push(
                [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-')
            );
            let b = Math.random() * 200;
            let d = Math.random() * 200;
            barData.push(b);
            lineData.push(d + b);
            }
            let my_chat = this.chartInstance;
            my_chat = this.$echarts.init(this.$refs.moveRef, "default");
            const initOption = {
            grid: {
                top: '15%',
                // left: 15,
                // right: 15,
                // height: 160
                bottom: '10%'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                type: 'shadow'
                }
            },
            legend: {
                data: ['line', 'bar'],
                textStyle: {
                color: '#ccc'
                }
            },
            xAxis: {
                data: category,
                axisLine: {
                lineStyle: {
                    color: '#ccc'
                }
                }
            },
            yAxis: {
                splitLine: { show: false },
                axisLine: {
                lineStyle: {
                    color: '#ccc'
                }
                }
            },
            series: [
                {
                name: 'line',
                type: 'line',
                smooth: true,
                showAllSymbol: true,
                symbol: 'emptyCircle',
                symbolSize: 5,
                data: lineData
                },
                {
                name: 'bar',
                type: 'bar',
                barWidth: 10,
                itemStyle: {
                    borderRadius: 5,
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#14c8d4' },
                    { offset: 1, color: '#43eec6' }
                    ])
                },
                data: barData
                },
                {
                name: 'line',
                type: 'bar',
                barGap: '-100%',
                barWidth: 10,
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(20,200,212,0.5)' },
                    { offset: 0.2, color: 'rgba(20,200,212,0.2)' },
                    { offset: 1, color: 'rgba(20,200,212,0)' }
                    ])
                },
                z: -12,
                data: lineData
                },
                {
                name: 'dotted',
                type: 'pictorialBar',
                symbol: 'rect',
                itemStyle: {
                    color: '#0f375f'
                },
                symbolRepeat: true,
                symbolSize: [12, 4],
                symbolMargin: 1,
                z: -10,
                data: lineData
                }
            ]
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
