<template>
    <div class="com-page">
        <single-map></single-map>
    </div>
</template>

<script>
import Map from "components/Map";

export default {
    name: "MapPage",
    components: {
        "single-map": Map
    }
};
</script>

<style lang="less" scoped></style>
