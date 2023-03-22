<template>
  <div class="com-page">
    <single-map></single-map>
  </div>
</template>

<script>
import Map from "components/report/Map"

export default {
  // 商家地图分布图表
  name: 'MapPage',
  components:{
    'single-map':Map,
  }
}
</script>

<style lang="less" scoped>

</style>