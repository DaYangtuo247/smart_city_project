<template>
    <div id="modelBorder" :style="{ width: '388px', height: '280px' }"></div>
</template>

<script>
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default {
    data() {
        return {
            showMenu: false,
        };
    },
    mounted() {
        this.$eventBus.on("change", url => {
            this.init();
            // this.removeGltf();
        });
    },
    methods: {
        init() {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, 380 / 400, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ alpha: true });
            renderer.setSize(380, 400);
            document.getElementById("modelBorder").appendChild(renderer.domElement);

            const loader = new GLTFLoader();
            loader.load("house.glb", gltf => {
                const model = gltf.scene;
                model.name = "library"; // 设置模型的名称为"myModel"
                scene.add(model);

                // 添加控制器
                const controls = new OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true; // 启用阻尼效果，使控制更平滑
                controls.dampingFactor = 0.25; // 阻尼系数
                controls.enableZoom = true; // 启用缩放
                controls.target.set(0, 0, 0); // 设置控制目标为场景中心

                // 设置模型的初始位置和大小
                model.position.set(0, 0, 0);
                model.scale.set(0.8, 0.8, 0.8);

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
                    model.rotation.y += rotationSpeed;

                    renderer.render(scene, camera);
                }

                animate();
            });
        },
        removeGltf() {
            const scene = this.$data.__threeObject; // 获取场景对象
            const model = scene.getObjectByName("library");
            if (model) {
                scene.remove(model); // 从场景中移除模型
                model.traverse(child => {
                    if (child.isMesh) {
                        child.geometry.dispose(); // 释放几何体资源
                        child.material.dispose(); // 释放材质资源
                    }
                });
            }
        },
    },
};
</script>
