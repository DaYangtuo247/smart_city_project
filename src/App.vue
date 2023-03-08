<template>
  <scene />
</template>

<script>
import Scene from "./components/Scene_City.vue";

export default {
  name: "App",
  components: {
    Scene,
  },
};
</script>

<style>
html,
body {
  margin: 0%;
}
/* 隐藏高德地图左下角图标 */
.amap-logo,
.amap-copyright {
  display: none !important;
}
</style>
