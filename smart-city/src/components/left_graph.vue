<template>
    <div class="left-graph" v-show="show_library">
        <div class="library" v-show="show_library">
            <library_model></library_model>
            <library_trend></library_trend>
        </div>
    </div>
</template>

<script>
import library_trend from "graph/library_trend.vue";
import library_model from "graph/library_model.vue";
export default {
    components: {
        library_model,
        library_trend,
    },
    data() {
        return {
            show_library: false,
        };
    },
    mounted() {
        let eventBus = this.$eventBus;
        this.$eventBus.on("show-library-graph-lr", url => {
            this.show_library = !this.show_library;
            eventBus.emit("show-library-data-l", this.show_library);
        });
    },
};
</script>