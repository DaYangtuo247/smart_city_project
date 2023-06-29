<template>
    <div class="left-graph" v-show="show_library || show_gongdi || show_wuhan">
        <div v-show="show_library">
            <!-- <library_model></library_model> -->
            <library_analyse></library_analyse>
            <library_trend></library_trend>
            <library_rank></library_rank>
        </div>
        <div v-show="show_gongdi">
            <gongdi_rank></gongdi_rank>
            <gongdi_analyse></gongdi_analyse>
            <gongdi_qushi></gongdi_qushi>
        </div>
        <div v-show="show_wuhan">
            <wuhan_move></wuhan_move>
            <wuhan_forest></wuhan_forest>
            <wuhan_zhu></wuhan_zhu>
        </div>
    </div>
</template>

<script>
// import library_trend from "graph/library_trend.vue";
import library_analyse from "graph/library_analyse.vue";
import library_trend from "graph/library_trend.vue";
import library_rank from "graph/library_rank.vue";
import library_type from "graph/library_type.vue";
import library_model from "graph/library_model.vue";

import gongdi_rank from "graph/gongdi_rank.vue";
import gongdi_analyse from "graph/gongdi_analyse.vue";
import gongdi_qushi from "graph/gongdi_qushi.vue";

import wuhan_move from 'graph/wuhan_move.vue';
import wuhan_forest from 'graph/wuhan_forest.vue';
import wuhan_pointandline from 'graph/wuhan_pointandline.vue';
import wuhan_zhu from 'graph/wuhan_zhu.vue';
export default {
    components: {
        // library_model,
        // // library_trend,
        // library_type,
        library_analyse,
        library_trend,
        library_rank,

        gongdi_rank,
        gongdi_analyse,
        gongdi_qushi,


        wuhan_move,
        wuhan_forest,
        wuhan_pointandline,
        wuhan_zhu
    },
    data() {
        return {
            show_library: false,
            show_gongdi: false,
            show_wuhan:false
        };
    },
    mounted() {
        let eventBus = this.$eventBus;
        this.$eventBus.on("show-library-graph-lr", url => {
            this.show_library = !this.show_library;
            console.log("this.show_library");
            eventBus.emit("show-library-data-l", this.show_library);
        });
        this.$eventBus.on("show-gongdi-graph-lr", url => {
            this.show_gongdi = !this.show_gongdi;
            eventBus.emit("show-gongdi-data-l", this.show_gongdi);
        });
        this.$eventBus.on("show-wuhan-graph-lr", url => {
            this.show_wuhan = !this.show_wuhan;
            eventBus.emit("show-wuhan-data-l", this.show_wuhan);
        });
    },
};
</script>
