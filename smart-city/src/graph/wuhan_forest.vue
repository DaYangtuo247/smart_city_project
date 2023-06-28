<template>
    <div class="dropdown">
        <div class="title" @click="toggleDropdown">
            {{ tit }}
        </div>
    </div>
    <div ref="forestRef" style="width: 388px; height: 280px"></div>
</template>

<script>
import * as echarts from 'echarts';
export default {
    name: "forest",
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
            tit: "▎武汉人工绿化数据分析与预测",
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
            const treeDataURI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAA2CAYAAADUOvnEAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA5tJREFUeNrcWE1oE0EUnp0kbWyUpCiNYEpCFSpIMdpLRTD15s2ePHixnj00N4/GoyfTg2fbiwdvvagHC1UQ66GQUIQKKgn1UAqSSFua38b3prPJZDs7s5ufKn0w7CaZ2W/fe9/73kyMRqNB3Nrj1zdn4RJ6du9T2u1a2iHYSxjP4d41oOHGQwAIwSUHIyh8/RA8XeiXh0kLGFoaXiTecw/hoTG4ZCSAaFkY0+BpsZceLtiAoV2FkepZSDk5EpppczBvpuuQCqx0YnkYcVVoqQYMyeCG+lFdaGkXeVOFNu4aEBalOBk6sbQrQF7gSdK5JXjuHXuYVIVyr0TZ0FjKDeCs6km7JYMUdrWAUVmZUBtmRnVPK+x6nIR2xomH06R35ggwJPeofWphr/W5UjPIxq8B2bKgE8C4HVHWvg+2gZjXj19PkdFztY7bk9TDCH/g6oafDPpaoMvZIRI5WyMB/0Hv++HkpTKE0kM+A+h20cPAfN4GuRyp9G+LMTW+z8rCLI8b46XO9zRcYZTde/j0AZm8WGb3Y2F9KLlE2nqYkjFLJAsDOl/lea0q55mqxXcL7YBc++bsCPMe8mUyU2ZIpnCoblca6TZA/ga2Co8PGg7UGUlEDd0ueptglbrRZLLE7poti6pCaWUo2pu1oaYI1CF9b9cCZPO3F8ikJQ/rPpQT5YETht26ss+uCIL2Y8vHwJGpA96GI5mjOlaKhowUy6BcNcgIhDviTGWCGFaqEuufWz4pgcbCh+w0gEOyOjTlTtYYlIWPYWKEsLDzOs+nhzaO1KEpd+MXpOoTUgKiNyhdy5aSMPNVqxtSsJFgza5EWA4zKtCJ2OGbLn0JSLu8+SL4G86p1Fpr7ABXdGFF/UTD4rfmFYFw4G9VAJ9SM3aF8l3yok4/J6IV9sDVb36ynmtJ2M5+CwxTYBdKNMBaocKGV2nYgkz6r+cHBP30MzAfi4Sy+BebSoPIOi8PW1PpCCvr/KOD4k9Zu0WSH0Y0+SxJ2awp/nlwKtcGyHOJ8vNHtRJzhPlsHr8MogtlVtwUU0tSM1x58upSKbfJnSKUR07GVMKkDNfXpzpv0RTHy3nZMVx5IOWdZIaPabGFvfpwpjnvfmJHXLaEvZUTseu/TeLc+xgAPhEAb/PbjO6PBaOTf6LQRh/dERde23zxLtOXbaKNhfq2L/1fAOPHDUhOpIf5485h7l+GNHHiSYPKE3Myz9sFxoJuAyazvwIMAItferha5LTqAAAAAElFTkSuQmCC';
            const beginYear = 2016;
            const endYear = 2050;
            const lineCount = 10;
            let my_chat = this.chartInstance;
            my_chat = this.$echarts.init(this.$refs.forestRef, "default");
            const initOption =  {
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                    type: 'none',
                    
                    },
                    position: ['10%', '10%'],
                    triggerOn : 'mousemove|click'
                },
            color: ['#e54035'],
            xAxis: {
                axisLine: { show: false },
                axisLabel: { show: false },
                axisTick: { show: false },
                splitLine: { show: false },
                name: beginYear + '',
                nameLocation: 'middle',
                nameGap: 40,
                nameTextStyle: {
                color: 'green',
                fontSize: 30,
                fontFamily: 'Arial'
                },
                min: -2800,
                max: 2800
            },
            yAxis: {
                data: makeCategoryData(),
                show: false
            },
            grid: {
                top: 'center',
                height: 100
            },
            series: [
                {
                name: '人均绿地保有量',
                type: 'pictorialBar',
                symbol: 'image://' + treeDataURI,
                symbolSize: [30, 55],
                symbolRepeat: true,
                data: makeSeriesData(beginYear),
                animationEasing: 'elasticOut'
                },
                {
                name: 'all',
                type: 'pictorialBar',
                symbol: 'image://' + treeDataURI,
                symbolSize: [30, 55],
                symbolRepeat: true,
                data: makeSeriesData(beginYear, true),
                animationEasing: 'elasticOut'
                }
            ]
            };
            function makeCategoryData() {
            var categoryData = [];
            for (var i = 0; i < lineCount; i++) {
                categoryData.push(i + 'a');
            }
            return categoryData;
            }
            function makeSeriesData(year, negative) {
            // make a fake value just for demo.
            const r = (year - beginYear + 1) * 10;
            const seriesData = [];
            for (let i = 0; i < lineCount; i++) {
                let sign = negative ? -1 * (i % 3 ? 0.9 : 1) : 1 * ((i + 1) % 3 ? 0.9 : 1);
                seriesData.push({
                value:
                    sign *
                    (year <= beginYear + 1
                    ? Math.abs(i - lineCount / 2 + 0.5) < lineCount / 5
                        ? 5
                        : 0
                    : (lineCount - Math.abs(i - lineCount / 2 + 0.5)) * r),
                symbolOffset: i % 2 ? ['50%', 0] : undefined
                });
            }
            return seriesData;
            }
            // Set dynamic data.
            var currentYear = beginYear;
            setInterval(function () {
            currentYear++;
            if (currentYear > endYear) {
                currentYear = beginYear;
            }
            my_chat.setOption({
                xAxis: {
                name: currentYear
                },
                series: [
                {
                    data: makeSeriesData(currentYear)
                },
                {
                    data: makeSeriesData(currentYear, true)
                }
                ]
            });
            }, 800);
            console.log("wuhan_move over");
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
