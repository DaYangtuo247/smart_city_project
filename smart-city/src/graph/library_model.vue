<template>
    <div id="modelBorder" width="{{this.width}}px" height="{{this.height}}px"></div>
</template>

<script>
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let library_model, animateID;

export default {
    data() {
        return {
            width: 388,
            height: 280,
        };
    },
    mounted() {
        this.$eventBus.on("show-library-data-l", showMenu => {
            if (showMenu) {
                this.init();
            } else {
                this.removeGltf();
            }
        });
    },
    methods: {
        init() {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(this.width, this.height);
            document.getElementById("modelBorder").appendChild(renderer.domElement);

            const loader = new GLTFLoader();
            loader.load("library.glb", gltf => {
                library_model = gltf.scene;
                library_model.name = "library"; // 设置模型的名称为"myModel"
                scene.add(library_model);

                // 添加控制器
                const controls = new OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true; // 启用阻尼效果，使控制更平滑
                controls.dampingFactor = 0.25; // 阻尼系数
                controls.enableZoom = true; // 启用缩放
                controls.target.set(0, 0, 0); // 设置控制目标为场景中心

                // 设置模型的在坐标系中的初始位置和大小
                library_model.position.set(0, 0, 0);
                library_model.scale.set(1, 1, 1);

                // 设置相机的初始位置
                camera.position.set(-2.5, 2.5, 5);

                // 创建坐标轴
                // const axesHelper = new THREE.AxesHelper(20); // 设置坐标轴长度为2个单位
                // axesHelper.position.set(0, 0, 0); // 设置坐标轴的位置
                // scene.add(axesHelper);

                // 创建光源
                const light = new THREE.DirectionalLight(0xffffff, 1);
                light.position.copy(camera.position); // 将光源位置设置为相机位置
                scene.add(light);

                // 动画循环
                function animate() {
                    animateID = requestAnimationFrame(animate);
                    controls.update(); // 更新控制器状态
                    light.position.copy(camera.position); // 更新光源位置为相机位置

                    // 模型自动旋转
                    // library_model.rotation.y += 0.01;

                    renderer.render(scene, camera);
                }

                animate();
            });
        },
        removeGltf() {
            cancelAnimationFrame(animateID); // 停止动画
            // 移除模型和canvas元素
            const modelElement = document.getElementById("modelBorder"); // 获取包含canvas的父元素
            const canvasElement = modelElement.getElementsByTagName("canvas")[0]; // 获取canvas元素
            modelElement.removeChild(canvasElement);
        },
    },
};
</script>
