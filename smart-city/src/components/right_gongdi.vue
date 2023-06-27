<template>
    <div class="right-graph" v-show="show_gongdi">
        <div class="library" v-show="show_gongdi">
            <!-- <library_model></library_model> -->
            <!-- <library_analyse></library_analyse>
            <library_trend></library_trend>
            <library_rank></library_rank> -->
            <gongdi_sandian></gongdi_sandian>
            <gongdi_analyse></gongdi_analyse>
            <gongdi_qushi></gongdi_qushi>
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
import gongdi_rank from 'graph/gongdi_rank.vue';
import gongdi_analyse from '../graph/gongdi_analyse.vue';
import gongdi_qushi from '../graph/gongdi_qushi.vue';
import gongdi_sandian from '../graph/gongdi_sandian.vue';
export default {
    components: {
        // library_model,
        // // library_trend,
        // library_type,
        // library_analyse,
        // library_trend,
        // library_rank,
        gongdi_rank,
        gongdi_analyse,
        gongdi_qushi,
        gongdi_sandian
    },
    data() {
        return {
            show_gongdi: false,
        };
    },
    mounted() {
        let eventBus = this.$eventBus;
        this.$eventBus.on("show-gongdi-graph-lr", url => {
            this.show_gongdi = !this.show_gongdi;
            console.log("this.show_gongdi");
            eventBus.emit("show-gongdi-data-r", this.show_gongdi);
        });
    },
};
</script>