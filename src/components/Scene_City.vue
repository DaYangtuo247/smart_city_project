<template>
  <div id="MapContainer"></div>
</template>

<script>
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import AMapLoader from "@amap/amap-jsapi-loader"; // 高德地图
export default {
  mounted() {
    //DOM初始化完成进行地图初始化
    this.ininMap();
  },
  methods: {
    ininMap() {
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
          var map = new AMap.Map("MapContainer", {
            rotateEnable: true, //控制地图是否可以旋转
            pitchEnable: true, //控制地图是否可以倾斜
            zoom: 12, //初始化地图级别
            pitch: 50, //摄像机视角
            viewMode: "3D", //是否为3D地图模式
            zooms: [2, 20],
            // mapStyle: 'amap://styles/macaron', // 初始化地图样式
            center: [114.30443, 30.591613], //初始化地图中心点位置
          });
          var scale = new AMap.Scale(); // 添加比例尺控件
          map.addControl(scale);
          var toolbar = new AMap.ToolBar(); // 缩放工具条
          map.addControl(toolbar);

          var camera;
          var renderer;
          var scene;
          // 数据转换工具
          var customCoords = map.customCoords;
          // 数据使用转换工具进行转换，这个操作必须要提前执行（在获取镜头参数 函数之前执行），否则将会获得一个错误信息。
          // var data = customCoords.lngLatsToCoords([
          //     [116.271363, 39.992414],
          // ]);
          var object;
          var objPosition = [114.281453, 30.599251]; // 模型放置点

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
                // alpha: true,
                // antialias: true,
                // canvas: gl.canvas,
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

              initGltf();
            },
            render: () => {
              // 这里必须执行！！重新设置 three 的 gl 上下文状态。
              renderer.resetState();
              // 重新设置图层的渲染中心点，将模型等物体的渲染中心点重置
              // 否则和 LOCA 可视化等多个图层能力使用的时候会出现物体位置偏移的问题
              customCoords.setCenter([116.271363, 39.992414]);
              var { near, far, fov, up, lookAt, position } =
                customCoords.getCameraParams();

              // 2D 地图下使用的正交相机
              // var { near, far, top, bottom, left, right, position, rotation } = customCoords.getCameraParams();

              // 这里的顺序不能颠倒，否则可能会出现绘制卡顿的效果。
              camera.near = near;
              camera.far = far;
              camera.fov = fov;
              camera.position.set(...position);
              camera.up.set(...up);
              camera.lookAt(...lookAt);
              camera.updateProjectionMatrix();

              // 2D 地图使用的正交相机参数赋值
              // camera.top = top;
              // camera.bottom = bottom;
              // camera.left = left;
              // camera.right = right;
              // camera.position.set(...position);
              // camera.updateProjectionMatrix();

              renderer.render(scene, camera);

              // 这里必须执行！！重新设置 three 的 gl 上下文状态。
              renderer.resetState();
            },
          });
          map.add(gllayer);

          function initGltf() {
            var loader = new GLTFLoader();
            loader.load("wuhan.gltf", (gltf) => {
              object = gltf.scene;
              object.scale.set(30, 30, 30);
              setRotation({
                x: 90,
                y: 0,
                z: 0,
              });
              setPosition(objPosition);
              scene.add(object);
            });
          }

          function setRotation(rotation) {
            var x = (Math.PI / 180) * (rotation.x || 0);
            var y = (Math.PI / 180) * (rotation.y || 0);
            var z = (Math.PI / 180) * (rotation.z || 0);
            object.rotation.set(x, y, z);
          }

          function setPosition(lnglat) {
            // 设置x、y、z缩放信息
            object.scale.set(1, 1, 1);
            // 对模型的经纬度进行转换
            var position = customCoords.lngLatsToCoords([lnglat])[0];
            object.position.setX(position[0]);
            object.position.setY(position[1]);
          }
        })
        .catch((e) => {
          console.log(e);
        });
    },
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
}
</style>
