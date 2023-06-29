<template>
    <vue3-seamless-scroll :list="list" class="scroll" v-if="show">
        <div class="item" v-for="(item, index) in list" :key="index">
            <span>{{ item.title }}</span>
            <span>{{ item.date }}</span>
        </div>
    </vue3-seamless-scroll>
</template>
<script>
import { defineComponent, ref } from "vue";
import { Vue3SeamlessScroll } from "vue3-seamless-scroll";

export default defineComponent({
    name: "App",
    components: {
        Vue3SeamlessScroll,
    },
    data(){
        return {
            show:false
        }
    },
    setup() {
        const list = ref([
            {
                title: "Vue3.0 无缝滚动组件展示数据第1条",
                date: "123",
            },
            {
                title: "Vue3.0 无缝滚动组件展示数据第2条",
                date: "123",
            },
            {
                title: "Vue3.0 无缝滚动组件展示数据第3条",
                date: "123",
            },
            {
                title: "Vue3.0 无缝滚动组件展示数据第4条",
                date: "123",
            },
            {
                title: "Vue3.0 无缝滚动组件展示数据第5条",
                date: "123",
            },
            {
                title: "Vue3.0 无缝滚动组件展示数据第6条",
                date: "123",
            },
            {
                title: "Vue3.0 无缝滚动组件展示数据第7条",
                date: "123",
            },
            {
                title: "Vue3.0 无缝滚动组件展示数据第8条",
                date: "123",
            },
            {
                title: "Vue3.0 无缝滚动组件展示数据第9条",
                date: "123",
            },
        ]);
        return { list };
    },
    mounted(){
        this.$eventBus.on("show-library-data-r", showMenu => {
            if (showMenu) {
                // 在div渲染结束后在初始化图表
                this.$nextTick(() => {
                    this.show = true;
                });
            } else {
                this.show = false;
            }
        });
    }
});
</script>

<style>
.scroll {
    height: 300px;
    width: 388px;
    overflow: hidden;
    color: white;
}

.scroll .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px 0;
}
</style>
