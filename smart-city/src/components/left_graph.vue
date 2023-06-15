<template>
    <div class="left-graph" ref="left_graph" :style="{ display: 'none' }">
        <libModel></libModel>
        <library_trend></library_trend>
    </div>
</template>

<script>
import library_trend from "graphData/library_trend.vue";
import libModel from "graphData/libModel.vue";
export default {
    components: {
        library_trend,
        libModel,
    },
    data() {
        return {};
    },
};
</script>

<style></style>
