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
                title: "图书馆开展党风廉政建设专题学习",
                date: "6-27",
            },
            {
                title: "第二届湖北省属高校图书馆阅读推广工作研讨会",
                date: "6-20",
            },
            {
                title: "“青春筑梦 强国有我”思政主题活动获表彰",
                date: "6-20",
            },
            {
                title: "“浓情迎端午 巧手做香囊”—开展端午节活动",
                date: "6-16",
            },
            {
                title: "“云上雅游|数字奇遇·探‘悦’之旅” 世界读书日活动",
                date: "6-16",
            },
            {
                title: "走进大悟：重温峥嵘岁月 传承红色精神",
                date: "6-07",
            },
            {
                title: "品书香 阅成长 学校2023年阅读盛典成功举行",
                date: "6-02",
            },
            {
                title: "FSTA®食品科学与技术文摘数据库试用通知",
                date: "5-26",
            },
            {
                title: "新时代党政视频资源库试用通知",
                date: "5-26",
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
