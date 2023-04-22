<template>
  <div class="com-container">
    <div class="com-chart" ref="stockRef"></div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import EventBus from '@/event-bus';

export default {
  // 城市空气质量分析
  name: 'Stock',
  data() {
    return {
      // 图表的实例对象
      chartInstance: null,
      // 从服务器中获取的所有数据
      allData: null,
      // 当前显示数据的页数
      currentIndex: 1,
      // 定时器标识
      timerId: null,
      // 圆环坐标
      centerArr: [
        ['18%', '40%'],
        ['50%', '40%'],
        ['82%', '40%'],
        ['34%', '75%'],
        ['66%', '75%'],
      ],
      // 圆环渐变色
      colorArr: [
        ['#4FF778', '#0BA82C'],
        ['#E5DD45', '#E8B11C'],
        ['#E8821C', '#E55445'],
        ['#5052EE', '#AB6EE5'],
        ['#23E5E5', '#2E72BF'],
      ],
      url: '/stock',
      tit: '▎城市空气质量分析',
    }
  },
  created() {
    // this.$socket.registerCallBack('stockData', this.getData)
  },
  computed: {
    ...mapState(['theme']),
  },
  watch: {
    theme() {
      // 销毁当前的图表
      this.chartInstance.dispose()
      // 以最新主题初始化图表对象
      this.initChart()
      // 屏幕适配
      this.screenAdapter()
      // 渲染数据
      this.updateChart()
    },
  },
  mounted() {
    this.initChart()
    this.getData()
    // this.$socket.send({
    //   action: 'getData',
    //   socketType: 'stockData',
    //   chartName: 'stock',
    //   value: '',
    // })
    EventBus.$on('change-data-url-huan', (url) => {
      if (this.url === url) 
      {
        this.url = '/stock';
        this.tit = '▎城市空气质量分析';
      }
      else 
      {
        this.url = url;
        this.tit = '▎图书馆使用量分析'
      }
      this.getData();
    });
    EventBus.$on('change-data-url-m-sk', (url) => {
      if (this.url === url) 
      {
        this.url = '/stock';
        this.tit = '▎城市空气质量分析';
      }
      else 
      {
        this.url = url;
        this.tit = '▎商场收入分析'
      }
      this.getData();
    });
    EventBus.$on('change-data-url-traffic-huan', (url) => {
      if (this.url === url) 
      {
        this.url = '/stock';
        this.tit = '▎城市空气质量分析';
      }
      else 
      {
        this.url = url;
        this.tit = '▎交通枢纽运力冗余分析'
      }
      this.getData();
    });
    window.addEventListener('resize', this.screenAdapter)
    // 主动触发 响应式配置
    this.screenAdapter()
  },
  destroyed() {
    window.removeEventListener('resize', this.screenAdapter)
    clearInterval(this.timerId)
    // this.$socket.unRegisterCallBack('stockData')
  },
  methods: {
    // 初始化图表的方法
    initChart() {
      this.chartInstance = this.$echarts.init(this.$refs.stockRef, this.theme)
      const initOption = {
        title: {
          text: this.tit,
          left: 20,
          top: 20,
        },
      }
      this.chartInstance.setOption(initOption)

      this.chartInstance.on('mouseover', () => {
        clearInterval(this.timerId)
      })
      this.chartInstance.on('mouseout', this.startInterval)
    },
    // 发送请求，获取数据
    async getData() {
      // 销毁原表
      this.chartInstance.dispose();
      // 初始化表格
      this.initChart();
      // 检测分辨率，如果触发前后窗口大小不变可不进行
      this.screenAdapter()
      const { data: res } = await this.$http.get(this.url)
      this.allData = res

      this.updateChart()
    },
    // 更新图表配置项
    updateChart() {
      // 需要显示的原始数据   包含0，不好含5
      const start = (this.currentIndex - 1) * 5
      const end = start + 5
      const showData = this.allData.slice(start, end)
      // 真实显示的数据
      let seriesArr = showData.map((item, index) => {
        return {
          type: 'pie',
          // 设置成圆环图，外圆半径，内圆半径 在响应式处指定
          // radius: [120, 100],

          // 饼图的位置
          center: this.centerArr[index],
          // 关闭鼠标移入到饼图的动画效果
          hoverAnimation: false,
          // 隐藏指示线条
          labelLine: {
            show: false,
          },
          label: {
            position: 'center',
            color: this.colorArr[index][0],
          },
          data: [
            // 销量
            {
              name: item.name + '\n\n' + item.sales,
              value: item.sales,
              itemStyle: {
                // 创建线性渐变的颜色 从下往上
                color: new this.$echarts.graphic.LinearGradient(0, 1, 0, 0, [
                  // 0%
                  { offset: 0, color: this.colorArr[index][0] },
                  // 100%
                  { offset: 1, color: this.colorArr[index][1] },
                ]),
              },
              // 内部的提示框 c数值 d百分比
              tooltip: {
                formatter: `${item.name} <br/>含量：{c} <br/>占比：{d}%`,
              },
            },
            // 库存
            {
              value: item.stock,
              itemStyle: {
                color: '#bbb',
              },
              // 内部的提示框
              // tooltip: {
              //   formatter: `${item.name} <br/>总量：{c} <br>占比：{d}%`,
              // },
              tooltip: {
                formatter: `总量：{c}`,
              },
            },
          ],
        }
      })

      const dataOption = {
        tooltip: {
          // 这里为item 可以为内部的数据开启 单独的 tooltip
          trigger: 'item',
        },
        series: seriesArr,
      }
      this.chartInstance.setOption(dataOption)

      // 开启定时切换
      this.startInterval()
    },
    // 不同分辨率的响应式
    screenAdapter() {
      const titleFontSize = (this.$refs.stockRef.offsetWidth / 100) * 3.6
      // 圆的内院半径和 外圆半径
      const innerRadius = titleFontSize * 2.8
      const outerRadius = innerRadius * 1.2

      const adapterOption = {
        title: {
          textStyle: {
            fontSize: titleFontSize * 1.2,
          },
        },
        series: [
          {
            type: 'pie',
            radius: [outerRadius, innerRadius],
            label: {
              fontSize: titleFontSize / 1.2,
            },
          },
          {
            type: 'pie',
            radius: [outerRadius, innerRadius],
            label: {
              fontSize: titleFontSize / 1.2,
            },
          },
          {
            type: 'pie',
            radius: [outerRadius, innerRadius],
            label: {
              fontSize: titleFontSize / 1.2,
            },
          },
          {
            type: 'pie',
            radius: [outerRadius, innerRadius],
            label: {
              fontSize: titleFontSize / 1.2,
            },
          },
          {
            type: 'pie',
            radius: [outerRadius, innerRadius],
            label: {
              fontSize: titleFontSize / 1.2,
            },
          },
        ],
      }
      this.chartInstance.setOption(adapterOption)
      this.chartInstance.resize()
    },
    // 定时器不断切换当前页数
    startInterval() {
      this.timerId && clearInterval(this.timerId)

      this.timerId = setInterval(() => {
        this.currentIndex++
        if (this.currentIndex > 2) this.currentIndex = 1
        // 在更新完数据后，需要更新页面
        this.updateChart()
      }, 5000)
    },
  },
}
</script>

<style lang="less" scoped>
</style>