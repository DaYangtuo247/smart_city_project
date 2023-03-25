<template>
    <div class="com-container">
        <div class="com-chart" ref="mapRef">
            <div id="MapContainer"></div>
        </div>
    </div>
</template>

<script>
// 原项目本身包含的，留着是为了防止出现神奇的bug
// import { getProvinceMapInfo } from '@/utils/map_utils';
// import { mapState } from 'vuex';
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import AMapLoader from "@amap/amap-jsapi-loader"; // 高德地图
import Stats from "three/examples/jsm/libs/stats.module"; // 性能监视器
//  gltf-pipeline 压缩gltf文件失败，会导致精度丢失，但仍保留该注释，以保日后需要
// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
// let height = 0.0;
let camera; //相机
let scene; //场景
let renderer;
let object; // gltf模型场景
let objPosition = [114.281454, 30.59925]; // 模型放置点
let mapPosition = [114.30443, 30.591613]; // 地图放置点
let customCoords;
let map;
export default {
    mounted() {
        //DOM初始化完成进行地图初始化
        this.initMap();
        // this.initGltf();
        this.change();
        // this.render();
    },
    methods: {
        initMap() {
            // 添加性能监视器
            var stats = new Stats();
            stats.showPanel(0);
            document.body.appendChild(stats.dom);
            AMapLoader.load({
                key: "283d29d48a72af6b61305c99b1f8638c", // 申请好的Web端开发者Key
                version: "2.0",
                plugins: ["AMap.ToolBar", "AMap.Scale"], // 插件列表
                AMapUI: {
                    version: "1.1",
                    plugins: ["overlay/SimpleMarker"],
                },
                Loca: {
                    version: "2.0",
                },
            })
                .then((AMap) => {
                    map = new AMap.Map("MapContainer", {
                        resizeEnable: true, //监控地图容器尺寸变化
                        rotateEnable: true, //控制地图是否可以旋转
                        pitchEnable: true, //控制地图是否可以倾斜
                        zoom: 12, //初始化地图级别
                        pitch: 40, //摄像机视角
                        viewMode: "3D", //是否为3D地图模式
                        zooms: [3, 20],
                        showBuildingBlock: false, // 显示高德自带地图块
                        mapStyle: "amap://styles/darkblue", // 初始化地图样式
                        center: mapPosition, //初始化地图中心点位置
                        showLabel: false //取消文字标注
                    });
                    var scale = new AMap.Scale(); // 添加比例尺控件
                    map.addControl(scale);
                    var toolbar = new AMap.ToolBar(); // 缩放工具条
                    map.addControl(toolbar);
                    // 数据转换工具
                    customCoords = map.customCoords;
                    // 数据使用转换工具进行转换，这个操作必须要提前执行（在获取镜头参数 函数之前执行），否则将会获得一个错误信息。
                    customCoords.lngLatsToCoords([
                        [116.271363, 39.992414],
                    ]);
                    // map.setMapStyle('amap://styles/normal'); // 设置地图样式
                    // 创建 GL 图层
                    var gllayer = new AMap.GLCustomLayer({
                        // 图层的层级
                        zIndex: 10,
                        // 初始化的操作，创建图层过程中执行一次。
                        init: (gl) => {
                            // 这里我们的地图模式是 3D，所以创建一个透视相机，相机的参数初始化可以随意设置，因为在 render 函数中，每一帧都需要同步相机参数，因此这里变得不那么重要。
                            // 如果你需要 2D 地图（viewMode: '2D'），那么你需要创建一个正交相机
                            camera = new THREE.PerspectiveCamera(
                                60,
                                window.innerWidth / window.innerHeight,
                                100,
                                1 << 30
                            );
                            renderer = new THREE.WebGLRenderer({
                                context: gl, // 地图的 gl 上下文
                                alpha: true,
                                antialias: true,
                                canvas: gl.canvas,
                            });
                            // 自动清空画布这里必须设置为 false，否则地图底图将无法显示
                            renderer.autoClear = false;
                            scene = new THREE.Scene();
                            // 环境光照和平行光
                            var aLight = new THREE.AmbientLight(0xffffff, 0.3);
                            var dLight = new THREE.DirectionalLight(0xffffff, 1);
                            dLight.position.set(1000, -100, 900);
                            scene.add(dLight);
                            scene.add(aLight);

                        },
                        render: () => {
                            // 更新性能监视器数据
                            stats.update();
                            // 这里必须执行！！重新设置 three 的 gl 上下文状态。
                            renderer.resetState();
                            // 重新设置图层的渲染中心点，将模型等物体的渲染中心点重置, 否则和 LOCA 可视化等多个图层能力使用的时候会出现物体位置偏移的问题
                            customCoords.setCenter(objPosition);
                            var { near, far, fov, up, lookAt, position } = customCoords.getCameraParams();
                            // 这里的顺序不能颠倒，否则可能会出现绘制卡顿的效果。
                            camera.near = near;
                            camera.far = far;
                            camera.fov = fov;
                            camera.position.set(...position);
                            camera.up.set(...up);
                            camera.lookAt(...lookAt);
                            camera.updateProjectionMatrix();

                            renderer.render(scene, camera);
                            // 这里必须执行！！重新设置 three 的 gl 上下文状态。
                            renderer.resetState();
                        },
                    });
                    map.add(gllayer);

                    function alive() {
                        map.render();
                        requestAnimationFrame(alive);
                    }
                    alive();

                    // map.render();
                    // function change(){
                    //     this.height.value += 1;
                    //     if (this.height.value > 200) {
                    //       this.height.value = 0.0
                    //     }
                    //     // console.log(this.height.value);
                    //     map.render();
                    //     requestAnimationFrame(change);
                    // }
                    // change();
                    this.initGltf();
                })
                .catch((e) => {
                    console.log(e);
                });
        },
        change() {
            this.height.value += 0.1;
            if (this.height.value > 50) {
                this.height.value = 0.0
            }
            // map.render();
            requestAnimationFrame(this.change);
        },
        initGltf() {
            const loader = new GLTFLoader();
            loader.load("wuhan_update.gltf", (gltf) => {
                gltf.scene.traverse((model) => {
                    if (model.isMesh) {
                        // 添加边框线
                        const edges = new THREE.EdgesGeometry(model.geometry);
                        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
                            color: 0xffffff
                        }));
                        model.add(line);
                        const shaderMaterial = new THREE.ShaderMaterial({
                            uniforms: {
                                height: this.height,
                                uColor: { value: new THREE.Color(0xffffff) }, // 初始颜色为白色
                                uHeight: { value: model.geometry.boundingBox.getSize(new THREE.Vector3()).y },
                                uFlowColor: {
                                    value: new THREE.Color("#FFFFFF"),
                                },
                            },
                            vertexShader: `
                        uniform float uHeight;
                        varying float vPosition;
                        varying vec3 vPoint;
                        void main() {
                          vPosition = position.y / uHeight;
                          vPoint = vec3(position.x, -position.z, position.y);
                          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                      `,
                            fragmentShader: `
                        varying vec3 vPoint;
                        uniform vec3 uColor;
                        uniform float height;
                        uniform vec3 uFlowColor;
                        varying float vPosition;
                        void main() {
                          // 计算模型的基础颜色
                          vec3 distColor = mix(vec3(0.0, 0.4, 1.0), uColor, vPosition);
                          // 计算流动范围当前点z的高度加上流动线的高度
                          float topY = vPoint.z + 5.0;
                          if (height > vPoint.z && height < topY) {
                              // 颜色渐变 
                              float dIndex = sin((height - vPoint.z) / 10.0 * 3.14);
                              distColor = mix(uFlowColor, distColor, 1.0-dIndex);
                            //   distColor = uFlowColor; 
                          }
                          gl_FragColor = vec4(distColor, 0.8); 
                          // gl_FragColor = vec4(mix(vec3(0.0, 0.4, 1.0), uColor, vPosition), 0.9); // 通过mix函数混合两个颜色，达到渐变效果
                        }
                      `,
                            transparent: true,
                        });
                        model.material = shaderMaterial;
                    }
                });
                scene.add(gltf.scene);
                object = gltf.scene;
                object.scale.set(30, 30, 30);
                this.setRotation({
                    x: 90,
                    y: 0,
                    z: 0,
                });
                this.setPosition();
                scene.add(object);
            });
        },
        setRotation(rotation) {
            var x = (Math.PI / 180) * (rotation.x || 0);
            var y = (Math.PI / 180) * (rotation.y || 0);
            var z = (Math.PI / 180) * (rotation.z || 0);
            object.rotation.set(x, y, z);
        },
        setPosition() {
            // 设置x、y、z缩放信息
            object.scale.set(1, 1, 1);
            // 对模型的经纬度进行转换
            var position = customCoords.lngLatsToCoords(objPosition)[0];
            object.position.setX(position[0]);
            object.position.setY(position[1]);
        },
    },
    data() {
        return {
            height: {
                value: 0,
            },
        };
    },
};
</script>

<style scoped>
html,
body,
#MapContainer {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0%;
    border-radius: 20px;
    overflow: hidden;
}
</style>

<style lang="less" scoped></style>
