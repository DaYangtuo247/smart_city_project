<template>
    <div id="modelBorder" width="{{this.width}}px" height="{{this.height}}px"></div>
</template>

<script>
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let libary_model;

export default {
    data() {
        return {
            width: "388",
            hieght: "280",
        };
    },
    mounted() {
        this.$eventBus.on("show-libary-data", showMenu => {
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
            loader.load("house.glb", gltf => {
                libary_model = gltf.scene;
                libary_model.name = "library"; // 设置模型的名称为"myModel"
                scene.add(libary_model);

                // 添加控制器
                const controls = new OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true; // 启用阻尼效果，使控制更平滑
                controls.dampingFactor = 0.25; // 阻尼系数
                controls.enableZoom = true; // 启用缩放
                controls.target.set(0, 0, 0); // 设置控制目标为场景中心

                // 设置模型的初始位置和大小
                libary_model.position.set(0, 0, 0);
                libary_model.scale.set(0.8, 0.8, 0.8);

                // 设置相机的初始位置
                camera.position.set(-3, 3, 5);

                // 创建光源
                const light = new THREE.DirectionalLight(0xffffff, 1);
                light.position.copy(camera.position); // 将光源位置设置为相机位置
                scene.add(light);

                // 模型的旋转速度
                const rotationSpeed = 0.01;

                // 动画循环
                function animate() {
                    requestAnimationFrame(animate);
                    controls.update(); // 更新控制器状态
                    light.position.copy(camera.position); // 更新光源位置为相机位置

                    // 模型自动旋转
                    libary_model.rotation.y += rotationSpeed;

                    renderer.render(scene, camera);
                }

                animate();
            });
        },
        removeGltf() {
            const modelElement = document.getElementById("modelBorder"); // 获取包含canvas的父元素
            const canvasElement = modelElement.getElementsByTagName("canvas")[0]; // 获取canvas元素

            // 移除模型和canvas元素
            modelElement.removeChild(canvasElement);

            // 清空场景中的模型对象
            scene.remove(libary_model);
        },
    },
};
</script>
