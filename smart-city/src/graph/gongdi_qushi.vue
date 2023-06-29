<template>
    <div class="dropdown">
        <div class="title">
            {{ tit }}
        </div>
    </div>
    <div ref="qushiRef" style="width: 388px; height: 300px"></div>
</template>

<script>
export default {
    name: "qushi",
    data() {
        return {
            // 图表的实例对象
            chartInstance: null,
            // 从服务器中获取的所有数据
            allData: null,
            // // 当前显示的一级分类数据类型
            // currentIndex: 0,
            // currentDataIndex: 0, // 添加当前显示的数据索引
            url: "/图书馆使用情况排行.json",
            tit: "▎园区不同项目投入人员占比",
            showDropdown: false, // 下拉菜单显示状态
            // 柱形图 区域缩放起点值
            startValue: 0,
            // 柱形图结 区域缩放终点值
            endValue: 9,
            // 定时器
            timerId: null,
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
            this.chartInstance = this.$echarts.init(this.$refs.qushiRef, "default");
    
            const initOption = {
            legend: {
                data: ['项目进度', '投入人员'],
                top: '95%'
            },
            radar: {
                // shape: 'circle',
                indicator: [
                { name: '园区企业建设', max: 6500 },
                { name: '园区企业装修', max: 16000 },
                { name: '园区建设', max: 30000 },
                { name: '园区企业招标', max: 38000 },
                { name: '园区运营', max: 52000 },
                { name: '园区规划', max: 25000 }
                ]
            },
            series: [
                {
                center: ['50%', '50%'],
                name: 'Budget vs spending',
                type: 'radar',
                data: [
                    {
                    value: [4200, 3000, 20000, 35000, 50000, 18000],
                    name: '项目进度'
                    },
                    {
                    value: [5000, 14000, 28000, 26000, 42000, 21000],
                    name: '投入人员'
                    }
                ]
                }
            ]
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
            // 渐变色数组
            const colorArr = [
                ["#0BA82C", "#4FF778"],
                ["#2E72BF", "#23E5E5"],
                ["#5052EE", "#AB6EE5"],
            ];
            // const colorArr = [
            //   ['#b8e994', '#079992'],
            //   ['#82ccdd', '#0a3d62'],
            //   ['#f8c291', '#b71540'],
            // ]
            // 所有省份组成的数组
            const provinceInfo = this.allData.map(item => item.name);
            // 所有省份对应的销售金额
            const valueArr = this.allData.map(item => item.value);

            const dataOption = {
                xAxis: {
                    data: provinceInfo,
                },
                dataZoom: {
                    // 区域缩放组件
                    show: false,
                    startValue: this.startValue,
                    endValue: this.endValue,
                },
                series: [
                    {
                        data: valueArr,
                        itemStyle: {
                            color: arg => {
                                let targetColorArr = null;

                                if (arg.value > 1500) {
                                    targetColorArr = colorArr[0];
                                } else if (arg.value > 1000) {
                                    targetColorArr = colorArr[1];
                                } else {
                                    targetColorArr = colorArr[2];
                                }

                                return new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                    // 0%
                                    { offset: 0, color: targetColorArr[0] },
                                    // 100%
                                    { offset: 1, color: targetColorArr[1] },
                                ]);
                            },
                        },
                    },
                ],
            };
            this.chartInstance.setOption(dataOption);
        },
        // 根据图标容器的宽度 计算各属性、标签、元素的大小
        screenAdapter() {
            const titleFontSzie = (this.$refs.rankRef.offsetWidth / 100) * 3.6;

            const adapterOption = {
                title: {
                    textStyle: {
                        fontSize: (titleFontSzie / 3.6) * 1.5,
                    },
                },
                series: [
                    {
                        barWidth: titleFontSzie,
                        itemStyle: {
                            barBorderRadius: [titleFontSzie / 2, titleFontSzie / 2, 0, 0],
                        },
                    },
                ],
            };
            this.chartInstance.setOption(adapterOption);
            this.chartInstance.resize();
        },
        // 改变柱形图 区域缩放起始与终点值的函数
        startInterval() {
            // 如果存在则关闭
            this.timerId && clearInterval(this.timerId);

            this.timerId = setInterval(() => {
                this.startValue++;
                this.endValue++;
                if (this.endValue > this.allData.length - 1) {
                    this.startValue = 0;
                    this.endValue = 9;
                }
                this.updateChart();
            }, 2000);
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
