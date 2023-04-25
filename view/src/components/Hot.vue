<template>
  <div class="com-container">
    <div class="com-chart" ref="hotRef"></div>
    <i class="iconfont icon-left" @click="toLeft" :style="themeStyle">&#xe6ef;</i>
    <i class="iconfont icon-right" @click="toRight" :style="themeStyle">&#xe6ed;</i>
    <span class="cate-name" :style="themeStyle">{{ cateName }}</span>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { getThemeValue } from 'utils/theme_utils'
import _ from 'lodash'
import EventBus from '@/event-bus';

export default {
  name: 'Hot',
  data() {
    return {
      // 图表的实例对象
      chartInstance: null,
      // 从服务器中获取的所有数据
      allData: null,
      // 当前显示的一级分类数据类型
      currentIndex: 0,
      // 字体响应式大小
      titleFontSize: null,
      url: '/hotproduct',
      tit: '▎城市交通运力分析'
    }
  },
  created() {
    // this.$socket.registerCallBack('hotData', this.getData)
    // this.getData()
  },
  computed: {
    ...mapState(['theme']),
    cateName() {
      if (!this.allData) return ''
      return this.allData[this.currentIndex].name
    },
    themeStyle() {
      if (!this.titleFontSize) {
        return { color: getThemeValue(this.theme).titleColor }
      }
      return {
        fontSize: this.titleFontSize + 'px',
        color: getThemeValue(this.theme).titleColor,
      }
    },
  },
  watch: {
    theme() {
      // 销毁当前的图表
      if(this.chartInstance != null){
          this.chartInstance.dispose();
      }
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
    EventBus.$on('change-data-url-p-c', (url) => {
      if (this.url === url) 
      {
        this.url = '/hotproduct';
        this.tit = '▎城市交通运力分析';
      }
      else 
      {
        this.url = url;
        this.tit = '▎图书馆数据分析';
      }
      this.getData();
    });
    EventBus.$on('change-data-url-chat', (url) => {
      if (this.url === url) 
      {
        this.url = '/hotproduct';
        this.tit = '▎城市交通运力分析';
      }
      else 
      {
        this.url = url;
        this.tit = '▎商场品牌数据分析';
      }
      this.getData();       
    });
    EventBus.$on('change-data-url-triffic-chat', (url) => {
      if (this.url === url) 
      {
        this.url = '/hotproduct';
        this.tit = '▎城市交通运力分析';
      }
      else 
      {
        this.url = url;
        this.tit = '▎交通枢纽事件分析';
      }
      this.getData();       
    });
    // this.$socket.send({
    //   action: 'getData',
    //   socketType: 'hotData',
    //   chartName: 'hotproduct',
    //   value: '',
    // })
    window.addEventListener('resize', this.screenAdapter)
    // 主动触发 响应式配置
    this.screenAdapter()
  },
  destroyed() {
    window.removeEventListener('resize', this.screenAdapter)
    // this.$socket.unRegisterCallBack('hotData')
  },
  methods: {
    // 初始化图表的方法
    initChart() {
      this.chartInstance = this.$echarts.init(this.$refs.hotRef, this.theme)

      const initOption = {
        title: {
          text: this.tit,
          left: 20,
          top: 20,
        },
        legend: {
          top: '15%',
          // 图标类型 圆形
          icon: 'circle',
        },
        tooltip: {
          show: true,
          // formatter:'hhh'
          formatter: arg => {
            // 拿到三级分类的数据
            const thirdCategory = arg.data.children
            // 计算所有三级分类的数值总和，才能计算出百分比
            let total = 0
            thirdCategory.forEach(item => {
              total += item.value
            })
            // 显示的文本
            let showStr = ''
            // 更改显示的文本为值而不是占比
            thirdCategory.forEach(item => {
              // ${item.name}：${_.round((item.value / total) * 100, 2)}% <br/>
              showStr += `
                ${item.name}：${_.round(item.value, 2)}
              `
            })
            return showStr
          },
        },
        series: [
          {
            type: 'pie',
            label: {
              show: true,
              formatter:`{b}{d}%`
            },
            // 高亮状态下的样式
            emphasis: {
              labelLine: {
                // 连接文字的线条
                show: true,
              },
            },
          },
        ],
      }
      this.chartInstance.setOption(initOption)
    },
    // 发送请求，获取数据
    async getData() {
      // 销毁原表
      if(this.chartInstance != null){
          this.chartInstance.dispose();
      }
      // 初始化表格
      this.initChart();
      // 检测分辨率，如果触发前后窗口大小不变可不进行
      this.screenAdapter()
      this.allData = null;
      const { data: res } = await this.$http.get(this.url)
      this.allData = res;
      // 更新数据
      this.updateChart()
    },
    // 更新图表配置项
    updateChart() {
      // 处理数据
      const legenDateArr = this.allData[this.currentIndex].children.map(item => item.name)
      const seriesDataArr = this.allData[this.currentIndex].children.map(item => {
        return {
          name: item.name,
          value: item.value,
          children: item.children,
        }
      })
      const dataOption = {
        legend: {
          data: legenDateArr,
        },
        series: [
          {
            data: seriesDataArr,
          },
        ],
      }
      this.chartInstance.setOption(dataOption)
    },
    // 不同分辨率的响应式
    screenAdapter() {
      this.titleFontSize = (this.$refs.hotRef.offsetWidth / 100) * 2.8

      const adapterOption = {
        title: {
          textStyle: {
            fontSize: this.titleFontSize * 1.6,
          },
        },
        legend: {
          itemWidth: this.titleFontSize,
          itemHeight: this.titleFontSize,
          // 图例的间隔
          itemGap: this.titleFontSize / 2,
          textStyle: {
            fontSize: this.titleFontSize / 0.8,
          },
        },
        series: [
          {
            // 饼图的大小 半径
            radius: this.titleFontSize * 5,
            // 控制饼图的位置 x,y
            center: ['50%', '60%'],
          },
        ],
      }
      this.chartInstance.setOption(adapterOption)
      this.chartInstance.resize()
    },
    // 点击左侧按钮
    toLeft() {
      this.currentIndex--
      // 已到达最左边
      if (this.currentIndex < 0) this.currentIndex = this.allData.length - 1
      this.updateChart()
    },
    // 点击右侧按钮
    toRight() {
      this.currentIndex++
      // 已到达最右边
      if (this.currentIndex > this.allData.length - 1) this.currentIndex = 0
      this.updateChart()
    },
  },
}
</script>

<style lang="less" scoped>
.com-container {
  i {
    z-index: 999;
    position: absolute;
    transform: translateY(-50%);
    top: 50%;
    cursor: pointer;
  }
  i.icon-left {
    left: 10%;
  }
  i.icon-right {
    right: 10%;
  }
  .cate-name {
    position: absolute;
    right: 10%;
    bottom: 20px;
    z-index: 999;
  }
}
</style>