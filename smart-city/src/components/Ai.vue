<template>
    <el-dialog title="弹窗" :visible="detailVisible" width="35%" class="wind"> 弹窗内容 </el-dialog>
</template>

<script>
export default {
    name: "Ai",
    data() {
        return {
            detailVisible: false,
        };
    },
    methods: {
        //3.定义一个init函数，通过设置detailVisible值为true来让弹窗弹出，这个函数会在父组件的方法中被调用
        init() {
            this.detailVisible = true;
        },
    },
};
</script>

<style>
.wind {
    position: absolute;
    width: 440px;
    height: 700px;
    background: white;
    right: 105px;
    bottom: 150px;
    border-radius: 30px;
    box-shadow: 0px 0px 10px #1972f5;
}
</style>
