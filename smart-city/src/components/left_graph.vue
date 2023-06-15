<template>
    <div class="left-graph" v-show="showMenu">
        <div class="libary">
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
            showMenu: false,
        };
    },
    mounted() {
        let eventBus = this.$eventBus;
        this.$eventBus.on("libary-data", url => {
            this.showMenu = !this.showMenu;
            eventBus.emit("show-libary-data", this.showMenu);
        });
    },
};
</script>

<style></style>
