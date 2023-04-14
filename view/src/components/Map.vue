<template>
    <div class="com-container">
        <div class="com-chart" ref="mapRef">
            <div id="MapContainer"></div>
        </div>
    </div>
</template>
<script>

import { mapState } from "vuex";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import AMapLoader from "@amap/amap-jsapi-loader"; // 高德地图
import Stats from "three/examples/jsm/libs/stats.module"; // 性能监视器
import EventBus from '@/event-bus';
//  gltf-pipeline 压缩gltf文件失败，会导致精度丢失，但仍保留该注释，以保日后需要
// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
// let height = 0.0;
let camera; //相机
let scene; //场景
let renderer;
let object; // gltf模型场景
let map_gltf_model_Position = [114.281454, 30.59925]; // 模型放置点
let map_init_center = [114.30443, 30.591613]; // 地图放置点
let customCoords;
let map;
let st = false;
let pol;
export default {
    computed: {
        ...mapState(["theme"])
    },
    watch: {
        theme() {
            this.changeTheme();
        }
    },
    mounted() {
        //DOM初始化完成进行地图初始化
        this.initMap();
        this.change();
        // this.clickOn();
    },
    methods: {
        changeTheme() {
            if (this.theme == "darkTheme") {
                map.setMapStyle("amap://styles/grey"); // 设置地图样式
                // map.setMapStyle("amap://styles/darkblue"); // 设置地图样式
            } else {
                map.setMapStyle("amap://styles/normal"); // 设置地图样式
            }
        },
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
                    plugins: ["overlay/SimpleMarker"]
                },
                Loca: {
                    version: "2.0"
                }
            })
                .then(AMap => {
                    map = new AMap.Map("MapContainer", {
                        resizeEnable: true, //监控地图容器尺寸变化
                        rotateEnable: true, //控制地图是否可以旋转
                        pitchEnable: true, //控制地图是否可以倾斜
                        zoom: 12, //初始化地图级别
                        pitch: 40, //摄像机视角
                        viewMode: "3D", //是否为3D地图模式
                        zooms: [3, 20],
                        showBuildingBlock: false, // 显示高德自带地图块
                        center: map_init_center, //初始化地图中心点位置
                        showLabel: true //设置文字标注
                    });
                    this.changeTheme(); // 跟随全局主题设置
                    map.addControl(new AMap.Scale()); // 添加比例尺控件
                    map.addControl(new AMap.ToolBar()); // 缩放工具条
                    // 数据转换工具

                    customCoords = map.customCoords;
                    // 数据使用转换工具进行转换，这个操作必须要提前执行（在获取镜头参数 函数之前执行），否则将会获得一个错误信息。
                    customCoords.lngLatsToCoords([map_init_center]);
                    // 创建 GL 图层
                    var gllayer = new AMap.GLCustomLayer({
                        // 图层的层级
                        zIndex: 10,
                        // 初始化的操作，创建图层过程中执行一次。
                        init: gl => {
                            // 这里我们的地图模式是 3D，所以创建一个透视相机，相机的参数初始化可以随意设置，因为在 render 函数中，每一帧都需要同步相机参数，因此这里变得不那么重要。
                            // 如果你需要 2D 地图（viewMode: '2D'），那么你需要创建一个正交相机
                            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 100, 1 << 30);
                            renderer = new THREE.WebGLRenderer({
                                context: gl, // 地图的 gl 上下文
                                alpha: true,
                                antialias: true,
                                canvas: gl.canvas
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
                            //重新设置模型大小，解决地图漂移的问题
                            var map_father_box = document.querySelector(".amap-layer");
                            // 确保获取到地图父盒子
                            if (map_father_box && map_father_box.offsetWidth) {
                                var boxWidth = map_father_box.offsetWidth,
                                    boxHeight = map_father_box.offsetHeight;
                                camera = new THREE.PerspectiveCamera(60, boxWidth / boxHeight, 100, 1 << 30);
                            }
                            // 这里必须执行！！重新设置 three 的 gl 上下文状态。
                            renderer.resetState();
                            // 重新设置图层的渲染中心点，将模型等物体的渲染中心点重置, 否则和 LOCA 可视化等多个图层能力使用的时候会出现物体位置偏移的问题
                            customCoords.setCenter(map_gltf_model_Position);
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
                        }
                    });
                    map.add(gllayer);
                    
                    // 隐藏按钮的添加（实际上是添加了个透明的图标，供人点击）
                    var icon = new AMap.Icon({
                        image: "none.png", // 图标的图片
                        size: new AMap.Size(50, 50), // 图标的尺寸，这里将宽度和高度均设为32，可以根据需要调整大小
                        imageSize: new AMap.Size(256, 256) // 图标所用图片的大小
                    });

                    var marker = new AMap.Marker({
                        map: map,
                        icon: icon,
                        position: [114.222004, 30.6525]
                    });

                    // 鼠标点击范围的设置
                    var polygonArr = [
                        [114.221782, 30.652927],
                        [114.221731, 30.652097],
                        [114.222575, 30.652073],
                        [114.222625, 30.652939]
                    ];
                    map.setFitView();

                    pol = new AMap.Polygon({
                            map: map,
                            path: polygonArr, //设置多边形边界路径
                            strokeColor: "#FF33FF", //线颜色
                            strokeOpacity: 0.2, //线透明度
                            strokeWeight: 3, //线宽
                            fillColor: "#1791fc", //填充色
                            fillOpacity: 0.35 //填充透明度
                        });
                    
                    map.remove(pol);

                    
                    marker.on("click", showInfoClick);

                    // function clickOn() {
                    //     // log.success("绑定事件!");
                    //     console.log("clickOn事件被触发！");
                    //     // polygon.on("click", showInfoClick);
                    //     marker.on("click", showInfoClick);
                    //     // this.map.on('mousemove', this.showInfoMove);
                    // }

                    // function clickOff() {
                    //     // log.success("解绑事件!");
                    //     console.log("clickOff事件被解除！");
                    //     // polygon.off("click", showInfoClick);
                    //     marker.off("click", showInfoClick);
                    //     // this.map.off('mousemove', this.showInfoMove);
                    // }

                    function showInfoClick(e) {
                        // console.log("您在 [ " + e.lnglat.getLng() + "," + e.lnglat.getLat() + " ] 的位置单击了地图！");
                        // 触发一个名为'change-data-url-lib-p-w-e'的自定义事件，用于更换趋势图的数据源
                        EventBus.$emit('change-data-url-lib-p-w-e', '/lib_people_w_e');
                        // 触发一个名为'change-data-url-p-c'的自定义事件，用于更换饼图的数据源
                        EventBus.$emit('change-data-url-p-c', '/lib_pie_chart');
                        
                        change_polygon();
                    }
                    
                    // 控制图书馆附近的多边形是否显示
                    function change_polygon() {
                        if (st == false) {
                            map.add(pol);
                            st = true;
                        }
                        else
                        {
                            st = false;
                            map.remove(pol);
                        }
                    }

                    var loca = new Loca.Container({
                        map,
                    });

                    var geo = new Loca.GeoJSONSource({
                        data:{
                            "type": "FeatureCollection",
                            "features": [{
                                "type": "Feature",
                                "geometry": {
                                    "type": "Point",
                                    "coordinates": [114.222131, 30.652322]
                                },
                                "properties": {
                                    "name": "武汉轻工大学图书馆",
                                    "price": 55000,
                                    "count": 92
                                }
                            }]
                        }
                    })

                     // 文字主体图层
                    var zMarker = new Loca.ZMarkerLayer({
                        loca: loca,
                        zIndex: 120,
                        depth: false,
                    });
                    zMarker.setSource(geo);
                    zMarker.setStyle({
                        content: (i, feat) => {
                            var props = feat.properties;
                            var leftColor = props.price < 60000 ? 'rgba(0, 28, 52, 0.6)' : 'rgba(33,33,33,0.6)';
                            var rightColor = props.price < 60000 ? '#038684' : 'rgba(172, 137, 51, 0.3)';
                            var borderColor = props.price < 60000 ? '#038684' : 'rgba(172, 137, 51, 1)';
                            return (
                                '<div style="width: 490px; height: 228px; padding: 0 0;">' +
                                '<p style="display: block; height:80px; line-height:80px;font-size:40px;background-image: linear-gradient(to right, '
                                + leftColor + ',' + leftColor + ',' + rightColor + ',rgba(0,0,0,0.4)); border:4px solid '
                                + borderColor + '; color:#fff; border-radius: 15px; text-align:center; margin:0; padding:5px;">' +
                                props['name'] +
                                '</p><span style="width: 130px; height: 130px; margin: 0 auto; display: block; background: url(https://a.amap.com/Loca/static/loca-v2/demos/images/prism_'
                                + (props['price'] < 60000 ? 'blue' : 'yellow') + '.png);"></span></div>'
                            );
                        },
                        unit: 'meter',
                        rotation: 0,
                        alwaysFront: true,
                        size: [490/2, 222/2],
                        altitude: 0,
                    });

                    // 浮动三角
                    var triangleZMarker = new Loca.ZMarkerLayer({
                        loca: loca,
                        zIndex: 119,
                        depth: false,
                    });
                    triangleZMarker.setSource(geo);
                    triangleZMarker.setStyle({
                        content: (i, feat) => {
                            return (
                                '<div style="width: 120px; height: 120px; background: url(https://a.amap.com/Loca/static/loca-v2/demos/images/triangle_'
                                + (feat.properties.price < 60000 ? 'blue' : 'yellow')
                                + '.png);"></div>'
                            );
                        },
                        unit: 'meter',
                        rotation: 0,
                        alwaysFront: true,
                        size: [60, 60],
                        altitude: 15,
                    });
                    triangleZMarker.addAnimate({
                        key: 'altitude',
                        value: [0, 1],
                        random: true,
                        transform: 1000,
                        delay: 2000,
                        yoyo: true,
                        repeat: 999999,
                    });

                    // 呼吸点 蓝色
                    var scatterBlue = new Loca.ScatterLayer({
                        loca,
                        zIndex: 110,
                        opacity: 1,
                        visible: true,
                        zooms: [2, 26],
                        depth: false,
                    });

                    scatterBlue.setSource(geo);
                    scatterBlue.setStyle({
                        unit: 'meter',
                        size: function (i, feat) {
                            return feat.properties.price < 60000 ? [90, 90] : [0, 0];
                        },
                        texture: 'https://a.amap.com/Loca/static/loca-v2/demos/images/scan_blue.png',
                        altitude: 20,
                        duration: 2000,
                        animate: true,
                    });

                    // 呼吸点 金色
                    var scatterYellow = new Loca.ScatterLayer({
                        loca,
                        zIndex: 110,
                        opacity: 1,
                        visible: true,
                        zooms: [2, 26],
                        depth: false
                    });

                    scatterYellow.setSource(geo);
                    scatterYellow.setStyle({
                        unit: 'meter',
                        size: function (i, feat) {
                            return feat.properties.price > 60000 ? [90, 90] : [0, 0];
                        },
                        texture: 'https://a.amap.com/Loca/static/loca-v2/demos/images/scan_yellow.png',
                        altitude: 20,
                        duration: 2000,
                        animate: true,
                    });
                    
                    // 粒子上升效果
                    var layer = new Loca.LaserLayer({
                        zIndex: 130,
                        opacity: 1,
                        visible: true,
                        depth: true,
                        zooms: [2, 26],
                    });

                    var heightFactor = 5;

                    var pointGeo = new Loca.GeoJSONSource({
                        data:{"type": "FeatureCollection", "features": [{"geometry": {"coordinates": [114.221699, 30.65213], "type": "Point"}, "type": "Feature", "properties": {"h": 53.22}}, {"geometry": {"coordinates": [114.22196, 30.654903], "type": "Point"}, "type": "Feature", "properties": {"h": 58.18}}, {"geometry": {"coordinates": [114.222796, 30.654537], "type": "Point"}, "type": "Feature", "properties": {"h": 53.64}}, {"geometry": {"coordinates": [114.220945, 30.653593], "type": "Point"}, "type": "Feature", "properties": {"h": 52.3}}, {"geometry": {"coordinates": [114.224515, 30.656228], "type": "Point"}, "type": "Feature", "properties": {"h": 45.04}}, {"geometry": {"coordinates": [114.223456, 30.656269], "type": "Point"}, "type": "Feature", "properties": {"h": 42.74}}, {"geometry": {"coordinates": [114.222146, 30.654903], "type": "Point"}, "type": "Feature", "properties": {"h": 53.7}}, {"geometry": {"coordinates": [114.219974, 30.652013], "type": "Point"}, "type": "Feature", "properties": {"h": 57.79}}, {"geometry": {"coordinates": [114.221354, 30.653625], "type": "Point"}, "type": "Feature", "properties": {"h": 50.12}}, {"geometry": {"coordinates": [114.220163, 30.653507], "type": "Point"}, "type": "Feature", "properties": {"h": 47.38}}, {"geometry": {"coordinates": [114.21976, 30.653208], "type": "Point"}, "type": "Feature", "properties": {"h": 59.64}}, {"geometry": {"coordinates": [114.222489, 30.654975], "type": "Point"}, "type": "Feature", "properties": {"h": 55.4}}, {"geometry": {"coordinates": [114.223645, 30.656455], "type": "Point"}, "type": "Feature", "properties": {"h": 54.6}}, {"geometry": {"coordinates": [114.222506, 30.65096], "type": "Point"}, "type": "Feature", "properties": {"h": 40.55}}, {"geometry": {"coordinates": [114.221209, 30.654334], "type": "Point"}, "type": "Feature", "properties": {"h": 56.54}}, {"geometry": {"coordinates": [114.219786, 30.654562], "type": "Point"}, "type": "Feature", "properties": {"h": 55.01}}, {"geometry": {"coordinates": [114.222533, 30.654535], "type": "Point"}, "type": "Feature", "properties": {"h": 45.19}}, {"geometry": {"coordinates": [114.22165, 30.652548], "type": "Point"}, "type": "Feature", "properties": {"h": 51.72}}, {"geometry": {"coordinates": [114.223565, 30.65671], "type": "Point"}, "type": "Feature", "properties": {"h": 45.2}}, {"geometry": {"coordinates": [114.219732, 30.653755], "type": "Point"}, "type": "Feature", "properties": {"h": 43.66}}, {"geometry": {"coordinates": [114.221378, 30.653006], "type": "Point"}, "type": "Feature", "properties": {"h": 50.83}}, {"geometry": {"coordinates": [114.223786, 30.655344], "type": "Point"}, "type": "Feature", "properties": {"h": 41.25}}, {"geometry": {"coordinates": [114.221834, 30.652119], "type": "Point"}, "type": "Feature", "properties": {"h": 54.18}}, {"geometry": {"coordinates": [114.221907, 30.655333], "type": "Point"}, "type": "Feature", "properties": {"h": 47.26}}, {"geometry": {"coordinates": [114.219595, 30.656669], "type": "Point"}, "type": "Feature", "properties": {"h": 40.67}}, {"geometry": {"coordinates": [114.220221, 30.654006], "type": "Point"}, "type": "Feature", "properties": {"h": 46.13}}, {"geometry": {"coordinates": [114.221175, 30.656077], "type": "Point"}, "type": "Feature", "properties": {"h": 58.27}}, {"geometry": {"coordinates": [114.223753, 30.652591], "type": "Point"}, "type": "Feature", "properties": {"h": 58.5}}, {"geometry": {"coordinates": [114.21926, 30.656946], "type": "Point"}, "type": "Feature", "properties": {"h": 48.84}}, {"geometry": {"coordinates": [114.224412, 30.655109], "type": "Point"}, "type": "Feature", "properties": {"h": 44.92}}, {"geometry": {"coordinates": [114.220075, 30.655139], "type": "Point"}, "type": "Feature", "properties": {"h": 57.12}}, {"geometry": {"coordinates": [114.220017, 30.655771], "type": "Point"}, "type": "Feature", "properties": {"h": 44.92}}, {"geometry": {"coordinates": [114.224167, 30.65461], "type": "Point"}, "type": "Feature", "properties": {"h": 44.6}}, {"geometry": {"coordinates": [114.221246, 30.654715], "type": "Point"}, "type": "Feature", "properties": {"h": 58.54}}, {"geometry": {"coordinates": [114.219981, 30.652687], "type": "Point"}, "type": "Feature", "properties": {"h": 55.75}}, {"geometry": {"coordinates": [114.222183, 30.65643], "type": "Point"}, "type": "Feature", "properties": {"h": 43.61}}, {"geometry": {"coordinates": [114.224144, 30.650772], "type": "Point"}, "type": "Feature", "properties": {"h": 59.16}}, {"geometry": {"coordinates": [114.223886, 30.652786], "type": "Point"}, "type": "Feature", "properties": {"h": 42.96}}, {"geometry": {"coordinates": [114.223118, 30.654055], "type": "Point"}, "type": "Feature", "properties": {"h": 57.58}}, {"geometry": {"coordinates": [114.224228, 30.65312], "type": "Point"}, "type": "Feature", "properties": {"h": 58.8}}, {"geometry": {"coordinates": [114.223068, 30.650885], "type": "Point"}, "type": "Feature", "properties": {"h": 47.26}}, {"geometry": {"coordinates": [114.224161, 30.651031], "type": "Point"}, "type": "Feature", "properties": {"h": 56.53}}, {"geometry": {"coordinates": [114.223037, 30.65064], "type": "Point"}, "type": "Feature", "properties": {"h": 52.52}}, {"geometry": {"coordinates": [114.221682, 30.65561], "type": "Point"}, "type": "Feature", "properties": {"h": 49.31}}, {"geometry": {"coordinates": [114.221121, 30.654484], "type": "Point"}, "type": "Feature", "properties": {"h": 47.64}}, {"geometry": {"coordinates": [114.221788, 30.655859], "type": "Point"}, "type": "Feature", "properties": {"h": 58.55}}, {"geometry": {"coordinates": [114.221425, 30.657023], "type": "Point"}, "type": "Feature", "properties": {"h": 52.49}}, {"geometry": {"coordinates": [114.221424, 30.651145], "type": "Point"}, "type": "Feature", "properties": {"h": 49.43}}, {"geometry": {"coordinates": [114.219568, 30.651788], "type": "Point"}, "type": "Feature", "properties": {"h": 56.02}}, {"geometry": {"coordinates": [114.224142, 30.651103], "type": "Point"}, "type": "Feature", "properties": {"h": 46.33}}, {"geometry": {"coordinates": [114.223889, 30.656955], "type": "Point"}, "type": "Feature", "properties": {"h": 55.93}}, {"geometry": {"coordinates": [114.219421, 30.651001], "type": "Point"}, "type": "Feature", "properties": {"h": 58.51}}, {"geometry": {"coordinates": [114.224184, 30.656024], "type": "Point"}, "type": "Feature", "properties": {"h": 42.0}}, {"geometry": {"coordinates": [114.219258, 30.655169], "type": "Point"}, "type": "Feature", "properties": {"h": 54.01}}, {"geometry": {"coordinates": [114.222829, 30.656987], "type": "Point"}, "type": "Feature", "properties": {"h": 40.9}}, {"geometry": {"coordinates": [114.221285, 30.656028], "type": "Point"}, "type": "Feature", "properties": {"h": 41.94}}, {"geometry": {"coordinates": [114.220106, 30.652657], "type": "Point"}, "type": "Feature", "properties": {"h": 43.51}}, {"geometry": {"coordinates": [114.222388, 30.655109], "type": "Point"}, "type": "Feature", "properties": {"h": 43.19}}, {"geometry": {"coordinates": [114.219529, 30.654701], "type": "Point"}, "type": "Feature", "properties": {"h": 55.25}}, {"geometry": {"coordinates": [114.21966, 30.650583], "type": "Point"}, "type": "Feature", "properties": {"h": 45.46}}, {"geometry": {"coordinates": [114.225017, 30.656156], "type": "Point"}, "type": "Feature", "properties": {"h": 45.51}}, {"geometry": {"coordinates": [114.223477, 30.656506], "type": "Point"}, "type": "Feature", "properties": {"h": 53.71}}, {"geometry": {"coordinates": [114.2243, 30.650739], "type": "Point"}, "type": "Feature", "properties": {"h": 44.74}}, {"geometry": {"coordinates": [114.224943, 30.651782], "type": "Point"}, "type": "Feature", "properties": {"h": 41.35}}, {"geometry": {"coordinates": [114.221555, 30.650686], "type": "Point"}, "type": "Feature", "properties": {"h": 45.41}}, {"geometry": {"coordinates": [114.220805, 30.655675], "type": "Point"}, "type": "Feature", "properties": {"h": 52.37}}, {"geometry": {"coordinates": [114.221949, 30.657376], "type": "Point"}, "type": "Feature", "properties": {"h": 42.4}}, {"geometry": {"coordinates": [114.221539, 30.655588], "type": "Point"}, "type": "Feature", "properties": {"h": 55.16}}, {"geometry": {"coordinates": [114.222751, 30.652482], "type": "Point"}, "type": "Feature", "properties": {"h": 52.15}}, {"geometry": {"coordinates": [114.220673, 30.656415], "type": "Point"}, "type": "Feature", "properties": {"h": 48.75}}, {"geometry": {"coordinates": [114.222665, 30.65723], "type": "Point"}, "type": "Feature", "properties": {"h": 53.51}}, {"geometry": {"coordinates": [114.224426, 30.655616], "type": "Point"}, "type": "Feature", "properties": {"h": 40.25}}, {"geometry": {"coordinates": [114.21924, 30.652426], "type": "Point"}, "type": "Feature", "properties": {"h": 56.33}}, {"geometry": {"coordinates": [114.224202, 30.654886], "type": "Point"}, "type": "Feature", "properties": {"h": 46.63}}, {"geometry": {"coordinates": [114.222996, 30.652265], "type": "Point"}, "type": "Feature", "properties": {"h": 53.73}}, {"geometry": {"coordinates": [114.220123, 30.656484], "type": "Point"}, "type": "Feature", "properties": {"h": 41.27}}, {"geometry": {"coordinates": [114.223628, 30.65557], "type": "Point"}, "type": "Feature", "properties": {"h": 52.33}}, {"geometry": {"coordinates": [114.220615, 30.650976], "type": "Point"}, "type": "Feature", "properties": {"h": 45.51}}, {"geometry": {"coordinates": [114.220446, 30.653094], "type": "Point"}, "type": "Feature", "properties": {"h": 43.57}}, {"geometry": {"coordinates": [114.223575, 30.652326], "type": "Point"}, "type": "Feature", "properties": {"h": 55.82}}, {"geometry": {"coordinates": [114.222671, 30.654493], "type": "Point"}, "type": "Feature", "properties": {"h": 47.35}}, {"geometry": {"coordinates": [114.221652, 30.656477], "type": "Point"}, "type": "Feature", "properties": {"h": 56.47}}, {"geometry": {"coordinates": [114.219782, 30.65525], "type": "Point"}, "type": "Feature", "properties": {"h": 59.24}}, {"geometry": {"coordinates": [114.222027, 30.65263], "type": "Point"}, "type": "Feature", "properties": {"h": 43.28}}, {"geometry": {"coordinates": [114.222945, 30.656227], "type": "Point"}, "type": "Feature", "properties": {"h": 53.11}}, {"geometry": {"coordinates": [114.222367, 30.653541], "type": "Point"}, "type": "Feature", "properties": {"h": 51.22}}, {"geometry": {"coordinates": [114.221004, 30.656702], "type": "Point"}, "type": "Feature", "properties": {"h": 44.03}}, {"geometry": {"coordinates": [114.222655, 30.65553], "type": "Point"}, "type": "Feature", "properties": {"h": 54.46}}, {"geometry": {"coordinates": [114.223271, 30.651212], "type": "Point"}, "type": "Feature", "properties": {"h": 49.82}}, {"geometry": {"coordinates": [114.219724, 30.652382], "type": "Point"}, "type": "Feature", "properties": {"h": 47.82}}, {"geometry": {"coordinates": [114.221489, 30.654958], "type": "Point"}, "type": "Feature", "properties": {"h": 40.73}}, {"geometry": {"coordinates": [114.223612, 30.653235], "type": "Point"}, "type": "Feature", "properties": {"h": 56.15}}, {"geometry": {"coordinates": [114.222225, 30.656006], "type": "Point"}, "type": "Feature", "properties": {"h": 58.58}}, {"geometry": {"coordinates": [114.221007, 30.652565], "type": "Point"}, "type": "Feature", "properties": {"h": 54.36}}, {"geometry": {"coordinates": [114.221796, 30.65353], "type": "Point"}, "type": "Feature", "properties": {"h": 59.97}}, {"geometry": {"coordinates": [114.222609, 30.657367], "type": "Point"}, "type": "Feature", "properties": {"h": 57.01}}, {"geometry": {"coordinates": [114.220263, 30.657262], "type": "Point"}, "type": "Feature", "properties": {"h": 53.97}}, {"geometry": {"coordinates": [114.224856, 30.651539], "type": "Point"}, "type": "Feature", "properties": {"h": 52.82}}, {"geometry": {"coordinates": [114.222452, 30.656891], "type": "Point"}, "type": "Feature", "properties": {"h": 48.31}}, {"geometry": {"coordinates": [114.224321, 30.654603], "type": "Point"}, "type": "Feature", "properties": {"h": 41.99}}, {"geometry": {"coordinates": [114.222387, 30.654014], "type": "Point"}, "type": "Feature", "properties": {"h": 55.34}}, {"geometry": {"coordinates": [114.220099, 30.651691], "type": "Point"}, "type": "Feature", "properties": {"h": 52.0}}, {"geometry": {"coordinates": [114.219882, 30.655564], "type": "Point"}, "type": "Feature", "properties": {"h": 52.46}}, {"geometry": {"coordinates": [114.22437, 30.652257], "type": "Point"}, "type": "Feature", "properties": {"h": 57.56}}, {"geometry": {"coordinates": [114.2225, 30.655254], "type": "Point"}, "type": "Feature", "properties": {"h": 59.98}}, {"geometry": {"coordinates": [114.220981, 30.650743], "type": "Point"}, "type": "Feature", "properties": {"h": 42.64}}, {"geometry": {"coordinates": [114.22416, 30.655776], "type": "Point"}, "type": "Feature", "properties": {"h": 50.26}}, {"geometry": {"coordinates": [114.219767, 30.65409], "type": "Point"}, "type": "Feature", "properties": {"h": 41.78}}, {"geometry": {"coordinates": [114.220337, 30.65135], "type": "Point"}, "type": "Feature", "properties": {"h": 54.7}}, {"geometry": {"coordinates": [114.219561, 30.651218], "type": "Point"}, "type": "Feature", "properties": {"h": 46.56}}, {"geometry": {"coordinates": [114.22182, 30.651192], "type": "Point"}, "type": "Feature", "properties": {"h": 49.93}}, {"geometry": {"coordinates": [114.222564, 30.650807], "type": "Point"}, "type": "Feature", "properties": {"h": 51.54}}, {"geometry": {"coordinates": [114.223049, 30.652416], "type": "Point"}, "type": "Feature", "properties": {"h": 44.08}}, {"geometry": {"coordinates": [114.220374, 30.654738], "type": "Point"}, "type": "Feature", "properties": {"h": 56.97}}, {"geometry": {"coordinates": [114.219874, 30.655191], "type": "Point"}, "type": "Feature", "properties": {"h": 40.57}}, {"geometry": {"coordinates": [114.22045, 30.657204], "type": "Point"}, "type": "Feature", "properties": {"h": 41.99}}, {"geometry": {"coordinates": [114.219371, 30.650697], "type": "Point"}, "type": "Feature", "properties": {"h": 57.25}}, {"geometry": {"coordinates": [114.219665, 30.651865], "type": "Point"}, "type": "Feature", "properties": {"h": 42.38}}, {"geometry": {"coordinates": [114.222533, 30.655459], "type": "Point"}, "type": "Feature", "properties": {"h": 42.64}}, {"geometry": {"coordinates": [114.224, 30.651477], "type": "Point"}, "type": "Feature", "properties": {"h": 57.4}}, {"geometry": {"coordinates": [114.221281, 30.655946], "type": "Point"}, "type": "Feature", "properties": {"h": 45.02}}, {"geometry": {"coordinates": [114.22426, 30.654031], "type": "Point"}, "type": "Feature", "properties": {"h": 47.37}}, {"geometry": {"coordinates": [114.222134, 30.655665], "type": "Point"}, "type": "Feature", "properties": {"h": 41.96}}, {"geometry": {"coordinates": [114.219476, 30.652337], "type": "Point"}, "type": "Feature", "properties": {"h": 56.27}}, {"geometry": {"coordinates": [114.222892, 30.65658], "type": "Point"}, "type": "Feature", "properties": {"h": 55.73}}, {"geometry": {"coordinates": [114.222606, 30.655346], "type": "Point"}, "type": "Feature", "properties": {"h": 45.73}}, {"geometry": {"coordinates": [114.219823, 30.652069], "type": "Point"}, "type": "Feature", "properties": {"h": 47.56}}, {"geometry": {"coordinates": [114.22043, 30.655145], "type": "Point"}, "type": "Feature", "properties": {"h": 49.24}}, {"geometry": {"coordinates": [114.223594, 30.654088], "type": "Point"}, "type": "Feature", "properties": {"h": 55.0}}, {"geometry": {"coordinates": [114.221125, 30.656367], "type": "Point"}, "type": "Feature", "properties": {"h": 56.76}}, {"geometry": {"coordinates": [114.223733, 30.651918], "type": "Point"}, "type": "Feature", "properties": {"h": 40.88}}, {"geometry": {"coordinates": [114.224432, 30.650728], "type": "Point"}, "type": "Feature", "properties": {"h": 47.0}}, {"geometry": {"coordinates": [114.221749, 30.65615], "type": "Point"}, "type": "Feature", "properties": {"h": 50.29}}, {"geometry": {"coordinates": [114.221284, 30.652267], "type": "Point"}, "type": "Feature", "properties": {"h": 43.15}}, {"geometry": {"coordinates": [114.220601, 30.652257], "type": "Point"}, "type": "Feature", "properties": {"h": 55.19}}, {"geometry": {"coordinates": [114.220839, 30.651018], "type": "Point"}, "type": "Feature", "properties": {"h": 42.8}}, {"geometry": {"coordinates": [114.224388, 30.656922], "type": "Point"}, "type": "Feature", "properties": {"h": 40.69}}, {"geometry": {"coordinates": [114.219731, 30.656667], "type": "Point"}, "type": "Feature", "properties": {"h": 58.81}}, {"geometry": {"coordinates": [114.222953, 30.654684], "type": "Point"}, "type": "Feature", "properties": {"h": 59.26}}, {"geometry": {"coordinates": [114.22339, 30.65061], "type": "Point"}, "type": "Feature", "properties": {"h": 49.57}}, {"geometry": {"coordinates": [114.22487, 30.654446], "type": "Point"}, "type": "Feature", "properties": {"h": 44.79}}, {"geometry": {"coordinates": [114.219859, 30.653818], "type": "Point"}, "type": "Feature", "properties": {"h": 49.86}}, {"geometry": {"coordinates": [114.224654, 30.656399], "type": "Point"}, "type": "Feature", "properties": {"h": 45.33}}, {"geometry": {"coordinates": [114.223889, 30.651126], "type": "Point"}, "type": "Feature", "properties": {"h": 41.09}}, {"geometry": {"coordinates": [114.219701, 30.652585], "type": "Point"}, "type": "Feature", "properties": {"h": 56.67}}]}
                        // url: './change_point.geojson',
                    });
                    layer.setSource(pointGeo, {
                        unit: 'meter',
                        height: (index, feat) => {
                            return feat.properties.h * heightFactor;
                        },
                        color: (index, feat) => {
                            return ['#FF6F47', '#4FDDC7', '#4FDDC7'][index % 3];
                        },
                        lineWidth: 6,
                        trailLength: 300,
                        angle: 0,
                        duration: 1500,
                        interval: 1000,
                        repeat: Infinity,
                        delay: () => {
                            return Math.random() * 2000;
                        },
                    });

                    var geo = new Loca.GeoJSONSource({
                        url: 'https://a.amap.com/Loca/static/loca-v2/demos/mock_data/laser_soho.json',
                    });

                
                    loca.add(layer);


                    // 围栏
                    var outLayer = new Loca.PolygonLayer({
                        zIndex: 120,
                        cullface: 'none',
                        shininess: 1,
                        hasBottom: false,
                        blockHide: false,
                        hasSide: true,
                        hasTop: false,
                        depth: true,
                    });

                    var outGeo = new Loca.GeoJSONSource({
                        data:{
                            "type": "FeatureCollection",
                            "name": "out",
                            "crs": {
                                "type": "name",
                                "properties": {
                                    "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
                                }
                            },
                            "features": [
                                {
                                    "type": "Feature",
                                    "properties": {},
                                    "geometry": {
                                        "type": "Polygon",
                                        "coordinates": [
                                            [
                                                [
                                                    114.219115,30.655154 
                                                ],
                                                [
                                                    114.21918,30.650579 
                                                ],
                                                [
                                                    114.225161,30.650342
                                                ],
                                                [
                                                    114.225145,30.657337
                                                ],
                                                [
                                                    114.219115,30.655154
                                                ]
                                            ]
                                        ]
                                    }
                                }
                            ]
                        }
                        // url: 'https://a.amap.com/Loca/static/loca-v2/demos/mock_data/laser_out.json',
                    });
                    outLayer.setSource(outGeo);
                    outLayer.setStyle({
                        topColor: function (index, feature) {
                            return 'rgba(217,104,104,0.1)';
                        },
                        sideTopColor: function (index, feature) {
                            return 'rgba(217,104,104,0.1)';
                        },
                        sideBottomColor: function (index, feature) {
                            return 'rgba(237,87,87,1)';
                        },
                        height: 50,
                        altitude: 0,
                    });
                    loca.add(outLayer);

                    var top5 = new Loca.GeoJSONSource({
                        data: {
                            type: 'FeatureCollection',
                            features: [
                                {
                                    'geometry': {
                                        'coordinates': [114.224355,30.650821],
                                        'type': 'Point',
                                    },
                                    'type': 'Feature',
                                    'properties': {
                                        'h': 110,
                                        'p': 460,
                                    },
                                },
                                {
                                    'geometry': {
                                        'coordinates': [114.220693,30.654478 ],
                                        'type': 'Point',
                                    },
                                    'type': 'Feature',
                                    'properties': {
                                        'h': 130,
                                        'p': 120,
                                    },
                                },
                                {
                                    'geometry': {
                                        'coordinates': [114.222456,30.654777],
                                        'type': 'Point',
                                    },
                                    'type': 'Feature',
                                    'properties': {
                                        'h': 130,
                                        'p': 390,
                                    },
                                }
                            ],
                        },
                    });
                    var zMarker = new Loca.ZMarkerLayer({
                        zIndex: 120,
                        loca,
                    });
                    zMarker.setSource(top5);
                    zMarker.setStyle({
                        content: (i, feat) => {
                            var people = feat.properties.p;
                            return `<div>
                                <p style="width: 400px; height: 80px; line-height: 80px; font-size: 40px; background-image:linear-gradient(to right,rgba(30,215,196,0.4),rgba(30, 215, 196, 0.3),rgba(0,0,0,0.4)); border:4px solid rgba(30, 215, 196, 0.9); color:#fff; border-radius: 20px; text-align:center; margin:0;padding:0;">
                                人流量: ${people}
                                </p>
                            </div>
                            `;
                        },
                        unit: 'meter',
                        rotation: 0,
                        alwaysFront: true,
                        size: [400 * 2, 80 * 2],
                        altitude: (i, feat) => {
                            return feat.properties.h * heightFactor;
                        },
                    });
                    var pole = new Loca.LaserLayer({
                        zIndex: 120,
                        loca,
                        depth: false,
                    });
                    pole.setSource(top5, {
                        unit: 'meter',
                        height: (i, feat) => {
                            return feat.properties.h * heightFactor;
                        },
                        color: 'rgba(30,215,196, 1)',
                        lineWidth: 15,
                        trailLength: 50000,
                        repeat: 0,
                    });

                    loca.animate.start();
                    loca.pointLight.intensity = 0;
                    loca.ambLight.intensity = 1;


                    // // 给按钮绑定事件
                    // document.querySelector("#clickOn").addEventListener("click", clickOn);
                    // document.querySelector("#clickOff").addEventListener("click", clickOff);

                    function alive() {
                        map.render();
                        requestAnimationFrame(alive);
                    }
                    alive();
                    this.initGltf();
                    this.create_loca();
                })
                .catch(e => {
                    console.log(e);
                });
        },
        change() {
            this.height.value += 0.3;
            if (this.height.value > 75) {
                this.height.value = 0.0;
            }
            requestAnimationFrame(this.change);
        },
        initGltf() {
            const loader = new GLTFLoader();
            loader.load("wuhan.gltf", gltf => {
                gltf.scene.traverse(model => {
                    if (model.isMesh) {
                        this.city_line(model);
                        this.black_city(model);
                    }
                });
                gltf.scene.position.z = 10;
                object = gltf.scene;
                this.setRotation({
                    x: 90,
                    y: 0,
                    z: 0
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
            var position = customCoords.lngLatsToCoords(map_gltf_model_Position)[0];
            object.position.setX(position[0]);
            object.position.setY(position[1]);
        },
        city_line(model) {
            // 添加边框线
            const edges = new THREE.EdgesGeometry(model.geometry);
            const line = new THREE.LineSegments(
                edges,
                new THREE.LineBasicMaterial({
                    color: 0xbdbdbd
                })
            );
            model.add(line);
        },
        shadow_city(model) {
            // 添加阴影
            const shadow = new THREE.Mesh(
                model.geometry,
                new THREE.MeshBasicMaterial({
                    color: 0x000000,
                    transparent: true,
                    opacity: 0.3
                })
            );
            shadow.position.y = -0.1;
            shadow.rotation.x = -Math.PI / 2;
            model.add(shadow);
        },
        white_city(model) {
            const shaderMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    height: this.height,
                    uColor: { value: new THREE.Color(0xffffff) }, // 初始颜色为白色
                    uHeight: { value: model.geometry.boundingBox.getSize(new THREE.Vector3()).y },
                    uFlowColor: {
                        value: new THREE.Color("#FFFFFF")
                    }
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
                vec3 distColor = mix(vec3(0.97, 0.99, 1.0), uColor, vPosition);
                // 计算流动范围当前点z的高度加上流动线的高度
                float topY = vPoint.z + 5.0;
                if (height > vPoint.z && height < topY) {
                    // 颜色渐变 
                    float dIndex = sin((height - vPoint.z) / 5.0 * 3.14);
                    distColor = mix(uFlowColor, distColor, 1.0-dIndex);
                //   distColor = uFlowColor; 
                }
                gl_FragColor = vec4(distColor, 0.8); 
                // gl_FragColor = vec4(mix(vec3(0.97, 0.99, 1.0), uColor, vPosition), 1.0); // 通过mix函数混合两个颜色，达到渐变效果
            }
            `
            });
            model.material = shaderMaterial;
        },
        black_city(model) {
            const shaderMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    height: this.height,
                    uColor: { value: new THREE.Color(0xffffff) }, // 初始颜色为白色
                    uHeight: { value: model.geometry.boundingBox.getSize(new THREE.Vector3()).y },
                    uFlowColor: {
                        value: new THREE.Color("#FFFFFF")
                    }
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
                    float dIndex = sin((height - vPoint.z) / 5.0 * 3.14);
                    distColor = mix(uFlowColor, distColor, 1.0-dIndex);
                //   distColor = uFlowColor; 
                }
                gl_FragColor = vec4(distColor, 0.8); 
                // gl_FragColor = vec4(mix(vec3(0.0, 0.4, 1.0), uColor, vPosition), 0.9); // 通过mix函数混合两个颜色，达到渐变效果
            }
            `,
                transparent: true
            });
            model.material = shaderMaterial;
        },
        create_loca() {
            var loca = new Loca.Container({
                map
            });

            loca.ambLight = {
                intensity: 0.3,
                color: "#fff"
            };
            loca.dirLight = {
                intensity: 1.2,
                color: "#fff",
                target: [0, 1, 0],
                position: [0, -1, 1]
            };
            loca.pointLight = {
                color: "rgb(100,100,100)",
                position: [114.2517, 30.552128, 20000],
                intensity: 1.6,
                // 距离表示从光源到光照强度为 0 的位置，0 就是光不会消失。
                distance: 100000
            };

            var geo = new Loca.GeoJSONSource({
                url: "https://a.amap.com/Loca/static/loca-v2/demos/mock_data/wh_car.json"
            });

            var ll = new Loca.GridLayer({
                // loca,
                zIndex: 0,
                opacity: 0.5,
                visible: true,
                zooms: [2, 22],
                acceptLight: true,
                shinniness: 0,
                cullface: "none",
                depth: true,
                hasSide: true
            });

            var colors = ["#FAE200", "#D27E37", "#C53634", "#C12B6E", "#A92E9A", "#67238A", "#211A50", "#18244E"].reverse();
            var heights = [100, 200, 400, 600, 800, 1400, 1800, 4000];
            ll.setSource(geo);
            ll.setStyle({
                unit: "meter",
                radius: 66,
                gap: 0,
                altitude: 100,
                height: function(index, feature) {
                    var ranks = (feature.coordinates && feature.coordinates.length) || 0;
                    return ranks < 5
                        ? heights[0]
                        : ranks < 10
                        ? heights[1]
                        : ranks < 20
                        ? heights[2]
                        : ranks < 30
                        ? heights[3]
                        : ranks < 50
                        ? heights[4]
                        : ranks < 80
                        ? heights[5]
                        : ranks < 100
                        ? heights[6]
                        : heights[7];
                },
                topColor: function(index, feature) {
                    var ranks = (feature.coordinates && feature.coordinates.length) || 0;
                    return ranks < 5
                        ? colors[0]
                        : ranks < 10
                        ? colors[1]
                        : ranks < 20
                        ? colors[2]
                        : ranks < 30
                        ? colors[3]
                        : ranks < 50
                        ? colors[4]
                        : ranks < 80
                        ? colors[5]
                        : ranks < 100
                        ? colors[6]
                        : colors[7];
                },
                sideTopColor: function(index, feature) {
                    var ranks = (feature.coordinates && feature.coordinates.length) || 0;
                    return ranks < 5
                        ? colors[0]
                        : ranks < 10
                        ? colors[1]
                        : ranks < 20
                        ? colors[2]
                        : ranks < 30
                        ? colors[3]
                        : ranks < 50
                        ? colors[4]
                        : ranks < 80
                        ? colors[5]
                        : ranks < 100
                        ? colors[6]
                        : colors[7];
                },
                sideBottomColor: function(index, feature) {
                    var ranks = (feature.coordinates && feature.coordinates.length) || 0;
                    return ranks < 5
                        ? colors[0]
                        : ranks < 10
                        ? colors[1]
                        : ranks < 20
                        ? colors[2]
                        : ranks < 30
                        ? colors[3]
                        : ranks < 50
                        ? colors[4]
                        : ranks < 80
                        ? colors[5]
                        : ranks < 100
                        ? colors[6]
                        : colors[7];
                }
            });
            loca.add(ll);

            // 围栏
            var outLayer = new Loca.PolygonLayer({
                zIndex: 120,
                cullface: "none",
                shininess: 1,
                hasBottom: false,
                blockHide: false,
                hasSide: true,
                hasTop: false,
                depth: true
            });
            var outGeo = new Loca.GeoJSONSource({
                url: "https://a.amap.com/Loca/static/loca-v2/demos/mock_data/laser_out.json"
            });
            outLayer.setSource(outGeo);
            outLayer.setStyle({
                topColor: function(index, feature) {
                    return "rgba(217,104,104,0.1)";
                },
                sideTopColor: function(index, feature) {
                    return "rgba(217,104,104,0.1)";
                },
                sideBottomColor: function(index, feature) {
                    return "rgba(237,87,87,1)";
                },
                height: 100,
                altitude: 0
            });
            loca.add(outLayer);

            // 图例
            var lengend = new Loca.Legend({
                loca: loca,
                title: {
                    label: "车辆密度(辆)",
                    fontColor: "rgba(255,255,255,0.4)",
                    fontSize: "16px"
                },
                style: {
                    backgroundColor: "rgba(255,255,255,0.1)",
                    left: "20px",
                    bottom: "40px",
                    fontSize: "12px"
                },
                dataMap: [
                    { label: 100, color: colors[7] },
                    { label: 80, color: colors[6] },
                    { label: 50, color: colors[5] },
                    { label: 40, color: colors[4] },
                    { label: 30, color: colors[3] },
                    { label: 20, color: colors[2] },
                    { label: 10, color: colors[1] },
                    { label: 5, color: colors[0] }
                ]
            });

            // 控制条
            var dat = new Loca.Dat();
            dat.addLight(loca.ambLight, loca, "环境光");
            dat.addLight(loca.dirLight, loca, "平行光");
            dat.addLight(loca.pointLight, loca, "点光");
            dat.addLayer(ll, "车辆图层");
        }
    },
    data() {
        return {
            height: {
                value: 0
            },
            color: "#1791fc",
            opacity: 0,
        };
    }
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

<style lang="less" scoped></style>
