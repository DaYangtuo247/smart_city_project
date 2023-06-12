<template>
    <div class="echarts-box">
        <div id="main" :style="{ width: '450px', height: '400px' }"></div>
    </div>
</template>

<script>
export default {
    mounted() {
        var chartDom = document.getElementById("main");
        var myChart = this.$echarts.init(chartDom);
        const option = {
            color: ["#67F9D8", "#FFE434", "#56A3F1", "#FF917C"],
            title: {
                text: "title",
            },
            legend: {},
            radar: [
                {
                    indicator: [{ text: "Indicator1" }, { text: "Indicator2" }, { text: "Indicator3" }, { text: "Indicator4" }, { text: "Indicator5" }],
                    center: ["50%", "50%"],
                    radius: 120,
                    startAngle: 90,
                    splitNumber: 4,
                    shape: "circle",
                    axisName: {
                        formatter: "【{value}】",
                        color: "#428BD4",
                    },
                    splitArea: {
                        areaStyle: {
                            color: ["#77EADF", "#26C3BE", "#64AFE9", "#428BD4"],
                            shadowColor: "rgba(0, 0, 0, 0.2)",
                            shadowBlur: 10,
                        },
                    },
                    axisLine: {
                        lineStyle: {
                            color: "rgba(211, 253, 250, 0.8)",
                        },
                    },
                    splitLine: {
                        lineStyle: {
                            color: "rgba(211, 253, 250, 0.8)",
                        },
                    },
                },
            ],
            series: [
                {
                    type: "radar",
                    emphasis: {
                        lineStyle: {
                            width: 4,
                        },
                    },
                    data: [
                        {
                            value: [100, 8, 0.4, -80, 2000],
                            name: "Data A",
                        },
                        {
                            value: [60, 5, 0.3, -100, 1500],
                            name: "Data B",
                            areaStyle: {
                                color: "rgba(255, 228, 52, 0.6)",
                            },
                        },
                    ],
                },
            ],
        };
        myChart.setOption(option);
    },
};
</script>
