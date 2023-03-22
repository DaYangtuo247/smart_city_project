<template>
  <div class="com-container">
    <div class="title" @click="showMenu = !showMenu" :style="comStyle">
      <span class="before-icon">▎</span>
      <span>{{ showTitle }}</span>
      <span class="iconfont title-icon" :style="comStyle">&#xe6eb;</span>
      <div class="select-con">
        <div class="select-item" v-show="showMenu" @click.prevent="handleSelect(item.key)" v-for="item in selectTypes" :key="item.key">
          {{ item.text }}
        </div>
      </div>
    </div>
    <div class="com-chart" ref="trendRef"></div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { getThemeValue } from 'utils/theme_utils'

export default {
  // 地区销量趋势
  name: 'Trend',
  data() {
    return {
      // 图表的实例对象
      chartInstance: null,
      // 从服务器中获取的所有数据
      allData: null,
      // 是否显示可选项
      showMenu: false,
      // 默认显示的数据类型
      activeName: 'map',
      // 指明标题的字体大小
      titleFontSize: 0,
      value: ''
    }
  },
  created() {
    // 在组件创建完成之后，进行回调函数的注册
    // this.$socket.registerCallBack('trendData', this.getData)
  },
  computed: {
    ...mapState(['theme']),
    // 点击过后需要显示的数组
    selectTypes() {
      if (!this.allData) return []
      // 过度掉当前选中的 类别
      return this.allData.type.filter(item => item.key !== this.activeName)
    },
    // 显示的标题
    showTitle() {
      if (!this.allData) return ''
      return this.allData[this.activeName].title
    },
    // 设置给标题的样式
    comStyle() {
      return {
        fontSize: this.titleFontSize + 'px',
        color: getThemeValue(this.theme).titleColor
      }
    }
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
    }
  },
  mounted() {
    this.initChart()
    this.getData()
    // websocket 请求数据
    // this.$socket.send({
    //   action: 'getData',
    //   socketType: 'trendData',
    //   chartName: 'trend',
    //   value: ''
    // })
    window.addEventListener('resize', this.screenAdapter)
    // 主动触发 响应式配置
    this.screenAdapter()
  },
  destroyed() {
    window.removeEventListener('resize', this.screenAdapter)
    // 销毁注册的事件
    this.$socket.unRegisterCallBack('trendData')
  },
  methods: {
    // 初始化图表的方法
    initChart() {
      this.chartInstance = this.$echarts.init(this.$refs.trendRef, this.theme)
      const initOption = {
        grid: {
          left: '3%',
          top: '35%',
          right: '4%',
          bottom: '1%',
          // 把x轴和y轴纳入 grid
          containLabel: true
        },
        // 工具提示
        tooltip: {
          // 当鼠标移入坐标轴的显示提示
          trigger: 'axis'
        },
        legend: {
          left: 'center',
          top: '18%',
          // 图例的icon类型
          icon: 'circle'
        },
        xAxis: {
          type: 'category',
          // 紧挨边缘
          boundaryGap: false
        },
        yAxis: {
          type: 'value'
        }
      }
      this.chartInstance.setOption(initOption)
    },
    // 发送请求，获取数据  //websocket： realData 服务端发送给客户端需要的数据
    async getData() {
      const { data: res } = await this.$http.get('/trend')
      this.allData = res

      this.updateChart()
    },
    // 更新图表配置项
    updateChart() {
      // 半透明的颜色值
      const colorArr1 = ['rgba(11, 168, 44, 0.5)', 'rgba(44, 110, 255, 0.5)', 'rgba(22, 242, 217, 0.5)', 'rgba(254, 33, 30, 0.5)', 'rgba(250, 105, 0, 0.5)']
      // 全透明的颜色值
      const colorArr2 = ['rgba(11, 168, 44, 0)', 'rgba(44, 110, 255, 0)', 'rgba(22, 242, 217, 0)', 'rgba(254, 33, 30, 0)', 'rgba(250, 105, 0, 0)']

      // x轴数据
      const month = this.allData.common.month
      // y轴数据 series下的数据
      const valueArr = this.allData[this.activeName].data

      const seriesArr = valueArr.map((item, index) => {
        return {
          // 图例的数据需要和series的name匹配
          name: item.name,
          type: 'line',
          data: item.data,
          // 同个类目轴上系列配置相同的stack值后，后一个系列的值会在前一个系列的值上相加。
          stack: this.activeName,
          // 区域填充样式。
          areaStyle: {
            color: new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
              // 0% 颜色
              {
                offset: 0,
                color: colorArr1[index]
              },
              // 100% 颜色
              {
                offset: 1,
                color: colorArr2[index]
              }
            ])
          }
        }
      })
      // 准备图例的数据
      const legendArr = valueArr.map(item => item.name)

      const dataOption = {
        xAxis: {
          data: month
        },
        legend: {
          data: legendArr
        },
        series: seriesArr
      }
      this.chartInstance.setOption(dataOption)
    },
    // 不同分辨率的响应式
    screenAdapter() {
      // 测试算出来的 合适的字体大小
      this.titleFontSize = (this.$refs.trendRef.offsetWidth / 100) * 3.6

      const adapterOption = {
        legend: {
          itemWidth: this.titleFontSize,
          itemHeight: this.titleFontSize,
          // 间距
          itemGap: this.titleFontSize,
          textStyle: {
            fontSize: this.titleFontSize / 1.3
          }
        }
      }
      this.chartInstance.setOption(adapterOption)
      this.chartInstance.resize()
    },
    // 当前选中的类型
    handleSelect(currentType) {
      this.activeName = currentType
      this.updateChart()
    }
  }
}
</script>

<style lang="less" scoped>
.title {
  position: absolute;
  left: 50px;
  top: 20px;
  z-index: 999;
  color: white;
  cursor: pointer;

  .before-icon {
    position: absolute;
    left: -20px;
  }
  .title-icon {
    margin-left: 10px;
  }
}
</style>
