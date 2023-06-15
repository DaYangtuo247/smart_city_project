<template>
    <div class="left-graph" v-show="show_libary">
        <div class="libary" v-show="show_libary">
            <libModel></libModel>
            <library_trend></library_trend>
        </div>
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
        return {
            show_libary: false,
        };
    },
    mounted() {
        let eventBus = this.$eventBus;
        this.$eventBus.on("show-libary-graph", url => {
            this.show_libary = !this.show_libary;
            eventBus.emit("show-libary-data", this.show_libary);
        });
    },
};
</script>

<style></style>
