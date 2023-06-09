<template>
  <div class="com-container">
    <!-- <div class="com-chart" ref="rankRef"></div> -->
    <iframe src="http://localhost:5173/" frameborder="0" class="aibox"></iframe>
  </div>
</template>

<script>
// import { mapState } from 'vuex'

// export default {
//   // 地区GDP排行
//   name: 'Rank',
//   data() {
//     return {
//       // 图表的实例对象
//       chartInstance: null,
//       // 从服务器中获取的所有数据
//       allData: null,
//       // 柱形图 区域缩放起点值
//       startValue: 0,
//       // 柱形图结 区域缩放终点值
//       endValue: 9,
//       // 定时器
//       timerId: null
//     }
//   },
//   created() {
//     // this.$socket.registerCallBack('rankData', this.getData)
//   },
//   computed: {
//     ...mapState(['theme'])
//   },
//   watch: {
//     theme() {
//       // 销毁当前的图表
//       this.chartInstance.dispose()
//       // 以最新主题初始化图表对象
//       this.initChart()
//       // 屏幕适配
//       this.screenAdapter()
//       // 渲染数据
//       this.updateChart()
//     }
//   },
//   mounted() {
//     this.initChart()
//     this.getData()
//     // this.$socket.send({
//     //   action: 'getData',
//     //   socketType: 'rankData',
//     //   chartName: 'rank',
//     //   value: ''
//     // })
//     window.addEventListener('resize', this.screenAdapter)
//     // 主动触发 响应式配置
//     this.screenAdapter()
//   },
//   destroyed() {
//     window.removeEventListener('resize', this.screenAdapter)
//     clearInterval(this.timerId)
//     // this.$socket.unRegisterCallBack('rankData')
//   },
//   methods: {
//     // 初始化图表的方法
//     initChart() {
//       this.chartInstance = this.$echarts.init(this.$refs.rankRef, this.theme)

//       const initOption = {
//         title: {
//           text: '▎地区GDP排行',
//           left: 20,
//           top: 20
//         },
//         grid: {
//           top: '40%',
//           left: '5%',
//           right: '5%',
//           bottom: '5%',
//           // 把x轴和y轴纳入 grid
//           containLabel: true
//         },
//         tooltip: {
//           show: true
//         },
//         xAxis: {
//           type: 'category'
//         },
//         yAxis: {
//           value: 'value'
//         },
//         series: [
//           {
//             type: 'bar',
//             label: {
//               show: true,
//               position: 'top',
//               color: 'white',
//               rotate: 30
//             }
//           }
//         ]
//       }
//       this.chartInstance.setOption(initOption)

//       // 鼠标经过关闭 动画效果
//       this.chartInstance.on('mouseover', () => {
//         clearInterval(this.timerId)
//       })
//       // 鼠标离开 开启动画效果
//       this.chartInstance.on('mouseout', () => {
//         this.startInterval()
//       })
//     },
//     // 发送请求，获取数据
//     async getData() {
//       const { data: res } = await this.$http.get('/rank')
//       this.allData = res
//       // 对数据进行排序(大到小)
//       this.allData.sort((a, b) => b.value - a.value)

//       this.updateChart()
//       // 开始自动切换
//       this.startInterval()
//     },
//     // 更新图表配置项
//     updateChart() {
//       // 渐变色数组
//       const colorArr = [
//         ['#0BA82C', '#4FF778'],
//         ['#2E72BF', '#23E5E5'],
//         ['#5052EE', '#AB6EE5']
//       ]
//       // const colorArr = [
//       //   ['#b8e994', '#079992'],
//       //   ['#82ccdd', '#0a3d62'],
//       //   ['#f8c291', '#b71540'],
//       // ]
//       // 所有省份组成的数组
//       const provinceInfo = this.allData.map(item => item.name)
//       // 所有省份对应的销售金额
//       const valueArr = this.allData.map(item => item.value)

//       const dataOption = {
//         xAxis: {
//           data: provinceInfo
//         },
//         dataZoom: {
//           // 区域缩放组件
//           show: false,
//           startValue: this.startValue,
//           endValue: this.endValue
//         },
//         series: [
//           {
//             data: valueArr,
//             itemStyle: {
//               color: arg => {
//                 let targetColorArr = null

//                 if (arg.value > 1500) {
//                   targetColorArr = colorArr[0]
//                 } else if (arg.value > 1000) {
//                   targetColorArr = colorArr[1]
//                 } else {
//                   targetColorArr = colorArr[2]
//                 }

//                 return new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
//                   // 0%
//                   { offset: 0, color: targetColorArr[0] },
//                   // 100%
//                   { offset: 1, color: targetColorArr[1] }
//                 ])
//               }
//             }
//           }
//         ]
//       }
//       this.chartInstance.setOption(dataOption)
//     },
//     // 根据图标容器的宽度 计算各属性、标签、元素的大小
//     screenAdapter() {
//       const titleFontSzie = (this.$refs.rankRef.offsetWidth / 100) * 3.6

//       const adapterOption = {
//         title: {
//           textStyle: {
//             fontSize: titleFontSzie / 3.6 * 1.5
//           }
//         },
//         series: [
//           {
//             barWidth: titleFontSzie,
//             itemStyle: {
//               barBorderRadius: [titleFontSzie / 2, titleFontSzie / 2, 0, 0]
//             }
//           }
//         ]
//       }
//       this.chartInstance.setOption(adapterOption)
//       this.chartInstance.resize()
//     },
//     // 改变柱形图 区域缩放起始与终点值的函数
//     startInterval() {
//       // 如果存在则关闭
//       this.timerId && clearInterval(this.timerId)

//       this.timerId = setInterval(() => {
//         this.startValue++
//         this.endValue++
//         if (this.endValue > this.allData.length - 1) {
//           this.startValue = 0
//           this.endValue = 9
//         }
//         this.updateChart()
//       }, 2000)
//     }
//   }
// }
</script>

<style lang="less" scoped></style>
<style>
.aibox{
    width: 100%;
    height: 100%;
    background-color: #222733;
}
</style>
