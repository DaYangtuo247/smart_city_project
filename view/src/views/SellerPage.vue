<template>
  <div class="com-page">
    <seller></seller>
  </div>
</template>

<script>
import Seller from "components/report/Seller";
export default {
  // Seller 商家销量
  name: "SellerPage",
  components: {
    seller: Seller,
  },
};
</script>

<style lang="less" scoped>
</style>