<template>
    <div class="right-graph" v-show="show_library || show_gongdi || show_wuhan">
        <div v-show="show_library">
            <library_type></library_type>
            <library_notice></library_notice>
        </div>
        <div v-show="show_gongdi">
            <gongdi_sandian></gongdi_sandian>
            <gongdi_loudou></gongdi_loudou>
            <gongdi_qiantao></gongdi_qiantao>
        </div>
        <div v-show="show_wuhan">
            <wuhan_pointandline></wuhan_pointandline>
            <wuhan_transform></wuhan_transform>
            <wuhan_leida></wuhan_leida>
        </div>
    </div>
</template>

<script>
import library_type from "graph/library_type.vue";
import library_notice from "graph/library_notice.vue";

import gongdi_analyse from "graph/gongdi_analyse.vue";
import gongdi_qushi from "graph/gongdi_qushi.vue";
import gongdi_sandian from "graph/gongdi_sandian.vue";
import gongdi_loudou from "graph/gongdi_loudou.vue";
import gongdi_qiantao from "graph/gongdi_qiantao.vue";

import wuhan_pointandline from "graph/wuhan_pointandline.vue";
import wuhan_transform from "graph/wuhan_transform.vue";
import wuhan_leida from "graph/wuhan_leida.vue";
export default {
    components: {
        // library_analyse,
        // library_trend,
        library_type,
        library_notice,
        gongdi_analyse,
        gongdi_qushi,
        gongdi_sandian,
        gongdi_loudou,
        gongdi_qiantao,

        wuhan_pointandline,
        wuhan_transform,
        wuhan_leida,
    },
    data() {
        return {
            show_library: false,
            show_gongdi: false,
            show_wuhan: false,
        };
    },
    mounted() {
        let eventBus = this.$eventBus;
        this.$eventBus.on("show-library-graph-lr", url => {
            this.show_library = !this.show_library;
            eventBus.emit("show-library-data-r", this.show_library);
        });
        this.$eventBus.on("show-gongdi-graph-lr", url => {
            this.show_gongdi = !this.show_gongdi;
            eventBus.emit("show-gongdi-data-r", this.show_gongdi);
        });
        this.$eventBus.on("show-wuhan-graph-lr", url => {
            this.show_wuhan = !this.show_wuhan;
            eventBus.emit("show-wuhan-data-r", this.show_wuhan);
        });
    },
};
</script>
