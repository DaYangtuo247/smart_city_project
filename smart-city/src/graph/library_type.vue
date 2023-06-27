<template>
    <div class="dropdown">
        <div class="title" >
            {{ tit }}
        </div>
    </div>
    <div ref="typeRef" style="width: 388px; height: 500px"></div>
</template>

<script>
import { markRaw } from "vue";
export default {
    data() {
        return {
            // 图表的实例对象
            chartInstance: null,
            // 从服务器中获取的所有数据
            allData: null,
            url: "/图书馆图书分类.json",
            tit: "▎图书分类",
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
            // 使用默认主题初始化echarts实例
            this.chartInstance = markRaw(this.$echarts.init(this.$refs.typeRef, "default"));
            const initOption = {
                series: [
                    {
                        type: "sunburst",
                        center: ["50%", "50%"],
                        radius: "60%", // 减小半径的百分比值
                        sort: function (a, b) {
                            if (a.depth === 1) {
                                return b.getValue() - a.getValue();
                            } else {
                                return a.dataIndex - b.dataIndex;
                            }
                        },
                        label: {
                            rotate: "radial",
                        },
                        itemStyle: {
                            borderWidth: 2,
                        },
                        levels: [
                            {},
                            {
                                r0: 0,
                                r: "25%", // 减小半径的百分比值
                                label: {
                                    rotate: 0,
                                },
                            },
                            {
                                r0: "25%", // 减小半径的百分比值
                                r: "50%", // 减小半径的百分比值
                            },
                            {
                                r0: "50%", // 减小半径的百分比值
                                r: "60%", // 减小半径的百分比值
                                itemStyle: {
                                    shadowBlur: 2,
                                },
                                label: {
                                    rotate: "tangential",
                                    fontSize: 10,
                                },
                            },
                            {
                                r0: "60%", // 减小半径的百分比值
                                r: "61%", // 减小半径的百分比值
                                itemStyle: {
                                    shadowBlur: 80,
                                },
                                label: {
                                    position: "outside",
                                    textShadowBlur: 5,
                                },
                                downplay: {
                                    label: {
                                        opacity: 0.5,
                                    },
                                },
                            },
                        ],
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
            this.updateChart();
        },

        // 更新图表配置项
        updateChart() {
            let data = this.allData;

            for (let j = 0; j < data.length; ++j) {
                let level1 = data[j].children;
                for (let i = 0; i < level1.length; ++i) {
                    let block = level1[i].children;
                    let bookScore = [];
                    let bookScoreId;
                    for (let star = 0; star < block.length; ++star) {
                        if (block[star].children) {
                            block[star].children.forEach(function (book) {
                                book.value = 1;

                                let value = 1;
                                if (bookScoreId === 0 || bookScoreId === 3) {
                                    value = 5;
                                }

                                if (bookScore[bookScoreId]) {
                                    bookScore[bookScoreId].value += value;
                                } else {
                                    bookScore[bookScoreId] = {
                                        value: value,
                                    };
                                }
                            });
                        }
                    }
                }
            }

            const dataOption = {
                series: [{ data: data }],
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
