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

                    var layer = new Loca.LaserLayer({
                        zIndex: 130,
                        opacity: 1,
                        visible: true,
                        depth: true,
                        zooms: [2, 26],
                    });

                    var heightFactor = 9;

                    var pointGeo = new Loca.GeoJSONSource({
                        data: {"type": "FeatureCollection", "features": [{"geometry": {"coordinates": [114.219429, 30.652739], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.22288, 30.655313], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.219813, 30.655191], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.224208, 30.65229], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.219991, 30.65527], "type": "Point"}, "type": "Feature", "properties": {"h": 110}}, {"geometry": {"coordinates": [114.223909, 30.651597], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.220475, 30.654434], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.221352, 30.655939], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.22398, 30.656456], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.219654, 30.654095], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.222668, 30.651227], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.222933, 30.653538], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.220661, 30.656649], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.223264, 30.650992], "type": "Point"}, "type": "Feature", "properties": {"h": 110}}, {"geometry": {"coordinates": [114.223116, 30.653767], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.220482, 30.652794], "type": "Point"}, "type": "Feature", "properties": {"h": 130}}, {"geometry": {"coordinates": [114.224844, 30.656648], "type": "Point"}, "type": "Feature", "properties": {"h": 110}}, {"geometry": {"coordinates": [114.219688, 30.655572], "type": "Point"}, "type": "Feature", "properties": {"h": 110}}, {"geometry": {"coordinates": [114.223688, 30.65615], "type": "Point"}, "type": "Feature", "properties": {"h": 110}}, {"geometry": {"coordinates": [114.220671, 30.65226], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.224935, 30.654313], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.222847, 30.653438], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.220218, 30.654016], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.225059, 30.65077], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.221368, 30.653451], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.224302, 30.655997], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.222514, 30.65618], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.222906, 30.655799], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.219984, 30.655806], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.220394, 30.65724], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.219598, 30.655183], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.223376, 30.655321], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.223282, 30.653629], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.222593, 30.652207], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.219344, 30.652305], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.224662, 30.656822], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.223221, 30.652681], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.219511, 30.651425], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.224459, 30.65438], "type": "Point"}, "type": "Feature", "properties": {"h": 102}}, {"geometry": {"coordinates": [114.221084, 30.653471], "type": "Point"}, "type": "Feature", "properties": {"h": 110}}, {"geometry": {"coordinates": [114.22453, 30.657142], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.221712, 30.650727], "type": "Point"}, "type": "Feature", "properties": {"h": 102}}, {"geometry": {"coordinates": [114.220382, 30.654546], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.222012, 30.65514], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.219547, 30.653829], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.221745, 30.653275], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.222477, 30.656329], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.220493, 30.656345], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.21975, 30.652852], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.224716, 30.650927], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.220008, 30.653819], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.220754, 30.656307], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.224293, 30.652949], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.220831, 30.657369], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.224178, 30.656483], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.221415, 30.65717], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.221812, 30.655787], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.22024, 30.656371], "type": "Point"}, "type": "Feature", "properties": {"h": 102}}, {"geometry": {"coordinates": [114.222333, 30.654557], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.22447, 30.653513], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.221716, 30.654696], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.223084, 30.656689], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.222604, 30.654025], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.220447, 30.651048], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.22114, 30.654917], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.223647, 30.654498], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.222295, 30.652073], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.219661, 30.657233], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.221287, 30.655917], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.221101, 30.65223], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.223849, 30.651194], "type": "Point"}, "type": "Feature", "properties": {"h": 110}}, {"geometry": {"coordinates": [114.224183, 30.655005], "type": "Point"}, "type": "Feature", "properties": {"h": 102}}, {"geometry": {"coordinates": [114.220097, 30.657354], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.224153, 30.653957], "type": "Point"}, "type": "Feature", "properties": {"h": 110}}, {"geometry": {"coordinates": [114.224673, 30.65389], "type": "Point"}, "type": "Feature", "properties": {"h": 110}}, {"geometry": {"coordinates": [114.221297, 30.657026], "type": "Point"}, "type": "Feature", "properties": {"h": 110}}, {"geometry": {"coordinates": [114.224314, 30.654795], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.224451, 30.654565], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.224866, 30.656558], "type": "Point"}, "type": "Feature", "properties": {"h": 170}}, {"geometry": {"coordinates": [114.219438, 30.656082], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.224397, 30.65583], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.22078, 30.653432], "type": "Point"}, "type": "Feature", "properties": {"h": 110}}, {"geometry": {"coordinates": [114.224736, 30.656857], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.220651, 30.657075], "type": "Point"}, "type": "Feature", "properties": {"h": 110}}, {"geometry": {"coordinates": [114.222826, 30.651206], "type": "Point"}, "type": "Feature", "properties": {"h": 102}}, {"geometry": {"coordinates": [114.220683, 30.652358], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.221114, 30.651229], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.22183, 30.656067], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.221779, 30.653243], "type": "Point"}, "type": "Feature", "properties": {"h": 102}}, {"geometry": {"coordinates": [114.222389, 30.65493], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.224893, 30.65228], "type": "Point"}, "type": "Feature", "properties": {"h": 110}}, {"geometry": {"coordinates": [114.224269, 30.656881], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.21945, 30.653252], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.222811, 30.656713], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.221959, 30.65442], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.222104, 30.651849], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.221462, 30.654296], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.220479, 30.6556], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.224519, 30.656816], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.222978, 30.654094], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.222582, 30.651154], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.220295, 30.652581], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.221556, 30.657163], "type": "Point"}, "type": "Feature", "properties": {"h": 102}}, {"geometry": {"coordinates": [114.223633, 30.654406], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.222095, 30.657177], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.224148, 30.655999], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.221929, 30.655276], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.222644, 30.653693], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.222274, 30.653926], "type": "Point"}, "type": "Feature", "properties": {"h": 102}}, {"geometry": {"coordinates": [114.222187, 30.655438], "type": "Point"}, "type": "Feature", "properties": {"h": 102}}, {"geometry": {"coordinates": [114.222473, 30.652941], "type": "Point"}, "type": "Feature", "properties": {"h": 102}}, {"geometry": {"coordinates": [114.222993, 30.654517], "type": "Point"}, "type": "Feature", "properties": {"h": 102}}, {"geometry": {"coordinates": [114.224445, 30.653092], "type": "Point"}, "type": "Feature", "properties": {"h": 102}}, {"geometry": {"coordinates": [114.224962, 30.656724], "type": "Point"}, "type": "Feature", "properties": {"h": 102}}, {"geometry": {"coordinates": [114.223381, 30.654384], "type": "Point"}, "type": "Feature", "properties": {"h": 102}}, {"geometry": {"coordinates": [114.220572, 30.652159], "type": "Point"}, "type": "Feature", "properties": {"h": 102}}, {"geometry": {"coordinates": [114.220623, 30.651445], "type": "Point"}, "type": "Feature", "properties": {"h": 150}}, {"geometry": {"coordinates": [114.221548, 30.655971], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.224844, 30.652943], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.224312, 30.65333], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.220524, 30.657177], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.222713, 30.652776], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.223652, 30.655646], "type": "Point"}, "type": "Feature", "properties": {"h": 102}}, {"geometry": {"coordinates": [114.222438, 30.651576], "type": "Point"}, "type": "Feature", "properties": {"h": 110}}, {"geometry": {"coordinates": [114.219462, 30.656676], "type": "Point"}, "type": "Feature", "properties": {"h": 102}}, {"geometry": {"coordinates": [114.224695, 30.651439], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.221758, 30.650932], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.220861, 30.657234], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.21964, 30.65135], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.222851, 30.652572], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.219948, 30.651259], "type": "Point"}, "type": "Feature", "properties": {"h": 84}}, {"geometry": {"coordinates": [114.223885, 30.651978], "type": "Point"}, "type": "Feature", "properties": {"h": 102}}, {"geometry": {"coordinates": [114.224647, 30.652493], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.224918, 30.655026], "type": "Point"}, "type": "Feature", "properties": {"h": 108}}, {"geometry": {"coordinates": [114.221571, 30.654266], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.225039, 30.653347], "type": "Point"}, "type": "Feature", "properties": {"h": 120}}, {"geometry": {"coordinates": [114.223734, 30.653608], "type": "Point"}, "type": "Feature", "properties": {"h": 110}}, {"geometry": {"coordinates": [114.223554, 30.652732], "type": "Point"}, "type": "Feature", "properties": {"h": 110}}, {"geometry": {"coordinates": [114.221314, 30.656594], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.220922, 30.651848], "type": "Point"}, "type": "Feature", "properties": {"h": 110}}, {"geometry": {"coordinates": [114.223765, 30.652583], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}, {"geometry": {"coordinates": [114.223193, 30.652528], "type": "Point"}, "type": "Feature", "properties": {"h": 110}}, {"geometry": {"coordinates": [114.224675, 30.651188], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.224253, 30.65689], "type": "Point"}, "type": "Feature", "properties": {"h": 90}}, {"geometry": {"coordinates": [114.2205, 30.653615], "type": "Point"}, "type": "Feature", "properties": {"h": 96}}]}
                        // url: 'https://a.amap.com/Loca/static/loca-v2/demos/mock_data/laser_point.json',
                    });
                    layer.setSource(pointGeo, {
                        unit: 'meter',
                        height: (index, feat) => {
                            return feat.properties.h * heightFactor;
                        },
                        color: (index, feat) => {
                            return ['#FF6F47', '#4FDDC7', '#4FDDC7'][index % 3];
                        },
                        lineWidth: 12,
                        trailLength: 600,
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
                        url: 'https://a.amap.com/Loca/static/loca-v2/demos/mock_data/laser_out.json',
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
                        height: 100,
                        altitude: 0,
                    });
                    loca.add(outLayer);

                    var top5 = new Loca.GeoJSONSource({
                        data: {
                            type: 'FeatureCollection',
                            features: [
                                {
                                    'geometry': {
                                        'coordinates': [116.467041, 39.997771],
                                        'type': 'Point',
                                    },
                                    'type': 'Feature',
                                    'properties': {
                                        'h': 110,
                                    },
                                },
                                {
                                    'geometry': {
                                        'coordinates': [116.45981, 39.992648],
                                        'type': 'Point',
                                    },
                                    'type': 'Feature',
                                    'properties': {
                                        'h': 130,
                                    },
                                },
                                {
                                    'geometry': {
                                        'coordinates': [116.48469, 39.998533],
                                        'type': 'Point',
                                    },
                                    'type': 'Feature',
                                    'properties': {
                                        'h': 170,
                                    },
                                },
                                {
                                    'geometry': {
                                        'coordinates': [116.497672, 39.992139],
                                        'type': 'Point',
                                    },
                                    'type': 'Feature',
                                    'properties': {
                                        'h': 150,
                                    },
                                },
                                {
                                    'geometry': {
                                        'coordinates': [116.504495, 39.97537],
                                        'type': 'Point',
                                    },
                                    'type': 'Feature',
                                    'properties': {
                                        'h': 120,
                                    },
                                },
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
                            var height = feat.properties.h * heightFactor;
                            return `<div>
                                <p style="width: 400px; height: 80px; line-height: 80px; font-size: 40px; background-image:linear-gradient(to right,rgba(30,215,196,0.4),rgba(30, 215, 196, 0.3),rgba(0,0,0,0.4)); border:4px solid rgba(30, 215, 196, 0.9); color:#fff; border-radius: 20px; text-align:center; margin:0;padding:0;">
                                高度: ${height}
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
