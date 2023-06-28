<template>
    <div class="right-graph" v-show="show_wuhan">
        <div class="library" v-show="show_wuhan">
            <!-- <library_model></library_model> -->
            <!-- <library_analyse></library_analyse>
            <library_trend></library_trend>
            <library_rank></library_rank> -->
            <!-- <gongdi_sandian></gongdi_sandian>
            <gongdi_loudou></gongdi_loudou>
            <gongdi_qiantao></gongdi_qiantao> -->
            <wuhan_pointandline></wuhan_pointandline>
            <wuhan_transform></wuhan_transform>
            <wuhan_leida></wuhan_leida>
        </div>
    </div>
</template>

<script>
// import library_trend from "graph/library_trend.vue";
// import library_analyse from "graph/library_analyse.vue";
// import library_trend from "graph/library_trend.vue";
// import library_rank from "../graph/library_rank.vue";
// import library_type from "graph/library_type.vue";
// import library_model from "graph/library_model.vue";
import gongdi_analyse from '../graph/gongdi_analyse.vue';
import gongdi_qushi from '../graph/gongdi_qushi.vue';
import gongdi_sandian from '../graph/gongdi_sandian.vue';
import gongdi_loudou from '../graph/gongdi_loudou.vue';
import gongdi_qiantao from '../graph/gongdi_qiantao.vue';
import wuhan_pointandline from '../graph/wuhan_pointandline.vue';
import wuhan_transform from '../graph/wuhan_transform.vue';
import wuhan_leida from '../graph/wuhan_leida.vue';
export default {
    components: {
        // library_model,
        // // library_trend,
        // library_type,
        // library_analyse,
        // library_trend,
        // library_rank,
        gongdi_analyse,
        gongdi_qushi,
        gongdi_sandian,
        gongdi_loudou,
        gongdi_qiantao,
        wuhan_pointandline,
        wuhan_transform,
        wuhan_leida
    },
    data() {
        return {
            show_wuhan: false,
        };
    },
    mounted() {
        let eventBus = this.$eventBus;
        this.$eventBus.on("show-wuhan-graph-lr", url => {
            this.show_wuhan = !this.show_wuhan;
            eventBus.emit("show-wuhan-data-r", this.show_wuhan);
        });
    },
};
</script>