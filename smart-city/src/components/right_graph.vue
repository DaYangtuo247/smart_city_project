<template>
    <div class="right-graph" v-show="show_library">
        <div class="library" v-show="show_library">
            <library_analyse></library_analyse>
            <library_trend></library_trend>
        </div>
    </div>
</template>

<script>
import library_analyse from "graph/library_analyse.vue";

import library_trend from "graph/library_trend.vue";
export default {
    components: {
        library_analyse,
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
            eventBus.emit("show-library-data-r", this.show_library);
        });
    },
};
</script>
