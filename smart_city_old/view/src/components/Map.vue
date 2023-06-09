<template>
    <div class="com-container">
        <div class="com-chart" ref="mapRef">
            <div id="MapContainer"></div>
            <div class="input-card">
                <div class="input-item">
                    <button class="btn" @click="show_road_condition()">实时路况</button>
                    <button class="btn" @click="show_average_traffic_flow()">日均车流</button>
                    <button class="btn" @click="show_3D_map()">3D模型</button>
                    <button class="btn" @click="show_people_out()">人口流出</button>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { mapState } from "vuex";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import AMapLoader from "@amap/amap-jsapi-loader"; // 高德地图
import Stats from "three/examples/jsm/libs/stats.module"; // 性能监视器
import EventBus from "@/event-bus";
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
let st1 = false;
let pol_lib;
let pol_market;
let zMarker1;
let ii = 0;
let avg_tf_loca, people_out_loca; // 日平均车流, 人口流出情况
let trafficLayer; // 路况对象
let show_road_condition_var = false,
    show_3D_map_exist = false,
    show_people_out_exist = false, // 路况信息是否存在
    show_average_traffic_flow_exist = false; // 车流
export default {
    computed: {
        ...mapState(["theme"]),
    },
    watch: {
        theme() {
            this.changeTheme();
        },
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
            // var stats = new Stats();
            // stats.showPanel(0);
            // document.body.appendChild(stats.dom);
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
                        showLabel: true, //设置文字标注
                    });
                    this.changeTheme(); // 跟随全局主题设置
                    var scale = new AMap.Scale();
                    map.addControl(scale); // 添加比例尺控件
                    var ToolBar = new AMap.ToolBar();
                    map.addControl(ToolBar); // 缩放工具条

                    // 路况信息
                    trafficLayer = new AMap.TileLayer.Traffic();
                    trafficLayer.setMap(map);
                    trafficLayer.hide();

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
                            // stats.update();
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
                        },
                    });
                    map.add(gllayer);

                    // 隐藏按钮的添加（实际上是添加了个透明的图标，供人点击）
                    var icon = new AMap.Icon({
                        image: "none.png", // 图标的图片
                        size: new AMap.Size(50, 50), // 图标的尺寸，这里将宽度和高度均设为32，可以根据需要调整大小
                        imageSize: new AMap.Size(256, 256), // 图标所用图片的大小
                    });

                    var big_icon = new AMap.Icon({
                        image: "none.png", // 图标的图片
                        size: new AMap.Size(200, 200), // 图标的尺寸，这里将宽度和高度均设为32，可以根据需要调整大小
                        imageSize: new AMap.Size(256, 256), // 图标所用图片的大小
                    });

                    // 图书馆的标记点
                    var marker_lib = new AMap.Marker({
                        map: map,
                        icon: icon,
                        position: [114.222004, 30.6525],
                    });

                    // 商场的标记点
                    var marker_market = new AMap.Marker({
                        map: map,
                        icon: icon,
                        position: [114.237741, 30.650317],
                    });

                    // 交通枢纽的标记点
                    var marker_traffic = new AMap.Marker({
                        map: map,
                        icon: big_icon,
                        position: [ 114.270521,30.618645 ],
                    });

                    // 图书馆鼠标点击范围的设置
                    var polygonArr_lib = [
                        [114.222285, 30.653019],
                        [114.222279, 30.652661],
                        [114.222309, 30.652662],
                        [114.222308, 30.652517],
                        [114.22168, 30.652521],
                        [114.221683, 30.652347],
                        [114.221645, 30.652348],
                        [114.221652, 30.652295],
                        [114.221763, 30.652291],
                        [114.221764, 30.652333],
                        [114.221804, 30.652332],
                        [114.221814, 30.652259],
                        [114.221859, 30.65217],
                        [114.221936, 30.652123],
                        [114.222063, 30.652089],
                        [114.222168, 30.652108],
                        [114.222276, 30.652162],
                        [114.222306, 30.652231],
                        [114.222448, 30.652227],
                        [114.222461, 30.652007],
                        [114.222563, 30.652007],
                        [114.222559, 30.652762],
                        [114.222574, 30.652807],
                        [114.222566, 30.652873],
                        [114.222513, 30.652928],
                        [114.222517, 30.653012],
                        [114.222285, 30.653019],
                    ];

                    // 商场鼠标点击范围的设置
                    var polygonArr_market = [
                        [114.235541, 30.650994],
                        [114.23545, 30.649432],
                        [114.237969, 30.649387],
                        [114.238093, 30.649393],
                        [114.239844, 30.649785],
                        [114.240469, 30.649975],
                        [114.239935, 30.651459],
                        [114.238743, 30.651151],
                        [114.238086, 30.651028],
                        [114.237363, 30.650966],
                        [114.236517, 30.650983],
                        [114.235541, 30.650994],
                    ];

                    map.setFitView();

                    pol_market = new AMap.Polygon({
                        map: map,
                        path: polygonArr_market, //设置多边形边界路径
                        strokeColor: "#FF33FF", //线颜色
                        strokeOpacity: 0.2, //线透明度
                        strokeWeight: 3, //线宽
                        fillColor: "#1791fc", //填充色
                        fillOpacity: 0.35, //填充透明度
                    });

                    pol_lib = new AMap.Polygon({
                        map: map,
                        path: polygonArr_lib, //设置多边形边界路径
                        strokeColor: "#FF33FF", //线颜色
                        strokeOpacity: 0.2, //线透明度
                        strokeWeight: 3, //线宽
                        fillColor: "#1791fc", //填充色
                        fillOpacity: 0.35, //填充透明度
                    });

                    map.remove(pol_lib);
                    map.remove(pol_market);

                    marker_lib.on("click", showInfoClick);
                    marker_market.on("click", showInfoClick1);
                    marker_traffic.on("click", showInfoClick2);

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

                    // 图书馆触发事件
                    function showInfoClick(e) {
                        // console.log("您在 [ " + e.lnglat.getLng() + "," + e.lnglat.getLat() + " ] 的位置单击了地图！");
                        // 触发一个名为'change-data-url-lib-p-w-e'的自定义事件，用于更换趋势图的数据源
                        EventBus.$emit("change-data-url-lib-p-w-e", "/lib_people_w_e");
                        // 触发一个名为'change-data-url-p-c'的自定义事件，用于更换饼图的数据源
                        EventBus.$emit("change-data-url-p-c", "/lib_pie_chart");
                        // 触发一个名为'change-data-url-s'的自定义事件，用于更换条形图的数据源
                        EventBus.$emit("change-data-url-s", "/lib_seller");
                        // 触发一个名为'change-data-url-huan'的自定义事件，用于更换环形图的数据源
                        EventBus.$emit("change-data-url-huan", "/lib_stock");
                        change_polygon();
                    }

                    // 控制图书馆附近的多边形是否显示
                    function change_polygon() {
                        if (st == false) {
                            map.add(pol_lib);
                            st = true;
                        } else {
                            st = false;
                            map.remove(pol_lib);
                        }
                    }

                    // 商场的触发事件
                    function showInfoClick1(e) {
                        // console.log("您在 [ " + e.lnglat.getLng() + "," + e.lnglat.getLat() + " ] 的位置单击了地图！");
                        // 触发一个名为'change-data-url-lib-p-w-e'的自定义事件，用于更换趋势图的数据源
                        EventBus.$emit("change-data-url-mar", "/market_people_w_e");
                        // 触发一个名为'change-data-url-p-c'的自定义事件，用于更换饼图的数据源
                        EventBus.$emit("change-data-url-chat", "/market_pie_chart");
                        // 触发一个名为'change-data-url-s'的自定义事件，用于更换条形图的数据源
                        EventBus.$emit("change-data-url-m_s", "/market_seller");
                        // 触发一个名为'change-data-url-huan'的自定义事件，用于更换环形图的数据源
                        EventBus.$emit("change-data-url-m-sk", "/market_stock");
                        change_polygon1();
                    }

                    // 控制商场附近的多边形是否显示
                    function change_polygon1() {
                        if (st1 == false) {
                            map.add(pol_market);
                            st1 = true;
                        } else {
                            st1 = false;
                            map.remove(pol_market);
                        }
                    }

                    // 交通枢纽的触发事件
                    function showInfoClick2(e) {
                        // console.log("您在 [ " + e.lnglat.getLng() + "," + e.lnglat.getLat() + " ] 的位置单击了地图！");
                        // 触发一个名为'change-data-url-lib-p-w-e'的自定义事件，用于更换趋势图的数据源
                        EventBus.$emit("change-data-url-triffic", "/traffic_car_qushi");
                        // 触发一个名为'change-data-url-p-c'的自定义事件，用于更换饼图的数据源
                        EventBus.$emit("change-data-url-triffic-chat", "/traffic_pie_chart");
                        // 触发一个名为'change-data-url-s'的自定义事件，用于更换条形图的数据源
                        EventBus.$emit("change-data-url-traffic-rank", "/traffic_rank");
                        // 触发一个名为'change-data-url-huan'的自定义事件，用于更换环形图的数据源
                        EventBus.$emit("change-data-url-traffic-huan", "/traffic_huan");
                        // change_polygon1();
                    }

                    var loca = new Loca.Container({
                        map,
                    });

                    var geo = new Loca.GeoJSONSource({
                        data: {
                            type: "FeatureCollection",
                            features: [
                                {
                                    type: "Feature",
                                    geometry: {
                                        type: "Point",
                                        coordinates: [114.222131, 30.652322],
                                    },
                                    properties: {
                                        name: "武汉轻工大学图书馆",
                                        price: 55000,
                                        count: 92,
                                    },
                                },
                                {
                                    type: "Feature",
                                    geometry: {
                                        type: "Point",
                                        coordinates: [114.237858, 30.650277],
                                    },
                                    properties: {
                                        name: "永旺梦乐城",
                                        price: 65000,
                                        count: 92,
                                    },
                                },
                            ],
                        },
                    });

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
                            var leftColor = props.price < 60000 ? "rgba(0, 28, 52, 0.6)" : "rgba(33,33,33,0.6)";
                            var rightColor = props.price < 60000 ? "#038684" : "rgba(172, 137, 51, 0.3)";
                            var borderColor = props.price < 60000 ? "#038684" : "rgba(172, 137, 51, 1)";
                            return (
                                '<div style="width: 490px; height: 228px; padding: 0 0;">' +
                                '<p style="display: block; height:80px; line-height:80px;font-size:40px;background-image: linear-gradient(to right, ' +
                                leftColor +
                                "," +
                                leftColor +
                                "," +
                                rightColor +
                                ",rgba(0,0,0,0.4)); border:4px solid " +
                                borderColor +
                                '; color:#fff; border-radius: 15px; text-align:center; margin:0; padding:5px;">' +
                                props["name"] +
                                '</p><span style="width: 130px; height: 130px; margin: 0 auto; display: block; background: url(https://a.amap.com/Loca/static/loca-v2/demos/images/prism_' +
                                (props["price"] < 60000 ? "blue" : "yellow") +
                                '.png);"></span></div>'
                            );
                        },
                        unit: "meter",
                        rotation: 0,
                        alwaysFront: true,
                        size: [490 / 2, 222 / 2],
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
                                '<div style="width: 120px; height: 120px; background: url(https://a.amap.com/Loca/static/loca-v2/demos/images/triangle_' +
                                (feat.properties.price < 60000 ? "blue" : "yellow") +
                                '.png);"></div>'
                            );
                        },
                        unit: "meter",
                        rotation: 0,
                        alwaysFront: true,
                        size: [60, 60],
                        altitude: 15,
                    });
                    triangleZMarker.addAnimate({
                        key: "altitude",
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
                        unit: "meter",
                        size: function (i, feat) {
                            return feat.properties.price < 60000 ? [90, 90] : [0, 0];
                        },
                        texture: "https://a.amap.com/Loca/static/loca-v2/demos/images/scan_blue.png",
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
                        depth: false,
                    });

                    scatterYellow.setSource(geo);
                    scatterYellow.setStyle({
                        unit: "meter",
                        size: function (i, feat) {
                            return feat.properties.price > 60000 ? [90, 90] : [0, 0];
                        },
                        texture: "https://a.amap.com/Loca/static/loca-v2/demos/images/scan_yellow.png",
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
                        data: {
                            type: "FeatureCollection",
                            features: [
                                { geometry: { coordinates: [114.268444, 30.61491], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.270086, 30.617076], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.26647, 30.620838], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.272498, 30.617599], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.268601, 30.618755], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.267043, 30.617183], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.271801, 30.617092], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.272844, 30.616014], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.266397, 30.619699], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.269792, 30.616536], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.270224, 30.615688], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.268696, 30.61432], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.272813, 30.61921], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.271578, 30.616419], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.27221, 30.614348], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.271962, 30.614814], type: "Point" }, type: "Feature", properties: { h: 130 } },
                                { geometry: { coordinates: [114.269345, 30.618682], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.269141, 30.615005], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.270785, 30.614516], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.266956, 30.615668], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.26633, 30.618295], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.269889, 30.618679], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.270918, 30.621096], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.272692, 30.617801], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.269149, 30.617049], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.267032, 30.617775], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.269865, 30.619758], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.266274, 30.617564], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.27188, 30.615717], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.268406, 30.614958], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.269934, 30.617983], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.270423, 30.617583], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.26927, 30.614572], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.271326, 30.616123], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.27221, 30.618918], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.27218, 30.62016], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.272618, 30.620951], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.268908, 30.621179], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.269483, 30.618053], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.266749, 30.617893], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.272083, 30.617952], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.267179, 30.618576], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.267985, 30.616829], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.268567, 30.616264], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.268852, 30.619148], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.272841, 30.620126], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.268572, 30.617343], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.270188, 30.620577], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.26932, 30.621078], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.270517, 30.614704], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.271236, 30.618497], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.271906, 30.616445], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.268803, 30.615218], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.272133, 30.616888], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.268362, 30.620459], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.272505, 30.620886], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.272026, 30.617075], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.272558, 30.618856], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.266351, 30.620048], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.27197, 30.619034], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.266134, 30.617457], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.269797, 30.617776], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.270573, 30.614657], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.266508, 30.615167], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.269955, 30.617371], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.266186, 30.620192], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.270207, 30.61949], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.26611, 30.621453], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.267182, 30.620714], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.271041, 30.620202], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.268299, 30.620658], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.270213, 30.615223], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.266442, 30.62018], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.271094, 30.61735], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.268562, 30.618537], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.271035, 30.619551], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.26706, 30.619138], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.270732, 30.616779], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.267299, 30.616401], type: "Point" }, type: "Feature", properties: { h: 170 } },
                                { geometry: { coordinates: [114.271697, 30.620633], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.271928, 30.619671], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.272564, 30.617566], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.272292, 30.619622], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.266777, 30.614796], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.269527, 30.617241], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.27038, 30.614484], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.26757, 30.618951], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.272598, 30.616455], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.269316, 30.615606], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.267006, 30.620038], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.266913, 30.619905], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.267695, 30.618136], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.268181, 30.61523], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.266143, 30.619981], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.267959, 30.620634], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.266122, 30.616826], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.272137, 30.617439], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.2732, 30.616721], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.266376, 30.620153], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.268873, 30.61785], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.270616, 30.614919], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.2694, 30.620178], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.270813, 30.619067], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.266974, 30.615257], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.268051, 30.615338], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.26915, 30.618484], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.269991, 30.619001], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.271441, 30.616484], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.266898, 30.616043], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.266924, 30.614644], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.269859, 30.6215], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.269911, 30.619217], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.267179, 30.615913], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.268782, 30.619587], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.267098, 30.620389], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.269757, 30.619935], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.272253, 30.617476], type: "Point" }, type: "Feature", properties: { h: 150 } },
                                { geometry: { coordinates: [114.267096, 30.620486], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.270384, 30.619503], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.271821, 30.620612], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.27172, 30.619062], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.272334, 30.62067], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.26701, 30.620935], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.268678, 30.61484], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.272403, 30.615053], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.268007, 30.620769], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.271071, 30.621127], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.266249, 30.616957], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.272538, 30.616227], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.272184, 30.6147], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.267642, 30.61979], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.272969, 30.619372], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.269838, 30.615024], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.270713, 30.615289], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.268257, 30.614907], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.27207, 30.618904], type: "Point" }, type: "Feature", properties: { h: 120 } },
                                { geometry: { coordinates: [114.271583, 30.618192], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.269526, 30.619448], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.26615, 30.61577], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.268084, 30.621472], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.271922, 30.617974], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.270269, 30.617689], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.267594, 30.617016], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.271553, 30.61465], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.271897, 30.619729], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.275059, 30.61592], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.273978, 30.616883], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.274179, 30.616184], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.274336, 30.616188], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.27541, 30.61644], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.274256, 30.616306], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.275732, 30.616], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.274724, 30.615789], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.276118, 30.616165], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.273747, 30.61649], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.274243, 30.616824], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.274614, 30.615779], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.27407, 30.616712], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.275898, 30.61577], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.274988, 30.61633], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.273863, 30.616774], type: "Point" }, type: "Feature", properties: { h: 130 } },
                                { geometry: { coordinates: [114.275173, 30.615968], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.273957, 30.616048], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.273972, 30.616055], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.274278, 30.61668], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.274693, 30.6163], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.273682, 30.616308], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.273731, 30.616173], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.275619, 30.616761], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.274969, 30.616745], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.276051, 30.61659], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.27366, 30.616355], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.275779, 30.616317], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.274882, 30.615899], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.274945, 30.61662], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.27465, 30.616814], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.274933, 30.615904], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.273703, 30.616735], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.274483, 30.616745], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.274078, 30.616777], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.275908, 30.61615], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.275541, 30.616459], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.274349, 30.616866], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.273609, 30.61584], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.275315, 30.615745], type: "Point" }, type: "Feature", properties: { h: 110 } },
                                { geometry: { coordinates: [114.275732, 30.616866], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.2742, 30.61657], type: "Point" }, type: "Feature", properties: { h: 102 } },
                                { geometry: { coordinates: [114.276187, 30.616911], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.27617, 30.615976], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.274393, 30.616148], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.27356, 30.616145], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.276153, 30.615938], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.275487, 30.615936], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.274266, 30.616848], type: "Point" }, type: "Feature", properties: { h: 96 } },
                                { geometry: { coordinates: [114.27561, 30.616912], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.275205, 30.616303], type: "Point" }, type: "Feature", properties: { h: 84 } },
                                { geometry: { coordinates: [114.275991, 30.616082], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.275064, 30.616315], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.274643, 30.615882], type: "Point" }, type: "Feature", properties: { h: 108 } },
                                { geometry: { coordinates: [114.276106, 30.616071], type: "Point" }, type: "Feature", properties: { h: 90 } },
                                { geometry: { coordinates: [114.273684, 30.61618], type: "Point" }, type: "Feature", properties: { h: 108 } },
                            ],
                        },
                        // url: './change_point.geojson',
                    });
                    layer.setSource(pointGeo, {
                        unit: "meter",
                        height: (index, feat) => {
                            return feat.properties.h * heightFactor;
                        },
                        color: (index, feat) => {
                            return ["#FF6F47", "#4FDDC7", "#4FDDC7"][index % 3];
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
                        url: "https://a.amap.com/Loca/static/loca-v2/demos/mock_data/laser_soho.json",
                    });

                    loca.add(layer);

                    // 围栏
                    var outLayer = new Loca.PolygonLayer({
                        zIndex: 120,
                        cullface: "none",
                        shininess: 1,
                        hasBottom: false,
                        blockHide: false,
                        hasSide: true,
                        hasTop: false,
                        depth: true,
                    });

                    var outGeo = new Loca.GeoJSONSource({
                        data: {
                            type: "FeatureCollection",
                            name: "out",
                            crs: {
                                type: "name",
                                properties: {
                                    name: "urn:ogc:def:crs:OGC:1.3:CRS84",
                                },
                            },
                            features: [
                                {
                                    type: "Feature",
                                    properties: {},
                                    geometry: {
                                        type: "Polygon",
                                        coordinates: [
                                            [
                                            [ 114.268337,30.622766 ], 
                                            [ 114.26736,30.62209 ], 
                                            [ 114.266002,30.621475 ], 
                                            [ 114.265454,30.620634 ],
                                            [ 114.264715,30.620224 ] ,
                                            [ 114.264358,30.619507 ],
                                            [ 114.264144,30.618646 ] ,
                                            [ 114.264453,30.617149 ],
                                            [ 114.264715,30.61598 ],
                                            [ 114.264739,30.615529 ], 
                                            [ 114.265478,30.614854 ] ,
                                            [ 114.26655,30.613973 ],
                                            [ 114.26736,30.613419 ] ,
                                            [ 114.268765,30.613398 ],
                                            [ 114.270314,30.613501 ] ,
                                            [ 114.272125,30.613398 ],
                                            [ 114.272955,30.613878 ]  ,
                                            [ 114.274197,30.614813 ],
                                            [ 114.276341,30.615428 ],
                                            [ 114.277878,30.616299 ] ,
                                            [ 114.278603,30.616619 ] ,
                                            [ 114.279045,30.61753 ],
                                            [ 114.279093,30.6204 ],
                                            [ 114.279236,30.621076],
                                            [ 114.278187,30.622635 ], 
                                            [ 114.27459,30.623598 ] ,
                                            [ 114.272946,30.623721 ],
                                            [ 114.268337,30.622766 ] ,
                                            ],
                                        ],
                                    },
                                },
                            ],
                        },
                        // url: 'https://a.amap.com/Loca/static/loca-v2/demos/mock_data/laser_out.json',
                    });
                    outLayer.setSource(outGeo);
                    outLayer.setStyle({
                        topColor: function (index, feature) {
                            return "rgba(217,104,104,0.1)";
                        },
                        sideTopColor: function (index, feature) {
                            return "rgba(217,104,104,0.1)";
                        },
                        sideBottomColor: function (index, feature) {
                            return "rgba(237,87,87,1)";
                        },
                        height: 50,
                        altitude: 0,
                    });
                    loca.add(outLayer);

                    var top5 = new Loca.GeoJSONSource({
                        data: {
                            type: "FeatureCollection",
                            features: [
                                {
                                    geometry: {
                                        coordinates: [114.271389, 30.618726],
                                        type: "Point",
                                    },
                                    type: "Feature",
                                    properties: {
                                        h: 140,
                                        p: 460,
                                    },
                                },
                            ],
                        },
                    });
                    zMarker1 = new Loca.ZMarkerLayer({
                        zIndex: 120,
                        loca,
                    });
                    zMarker1.setSource(top5);
                    zMarker1.setStyle({
                        content: (i, feat) => {
                            var people = feat.properties.p;
                            return `<div>
                                <p style="width: 400px; height: 80px; line-height: 80px; font-size: 40px; background-image:linear-gradient(to right,rgba(30,215,196,0.4),rgba(30, 215, 196, 0.3),rgba(0,0,0,0.4)); border:4px solid rgba(30, 215, 196, 0.9); color:#fff; border-radius: 20px; text-align:center; margin:0;padding:0;">
                                人流量: ${people}人/分
                                </p>
                            </div>
                            `;
                        },
                        unit: "meter",
                        rotation: 0,
                        alwaysFront: true,
                        size: [200 * 2, 40 * 2],
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
                        unit: "meter",
                        height: (i, feat) => {
                            return feat.properties.h * heightFactor;
                        },
                        color: "rgba(30,215,196, 1)",
                        lineWidth: 10,
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

                    this.map_load_comple();
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
                    z: 0,
                });
                this.setPosition();
                scene.add(object);
            });
            show_3D_map_exist = true;
        },
        removeGltf() {
            if (object) {
                scene.remove(object); // 从场景中移除模型
                THREE.Cache.clear(); // 手动回收内存
                object.traverse(node => {
                    if (node.geometry) {
                        node.geometry.dispose(); // 释放模型中的 Geometry 对象
                    }
                    if (node.material) {
                        if (Array.isArray(node.material)) {
                            // 如果模型有多个材质，则需要遍历释放每个材质
                            node.material.forEach(m => {
                                m.dispose();
                            });
                        } else {
                            // 如果模型只有一个材质，则直接释放该材质
                            node.material.dispose();
                        }
                    }
                });
                object = null; // 将 object 设置为 null，释放内存
                show_3D_map_exist = false;
            }
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
            // var position = customCoords.lngLatsToCoords(map_gltf_model_Position)[0];
            // object.position.setX(position[0]);
            // object.position.setY(position[1]);
        },
        city_line(model) {
            // 添加边框线
            const edges = new THREE.EdgesGeometry(model.geometry);
            const line = new THREE.LineSegments(
                edges,
                new THREE.LineBasicMaterial({
                    color: 0xbdbdbd,
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
                    opacity: 0.3,
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
                vec3 distColor = mix(vec3(0.97, 0.99, 1.0), uColor, vPosition);
                // 计算流动范围当前点z的高度加上流动线的高度
                float topY = vPoint.z + 5.0;
                if (height > vPoint.z && height < topY) {
                    // 颜色渐变
                    float dIndex = sin((height - vPoint.z) / 5.0 * 3.14);
                    distColor = mix(uFlowColor, distColor, 1.0-dIndex);
                //   distColor = uFlowColor;
                }
                gl_FragColor = vec4(distColor, 1);
                // gl_FragColor = vec4(mix(vec3(0.97, 0.99, 1.0), uColor, vPosition), 1.0); // 通过mix函数混合两个颜色，达到渐变效果
            }
            `,
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
                    float dIndex = sin((height - vPoint.z) / 5.0 * 3.14);
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
        },
        create_avg_traffic_flow_loca() {
            avg_tf_loca = new Loca.Container({
                map,
            });

            avg_tf_loca.ambLight = {
                intensity: 0.3,
                color: "#fff",
            };
            avg_tf_loca.dirLight = {
                intensity: 1.2,
                color: "#fff",
                target: [0, 1, 0],
                position: [0, -1, 1],
            };
            avg_tf_loca.pointLight = {
                color: "rgb(100,100,100)",
                position: [114.2517, 30.552128, 20000],
                intensity: 1.6,
                // 距离表示从光源到光照强度为 0 的位置，0 就是光不会消失。
                distance: 100000,
            };

            var geo = new Loca.GeoJSONSource({
                url: "https://a.amap.com/Loca/static/loca-v2/demos/mock_data/wh_car.json",
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
                hasSide: true,
            });

            var colors = ["#FAE200", "#D27E37", "#C53634", "#C12B6E", "#A92E9A", "#67238A", "#211A50", "#18244E"].reverse();
            var heights = [100, 200, 400, 600, 800, 1400, 1800, 4000];
            ll.setSource(geo);
            ll.setStyle({
                unit: "meter",
                radius: 66,
                gap: 0,
                altitude: 100,
                height: function (index, feature) {
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
                topColor: function (index, feature) {
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
                sideTopColor: function (index, feature) {
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
                sideBottomColor: function (index, feature) {
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
            });
            avg_tf_loca.add(ll);

            // 图例
            var lengend = new Loca.Legend({
                loca: avg_tf_loca,
                title: {
                    label: "车辆密度(辆)",
                    fontColor: "rgba(255,255,255,0.4)",
                    fontSize: "16px",
                },
                style: {
                    backgroundColor: "rgba(255,255,255,0.1)",
                    left: "15px",
                    bottom: "60px",
                    fontSize: "12px",
                },
                dataMap: [
                    { label: 100, color: colors[7] },
                    { label: 80, color: colors[6] },
                    { label: 50, color: colors[5] },
                    { label: 40, color: colors[4] },
                    { label: 30, color: colors[3] },
                    { label: 20, color: colors[2] },
                    { label: 10, color: colors[1] },
                    { label: 5, color: colors[0] },
                ],
            });
            show_average_traffic_flow_exist = true;
            // 控制条
            // var dat = new Loca.Dat();
            // dat.addLight(loca.ambLight, loca, "环境光");
            // dat.addLight(loca.dirLight, loca, "平行光");
            // dat.addLight(loca.pointLight, loca, "点光");
            // dat.addLayer(ll, "车辆图层");
        },
        create_people_out_loca() {
            people_out_loca = new Loca.Container({
                map,
            });
            // 呼吸点
                    var scatter = new Loca.ScatterLayer({
                        people_out_loca,
                        zIndex: 10,
                        opacity: 0.6,
                        visible: true,
                        zooms: [2, 22],
                    });

                    var pointGeo = new Loca.GeoJSONSource({
                        url: 'https://a.amap.com/Loca/static/loca-v2/demos/mock_data/pulselink-china-city-point.json',
                    });
                    scatter.setSource(pointGeo);
                    scatter.setStyle({
                        unit: 'meter',
                        size: [100000, 100000],
                        borderWidth: 0,
                        texture: 'https://a.amap.com/Loca/static/loca-v2/demos/images/breath_red.png',
                        duration: 2000,
                        animate: true,
                    });
                    people_out_loca.add(scatter);

                    // 弧线
                    var pulseLink = new Loca.PulseLinkLayer({
                        // loca,
                        zIndex: 10,
                        opacity: 1,
                        visible: true,
                        zooms: [2, 22],
                        depth: true,
                    });

                    var geo = new Loca.GeoJSONSource({
                        data: {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"type": 0, "ratio": 0.0369, "lineWidthRatio": 1}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [115.482331, 38.867657]]}}, {"type": "Feature", "properties": {"type": 1, "ratio": 0.035, "lineWidthRatio": 0.9447674418604651}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [117.190182, 39.125596]]}}, {"type": "Feature", "properties": {"type": 2, "ratio": 0.0189, "lineWidthRatio": 0.47674418604651164}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [121.472644, 31.231706]]}}, {"type": "Feature", "properties": {"type": 3, "ratio": 0.0167, "lineWidthRatio": 0.41279069767441856}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [113.280637, 23.125178]]}}, {"type": "Feature", "properties": {"type": 4, "ratio": 0.0148, "lineWidthRatio": 0.35755813953488375}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [106.504962, 29.533155]]}}, {"type": "Feature", "properties": {"type": 5, "ratio": 0.0147, "lineWidthRatio": 0.35465116279069764}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [114.884091, 40.811901]]}}, {"type": "Feature", "properties": {"type": 6, "ratio": 0.0137, "lineWidthRatio": 0.32558139534883723}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [113.746262, 23.046237]]}}, {"type": "Feature", "properties": {"type": 7, "ratio": 0.0136, "lineWidthRatio": 0.3226744186046511}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [104.065735, 30.659462]]}}, {"type": "Feature", "properties": {"type": 0, "ratio": 0.0134, "lineWidthRatio": 0.3168604651162791}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [114.502461, 38.045474]]}}, {"type": "Feature", "properties": {"type": 1, "ratio": 0.0116, "lineWidthRatio": 0.2645348837209302}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [118.175393, 39.635113]]}}, {"type": "Feature", "properties": {"type": 2, "ratio": 0.011, "lineWidthRatio": 0.24709302325581392}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [118.767413, 32.041544]]}}, {"type": "Feature", "properties": {"type": 3, "ratio": 0.0108, "lineWidthRatio": 0.24127906976744187}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [120.153576, 30.287459]]}}, {"type": "Feature", "properties": {"type": 4, "ratio": 0.0101, "lineWidthRatio": 0.2209302325581395}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [116.857461, 38.310582]]}}, {"type": "Feature", "properties": {"type": 5, "ratio": 0.0097, "lineWidthRatio": 0.20930232558139533}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [117.939152, 40.976204]]}}, {"type": "Feature", "properties": {"type": 6, "ratio": 0.0087, "lineWidthRatio": 0.18023255813953484}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [114.490686, 36.612273]]}}, {"type": "Feature", "properties": {"type": 7, "ratio": 0.0081, "lineWidthRatio": 0.1627906976744186}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [113.665412, 34.757975]]}}, {"type": "Feature", "properties": {"type": 0, "ratio": 0.008, "lineWidthRatio": 0.15988372093023254}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [114.085947, 22.547]]}}, {"type": "Feature", "properties": {"type": 1, "ratio": 0.0077, "lineWidthRatio": 0.1511627906976744}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [120.619585, 31.299379]]}}, {"type": "Feature", "properties": {"type": 2, "ratio": 0.0074, "lineWidthRatio": 0.14244186046511628}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [108.948024, 34.263161]]}}, {"type": "Feature", "properties": {"type": 3, "ratio": 0.0074, "lineWidthRatio": 0.14244186046511628}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [117.000923, 36.675807]]}}, {"type": "Feature", "properties": {"type": 4, "ratio": 0.0071, "lineWidthRatio": 0.13372093023255813}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [114.508851, 37.0682]]}}, {"type": "Feature", "properties": {"type": 5, "ratio": 0.0063, "lineWidthRatio": 0.11046511627906977}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [115.665993, 37.735097]]}}, {"type": "Feature", "properties": {"type": 6, "ratio": 0.006, "lineWidthRatio": 0.10174418604651163}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [120.355173, 36.082982]]}}, {"type": "Feature", "properties": {"type": 7, "ratio": 0.0055, "lineWidthRatio": 0.08720930232558138}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [116.307428, 37.453968]]}}, {"type": "Feature", "properties": {"type": 0, "ratio": 0.0055, "lineWidthRatio": 0.08720930232558138}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [112.982279, 28.19409]]}}, {"type": "Feature", "properties": {"type": 1, "ratio": 0.0054, "lineWidthRatio": 0.08430232558139536}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [115.469381, 35.246531]]}}, {"type": "Feature", "properties": {"type": 2, "ratio": 0.0053, "lineWidthRatio": 0.08139534883720931}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [119.107078, 36.70925]]}}, {"type": "Feature", "properties": {"type": 3, "ratio": 0.0051, "lineWidthRatio": 0.07558139534883722}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [123.429096, 41.796767]]}}, {"type": "Feature", "properties": {"type": 4, "ratio": 0.0049, "lineWidthRatio": 0.06976744186046512}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [117.184811, 34.261792]]}}, {"type": "Feature", "properties": {"type": 5, "ratio": 0.0049, "lineWidthRatio": 0.06976744186046512}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [112.549248, 37.857014]]}}, {"type": "Feature", "properties": {"type": 6, "ratio": 0.0048, "lineWidthRatio": 0.06686046511627905}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [113.122717, 23.028762]]}}, {"type": "Feature", "properties": {"type": 7, "ratio": 0.0048, "lineWidthRatio": 0.06686046511627905}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [112.540918, 32.999082]]}}, {"type": "Feature", "properties": {"type": 0, "ratio": 0.0048, "lineWidthRatio": 0.06686046511627905}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [114.649653, 33.620357]]}}, {"type": "Feature", "properties": {"type": 1, "ratio": 0.0047, "lineWidthRatio": 0.06395348837209303}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [118.326443, 35.065282]]}}, {"type": "Feature", "properties": {"type": 2, "ratio": 0.0047, "lineWidthRatio": 0.06395348837209303}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [120.301663, 31.574729]]}}, {"type": "Feature", "properties": {"type": 3, "ratio": 0.0047, "lineWidthRatio": 0.06395348837209303}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [117.283042, 31.86119]]}}, {"type": "Feature", "properties": {"type": 4, "ratio": 0.0046, "lineWidthRatio": 0.061046511627906974}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [119.586579, 39.942531]]}}, {"type": "Feature", "properties": {"type": 5, "ratio": 0.0044, "lineWidthRatio": 0.05523255813953489}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [112.434468, 34.663041]]}}, {"type": "Feature", "properties": {"type": 6, "ratio": 0.0044, "lineWidthRatio": 0.05523255813953489}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [115.980367, 36.456013]]}}, {"type": "Feature", "properties": {"type": 7, "ratio": 0.0044, "lineWidthRatio": 0.05523255813953489}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [126.642464, 45.756967]]}}, {"type": "Feature", "properties": {"type": 0, "ratio": 0.0044, "lineWidthRatio": 0.05523255813953489}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [121.549792, 29.868388]]}}, {"type": "Feature", "properties": {"type": 1, "ratio": 0.0043, "lineWidthRatio": 0.05232558139534883}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [113.883991, 35.302616]]}}, {"type": "Feature", "properties": {"type": 2, "ratio": 0.0043, "lineWidthRatio": 0.05232558139534883}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [113.295259, 40.09031]]}}, {"type": "Feature", "properties": {"type": 3, "ratio": 0.0042, "lineWidthRatio": 0.04941860465116278}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [102.712251, 25.040609]]}}, {"type": "Feature", "properties": {"type": 4, "ratio": 0.0042, "lineWidthRatio": 0.04941860465116278}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [116.587245, 35.415393]]}}, {"type": "Feature", "properties": {"type": 5, "ratio": 0.0041, "lineWidthRatio": 0.04651162790697675}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [114.352482, 36.103442]]}}, {"type": "Feature", "properties": {"type": 6, "ratio": 0.004, "lineWidthRatio": 0.0436046511627907}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [114.075031, 32.123274]]}}, {"type": "Feature", "properties": {"type": 7, "ratio": 0.004, "lineWidthRatio": 0.0436046511627907}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [114.024736, 32.980169]]}}, {"type": "Feature", "properties": {"type": 0, "ratio": 0.004, "lineWidthRatio": 0.0436046511627907}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [114.298572, 30.584355]]}}, {"type": "Feature", "properties": {"type": 1, "ratio": 0.0039, "lineWidthRatio": 0.04069767441860465}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [115.650497, 34.437054]]}}, {"type": "Feature", "properties": {"type": 2, "ratio": 0.0039, "lineWidthRatio": 0.04069767441860465}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [114.940278, 25.85097]]}}, {"type": "Feature", "properties": {"type": 3, "ratio": 0.0038, "lineWidthRatio": 0.0377906976744186}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [125.3245, 43.886841]]}}, {"type": "Feature", "properties": {"type": 4, "ratio": 0.0037, "lineWidthRatio": 0.034883720930232565}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [111.670801, 40.818311]]}}, {"type": "Feature", "properties": {"type": 5, "ratio": 0.0036, "lineWidthRatio": 0.031976744186046506}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [115.819729, 32.896969]]}}, {"type": "Feature", "properties": {"type": 6, "ratio": 0.0035, "lineWidthRatio": 0.029069767441860465}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [111.517973, 36.08415]]}}, {"type": "Feature", "properties": {"type": 7, "ratio": 0.0035, "lineWidthRatio": 0.029069767441860465}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [120.864608, 32.016212]]}}, {"type": "Feature", "properties": {"type": 0, "ratio": 0.0035, "lineWidthRatio": 0.029069767441860465}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [118.956806, 42.275317]]}}, {"type": "Feature", "properties": {"type": 1, "ratio": 0.0035, "lineWidthRatio": 0.029069767441860465}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [112.736465, 37.696495]]}}, {"type": "Feature", "properties": {"type": 2, "ratio": 0.0034, "lineWidthRatio": 0.026162790697674413}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [111.003957, 35.022778]]}}, {"type": "Feature", "properties": {"type": 3, "ratio": 0.0033, "lineWidthRatio": 0.023255813953488372}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [118.016974, 37.383542]]}}, {"type": "Feature", "properties": {"type": 4, "ratio": 0.0033, "lineWidthRatio": 0.023255813953488372}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [121.391382, 37.539297]]}}, {"type": "Feature", "properties": {"type": 5, "ratio": 0.0033, "lineWidthRatio": 0.023255813953488372}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [113.114543, 41.034126]]}}, {"type": "Feature", "properties": {"type": 6, "ratio": 0.0033, "lineWidthRatio": 0.023255813953488372}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [119.649506, 29.089524]]}}, {"type": "Feature", "properties": {"type": 7, "ratio": 0.0033, "lineWidthRatio": 0.023255813953488372}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [106.713478, 26.578343]]}}, {"type": "Feature", "properties": {"type": 0, "ratio": 0.0032, "lineWidthRatio": 0.020348837209302327}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [115.892151, 28.676493]]}}, {"type": "Feature", "properties": {"type": 1, "ratio": 0.0032, "lineWidthRatio": 0.020348837209302327}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [108.705117, 34.333439]]}}, {"type": "Feature", "properties": {"type": 2, "ratio": 0.0032, "lineWidthRatio": 0.020348837209302327}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [114.879365, 30.447711]]}}, {"type": "Feature", "properties": {"type": 3, "ratio": 0.0032, "lineWidthRatio": 0.020348837209302327}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [109.99029, 39.817179]]}}, {"type": "Feature", "properties": {"type": 4, "ratio": 0.0032, "lineWidthRatio": 0.020348837209302327}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [120.672111, 28.000575]]}}, {"type": "Feature", "properties": {"type": 5, "ratio": 0.0031, "lineWidthRatio": 0.017441860465116275}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [108.320004, 22.82402]]}}, {"type": "Feature", "properties": {"type": 6, "ratio": 0.0031, "lineWidthRatio": 0.017441860465116275}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [117.129063, 36.194968]]}}, {"type": "Feature", "properties": {"type": 7, "ratio": 0.0031, "lineWidthRatio": 0.017441860465116275}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [120.139998, 33.377631]]}}, {"type": "Feature", "properties": {"type": 0, "ratio": 0.0031, "lineWidthRatio": 0.017441860465116275}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [120.856394, 40.755572]]}}, {"type": "Feature", "properties": {"type": 1, "ratio": 0.0031, "lineWidthRatio": 0.017441860465116275}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [114.412599, 23.079404]]}}, {"type": "Feature", "properties": {"type": 2, "ratio": 0.0031, "lineWidthRatio": 0.017441860465116275}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [119.946973, 31.772752]]}}, {"type": "Feature", "properties": {"type": 3, "ratio": 0.003, "lineWidthRatio": 0.014534883720930232}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [118.589421, 24.908853]]}}, {"type": "Feature", "properties": {"type": 4, "ratio": 0.003, "lineWidthRatio": 0.014534883720930232}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [113.132855, 29.37029]]}}, {"type": "Feature", "properties": {"type": 5, "ratio": 0.003, "lineWidthRatio": 0.014534883720930232}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [118.047648, 36.814939]]}}, {"type": "Feature", "properties": {"type": 6, "ratio": 0.0029, "lineWidthRatio": 0.011627906976744179}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [119.306239, 26.075302]]}}, {"type": "Feature", "properties": {"type": 7, "ratio": 0.0029, "lineWidthRatio": 0.011627906976744179}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [112.607693, 26.900358]]}}, {"type": "Feature", "properties": {"type": 0, "ratio": 0.0029, "lineWidthRatio": 0.011627906976744179}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [115.041299, 35.768234]]}}, {"type": "Feature", "properties": {"type": 1, "ratio": 0.0029, "lineWidthRatio": 0.011627906976744179}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [109.502882, 34.499381]]}}, {"type": "Feature", "properties": {"type": 2, "ratio": 0.0029, "lineWidthRatio": 0.011627906976744179}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [115.992811, 29.712034]]}}, {"type": "Feature", "properties": {"type": 3, "ratio": 0.0029, "lineWidthRatio": 0.011627906976744179}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [111.134335, 37.524366]]}}, {"type": "Feature", "properties": {"type": 4, "ratio": 0.0028, "lineWidthRatio": 0.008720930232558138}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [114.341447, 34.797049]]}}, {"type": "Feature", "properties": {"type": 5, "ratio": 0.0028, "lineWidthRatio": 0.008720930232558138}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [121.618622, 38.91459]]}}, {"type": "Feature", "properties": {"type": 6, "ratio": 0.0028, "lineWidthRatio": 0.008720930232558138}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [113.826063, 34.022956]]}}, {"type": "Feature", "properties": {"type": 7, "ratio": 0.0028, "lineWidthRatio": 0.008720930232558138}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [106.937265, 27.706626]]}}, {"type": "Feature", "properties": {"type": 0, "ratio": 0.0028, "lineWidthRatio": 0.008720930232558138}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [87.617733, 43.792818]]}}, {"type": "Feature", "properties": {"type": 1, "ratio": 0.0028, "lineWidthRatio": 0.008720930232558138}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [120.750865, 30.762653]]}}, {"type": "Feature", "properties": {"type": 2, "ratio": 0.0028, "lineWidthRatio": 0.008720930232558138}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [113.307718, 33.735241]]}}, {"type": "Feature", "properties": {"type": 3, "ratio": 0.0027, "lineWidthRatio": 0.0058139534883720955}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [103.823557, 36.058039]]}}, {"type": "Feature", "properties": {"type": 4, "ratio": 0.0027, "lineWidthRatio": 0.0058139534883720955}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [109.741193, 38.290162]]}}, {"type": "Feature", "properties": {"type": 5, "ratio": 0.0027, "lineWidthRatio": 0.0058139534883720955}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [112.23813, 30.326857]]}}, {"type": "Feature", "properties": {"type": 6, "ratio": 0.0026, "lineWidthRatio": 0.0029069767441860417}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [113.382391, 22.521113]]}}, {"type": "Feature", "properties": {"type": 7, "ratio": 0.0025, "lineWidthRatio": 0}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [112.144146, 32.042426]]}}, {"type": "Feature", "properties": {"type": 0, "ratio": 0.0025, "lineWidthRatio": 0}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [113.113556, 36.191112]]}}, {"type": "Feature", "properties": {"type": 1, "ratio": 0.0025, "lineWidthRatio": 0}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [114.391136, 27.8043]]}}, {"type": "Feature", "properties": {"type": 2, "ratio": 0.0025, "lineWidthRatio": 0}, "geometry": {"type": "LineString", "coordinates": [[114.256148, 30.615884], [111.691347, 29.040225]]}}]},
                        // url: 'https://a.amap.com/Loca/static/loca-v2/demos/mock_data/data-line-out.json',
                    });

                    pulseLink.setSource(geo);
                    pulseLink.setStyle({
                        unit: 'meter',
                        dash: [40000, 0, 40000, 0],
                        lineWidth: function () {
                            return [20000, 1000];
                        },
                        height: function (index, feat) {
                            return feat.distance / 3 + 10;
                        },
                        // altitude: 1000,
                        smoothSteps: 30,
                        speed: function (index, prop) {
                            return 1000 + Math.random() * 200000;
                        },
                        flowLength: 100000,
                        lineColors: function (index, feat) {
                            return ['rgb(255,228,105)', 'rgb(255,164,105)', 'rgba(1, 34, 249,1)'];
                        },
                        maxHeightScale: 0.3, // 弧顶位置比例
                        headColor: 'rgba(255, 255, 0, 1)',
                        trailColor: 'rgba(255, 255,0,0)',
                    });
                    people_out_loca.add(pulseLink);
                    people_out_loca.animate.start();
                    show_people_out_exist = true;
        },
        show_road_condition() {
            if (show_road_condition_var) {
                trafficLayer.hide();
                show_road_condition_var = false;
            } else {
                trafficLayer.show();
                show_road_condition_var = true;
            }
        },
        show_average_traffic_flow() {
            if (show_average_traffic_flow_exist) {
                avg_tf_loca.destroy();
                show_average_traffic_flow_exist = false;
            } else {
                this.create_avg_traffic_flow_loca();
            }
        },
        show_3D_map() {
            if (show_3D_map_exist) {
                this.removeGltf();
            } else {
                this.initGltf();
            }
        },
        show_people_out() {
            if (show_people_out_exist) {
                people_out_loca.destroy();
                show_people_out_exist = false;
            } else {
                this.create_people_out_loca();
            }
        },
        // 加载动画
        async map_load_comple() {
            map.on("complete", function () {
                setTimeout(() => {
                    let progressBarBox = document.getElementsByClassName("progress-bar-box")[0];
                    if(progressBarBox){
                        progressBarBox.classList.add("fade-out");
                        setTimeout(() => {progressBarBox.remove();}, 500);
                    }
                }, 3000);
            });
        },
    },
    data() {
        return {
            height: {
                value: 0,
            },
            color: "#1791fc",
            opacity: 0,
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
}
.input-card {
    position: absolute;
    right: 70px;
    bottom: 10px;
    z-index: 999;
    margin-bottom: 5px;
}
.input-card button {
    margin-right: 8px;
}
.input-card button:last-child {
    margin-right: 0px;
}

.input-item button.btn{
    border: 1px solid #2fa1d636;
    border-radius: 4px;
    font-family: 'nav-font';
    font-weight: 100;
    padding: 4px 10px;
    background-color: transparent;
    backdrop-filter: blur(6px);
    cursor: pointer;
    width: 76px;
    color: #ffffffc4;
    height: 26px;
}

.input-item button.btn:hover{
    font-weight: 600;
    color: #ffffff;
    background-color: #ffffff17;
}
</style>

<style lang="less" scoped></style>
