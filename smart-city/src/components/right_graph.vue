<template>
    <div class="right-graph" v-show="show_library">
        <div class="library" v-show="show_library">
            <library_type></library_type>
            <library_notice></library_notice>
        </div>
    </div>
</template>

<script>
// import library_analyse from "graph/library_analyse.vue";
import library_type from "graph/library_type.vue";
import library_notice from "graph/library_notice.vue";
export default {
    components: {
        // library_analyse,
        // library_trend,
        library_type,
        library_notice
        
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
