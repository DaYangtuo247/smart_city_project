<template>
    <div class="com-container">
        <div id="MapContainer"></div>
        <div class="center-btns">
            <button class="btn btn1" @click="immediately_road()"><img src="~@/assets/images/实时路况.png" alt="" /></button>
            <button class="btn btn2" @click="traffic_flow()"><img src="~@/assets/images/日均车流.png" alt="" /></button>
            <button class="btn btn3" @click="model_3D()"><img src="~@/assets/images/3D模型.png" alt="" /></button>
            <button class="btn btn4" @click="people_out()"><img src="~@/assets/images/人口流出.png" alt="" /></button>
            <button class="btn btn5" @click="people_out()"><img src="~@/assets/images/实时公交.png" alt="" /></button>
            <img src="~@/assets/images/all-btn.png" alt="" class="all" />
        </div>
    </div>
</template>
<script>
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import AMapLoader from "@amap/amap-jsapi-loader";
// let height = 0.0;
let map, camera, scene, renderer, object; // 高德地图, 相机, 场景, 渲染器, gltf模型场景
let map_gltf_model_Position = [114.281454, 30.59925], // 模型放置点
    map_init_center = [114.30443, 30.591613]; //初始化地图中心点位置
let customCoords, zMarker1;
let avg_tf_loca, people_out_loca, trafficLayer; // 日平均车流, 人口流出情况, 路况对象
let immediately_road = false, // 实时路况
    model_3D = false, // 3D模型
    people_out = false, // 人口流出
    traffic_flow = false; // 车流
export default {
    data() {
        return {
            height: {
                value: 0,
            },
            color: "#1791fc",
            opacity: 0,
        };
    },
    mounted() {
        this.initMap();
        this.change();
    },
    methods: {
        initMap() {
            AMapLoader.load({
                key: "283d29d48a72af6b61305c99b1f8638c", // 申请好的Web端开发者Key
                version: "2.0",
                plugins: ["AMap.Scale", "AMap.DistrictSearch"], // 插件列表
                AMapUI: {
                    version: "1.1",
                    plugins: ["overlay/SimpleMarker"],
                },
                Loca: { version: "2.0" },
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
                        mapStyle: "amap://styles/grey",
                        showBuildingBlock: false, // 显示高德自带地图块
                        center: map_init_center, //初始化地图中心点位置
                        doubleClickZoom: false, // 双击放大地图
                        showLabel: true, //设置文字标注
                    });
                    // var scale = new AMap.Scale();
                    // map.addControl(scale); // 添加比例尺控件

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
                        zIndex: 10,
                        init: gl => {
                            // 这里我们的地图模式是 3D，所以创建一个透视相机，相机的参数初始化可以随意设置，因为在 render 函数中，每一帧都需要同步相机参数，因此这里变得不那么重要。
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
                            //重新设置模型大小，解决地图漂移的问题
                            var map_father_box = document.querySelector(".amap-layer");
                            // 确保获取到地图父盒子
                            if (map_father_box && map_father_box.offsetWidth) {
                                var boxWidth = map_father_box.offsetWidth,
                                    boxHeight = map_father_box.offsetHeight;
                                camera = new THREE.PerspectiveCamera(60, boxWidth / boxHeight, 100, 1 << 30);
                            }
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

                    // 图书馆鼠标点击范围的设置
                    var library_area = [
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
                    var store_area = [
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

                    // 在地图上添加多边形，该方法来源于 https://lbs.amap.com/api/javascript-api-v2/documentation#Polygon
                    function addPolygon(data, fun) {
                        let polygon = new AMap.Polygon({
                            path: data,
                            fillColor: "#ccebc5",
                            strokeColor: "#2b8cbe",
                            strokeStyle: "dashed",
                            strokeDasharray: [5, 5],
                            cursor: "pointer",
                            strokeOpacity: 0.2, //线透明度
                            strokeWeight: 1, //线宽
                            fillOpacity: 0, //填充透明度
                        });
                        polygon.on("mouseover", () => {
                            polygon.setOptions({
                                fillOpacity: 0,
                                fillColor: "#7bccc4",
                            });
                        });
                        polygon.on("mouseout", () => {
                            polygon.setOptions({
                                fillOpacity: 0,
                                fillColor: "#ccebc5",
                            });
                        });
                        polygon.on("click", e => {
                            fun(e);
                        });
                        map.add(polygon);
                    }

                    addPolygon(library_area, showInfoClick); // 参数二为需要执行的函数
                    addPolygon(store_area, showInfoClick);

                    // 图书馆触发事件
                    let eventBus = this.$eventBus; // 该代码下的this指向app实例，在如下函数中的this指向当前函数本身
                    function showInfoClick(e) {
                        console.log("您在 [ " + e.lnglat.getLng() + "," + e.lnglat.getLat() + " ] 的位置单击了地图！");
                        // 触发一个名为'change'的自定义事件
                        eventBus.emit("show-library-graph-lr", "数据(目前没有)"); // 正确
                    }

                    // var loca = new Loca.Container({ map });

                    // var geo = new Loca.GeoJSONSource({
                    //     data: {
                    //         type: "FeatureCollection",
                    //         features: [
                    //             {
                    //                 type: "Feature",
                    //                 geometry: {
                    //                     type: "Point",
                    //                     coordinates: [114.222131, 30.652322],
                    //                 },
                    //                 properties: {
                    //                     name: "武汉轻工大学图书馆",
                    //                     price: 55000,
                    //                     count: 92,
                    //                 },
                    //             },
                    //             {
                    //                 type: "Feature",
                    //                 geometry: {
                    //                     type: "Point",
                    //                     coordinates: [114.237858, 30.650277],
                    //                 },
                    //                 properties: {
                    //                     name: "永旺梦乐城",
                    //                     price: 65000,
                    //                     count: 92,
                    //                 },
                    //             },
                    //         ],
                    //     },
                    // });

                    // // 文字主体图层
                    // var zMarker = new Loca.ZMarkerLayer({
                    //     loca: loca,
                    //     zIndex: 120,
                    //     depth: false,
                    // });
                    // zMarker.setSource(geo);
                    // zMarker.setStyle({
                    //     content: (i, feat) => {
                    //         var props = feat.properties;
                    //         var leftColor = props.price < 60000 ? "rgba(0, 28, 52, 0.6)" : "rgba(33,33,33,0.6)";
                    //         var rightColor = props.price < 60000 ? "#038684" : "rgba(172, 137, 51, 0.3)";
                    //         var borderColor = props.price < 60000 ? "#038684" : "rgba(172, 137, 51, 1)";
                    //         return (
                    //             '<div style="width: 490px; height: 228px; padding: 0 0;">' +
                    //             '<p style="display: block; height:80px; line-height:80px;font-size:40px;background-image: linear-gradient(to right, ' +
                    //             leftColor +
                    //             "," +
                    //             leftColor +
                    //             "," +
                    //             rightColor +
                    //             ",rgba(0,0,0,0.4)); border:4px solid " +
                    //             borderColor +
                    //             '; color:#fff; border-radius: 15px; text-align:center; margin:0; padding:5px;">' +
                    //             props["name"] +
                    //             '</p><span style="width: 130px; height: 130px; margin: 0 auto; display: block; background: url(https://a.amap.com/Loca/static/loca-v2/demos/images/prism_' +
                    //             (props["price"] < 60000 ? "blue" : "yellow") +
                    //             '.png);"></span></div>'
                    //         );
                    //     },
                    //     unit: "meter",
                    //     rotation: 0,
                    //     alwaysFront: true,
                    //     size: [490 / 2, 222 / 2],
                    //     altitude: 0,
                    // });

                    // // 浮动三角
                    // var triangleZMarker = new Loca.ZMarkerLayer({
                    //     loca: loca,
                    //     zIndex: 119,
                    //     depth: false,
                    // });
                    // triangleZMarker.setSource(geo);
                    // triangleZMarker.setStyle({
                    //     content: (i, feat) => {
                    //         return (
                    //             '<div style="width: 120px; height: 120px; background: url(https://a.amap.com/Loca/static/loca-v2/demos/images/triangle_' +
                    //             (feat.properties.price < 60000 ? "blue" : "yellow") +
                    //             '.png);"></div>'
                    //         );
                    //     },
                    //     unit: "meter",
                    //     rotation: 0,
                    //     alwaysFront: true,
                    //     size: [60, 60],
                    //     altitude: 15,
                    // });
                    // triangleZMarker.addAnimate({
                    //     key: "altitude",
                    //     value: [0, 1],
                    //     random: true,
                    //     transform: 1000,
                    //     delay: 2000,
                    //     yoyo: true,
                    //     repeat: Infinity,
                    // });

                    // // 呼吸点 蓝色
                    // var scatterBlue = new Loca.ScatterLayer({
                    //     loca,
                    //     zIndex: 110,
                    //     opacity: 1,
                    //     visible: true,
                    //     zooms: [2, 26],
                    //     depth: false,
                    // });

                    // scatterBlue.setSource(geo);
                    // scatterBlue.setStyle({
                    //     unit: "meter",
                    //     size: function (i, feat) {
                    //         return feat.properties.price < 60000 ? [90, 90] : [0, 0];
                    //     },
                    //     texture: "https://a.amap.com/Loca/static/loca-v2/demos/images/scan_blue.png",
                    //     altitude: 20,
                    //     duration: 2000,
                    //     animate: true,
                    // });

                    // // 呼吸点 金色
                    // var scatterYellow = new Loca.ScatterLayer({
                    //     loca,
                    //     zIndex: 110,
                    //     opacity: 1,
                    //     visible: true,
                    //     zooms: [2, 26],
                    //     depth: false,
                    // });

                    // scatterYellow.setSource(geo);
                    // scatterYellow.setStyle({
                    //     unit: "meter",
                    //     size: function (i, feat) {
                    //         return feat.properties.price > 60000 ? [90, 90] : [0, 0];
                    //     },
                    //     texture: "https://a.amap.com/Loca/static/loca-v2/demos/images/scan_yellow.png",
                    //     altitude: 20,
                    //     duration: 2000,
                    //     animate: true,
                    // });

                    // // 粒子上升效果
                    // var layer = new Loca.LaserLayer({
                    //     zIndex: 130,
                    //     opacity: 1,
                    //     visible: true,
                    //     depth: true,
                    //     zooms: [2, 26],
                    // });

                    // var heightFactor = 5;

                    // var pointGeo = new Loca.GeoJSONSource({
                    //     url: this.$http.defaults.baseURL + "/唐家墩人流量粒子特效.json",
                    // });
                    // layer.setSource(pointGeo, {
                    //     unit: "meter",
                    //     height: (index, feat) => {
                    //         return feat.properties.h * heightFactor;
                    //     },
                    //     color: (index, feat) => {
                    //         return ["#FF6F47", "#4FDDC7", "#4FDDC7"][index % 3];
                    //     },
                    //     lineWidth: 6,
                    //     trailLength: 300,
                    //     angle: 0,
                    //     duration: 1500,
                    //     interval: 1000,
                    //     repeat: Infinity,
                    //     delay: () => {
                    //         return Math.random() * 2000;
                    //     },
                    // });

                    // var geo = new Loca.GeoJSONSource({
                    //     url: "https://a.amap.com/Loca/static/loca-v2/demos/mock_data/laser_soho.json",
                    // });

                    // loca.add(layer);

                    // // 围栏
                    // var outLayer = new Loca.PolygonLayer({
                    //     zIndex: 120,
                    //     cullface: "none",
                    //     shininess: 1,
                    //     hasBottom: false,
                    //     blockHide: false,
                    //     hasSide: true,
                    //     hasTop: false,
                    //     depth: true,
                    // });

                    // var outGeo = new Loca.GeoJSONSource({
                    //     data: {
                    //         type: "FeatureCollection",
                    //         name: "out",
                    //         crs: {
                    //             type: "name",
                    //             properties: {
                    //                 name: "urn:ogc:def:crs:OGC:1.3:CRS84",
                    //             },
                    //         },
                    //         features: [
                    //             {
                    //                 type: "Feature",
                    //                 properties: {},
                    //                 geometry: {
                    //                     type: "Polygon",
                    //                     coordinates: [
                    //                         [
                    //                             [114.268337, 30.622766],
                    //                             [114.26736, 30.62209],
                    //                             [114.266002, 30.621475],
                    //                             [114.265454, 30.620634],
                    //                             [114.264715, 30.620224],
                    //                             [114.264358, 30.619507],
                    //                             [114.264144, 30.618646],
                    //                             [114.264453, 30.617149],
                    //                             [114.264715, 30.61598],
                    //                             [114.264739, 30.615529],
                    //                             [114.265478, 30.614854],
                    //                             [114.26655, 30.613973],
                    //                             [114.26736, 30.613419],
                    //                             [114.268765, 30.613398],
                    //                             [114.270314, 30.613501],
                    //                             [114.272125, 30.613398],
                    //                             [114.272955, 30.613878],
                    //                             [114.274197, 30.614813],
                    //                             [114.276341, 30.615428],
                    //                             [114.277878, 30.616299],
                    //                             [114.278603, 30.616619],
                    //                             [114.279045, 30.61753],
                    //                             [114.279093, 30.6204],
                    //                             [114.279236, 30.621076],
                    //                             [114.278187, 30.622635],
                    //                             [114.27459, 30.623598],
                    //                             [114.272946, 30.623721],
                    //                             [114.268337, 30.622766],
                    //                         ],
                    //                     ],
                    //                 },
                    //             },
                    //         ],
                    //     },
                    //     // url: 'https://a.amap.com/Loca/static/loca-v2/demos/mock_data/laser_out.json',
                    // });
                    // outLayer.setSource(outGeo);
                    // outLayer.setStyle({
                    //     topColor: function (index, feature) {
                    //         return "rgba(217,104,104,0.1)";
                    //     },
                    //     sideTopColor: function (index, feature) {
                    //         return "rgba(217,104,104,0.1)";
                    //     },
                    //     sideBottomColor: function (index, feature) {
                    //         return "rgba(237,87,87,1)";
                    //     },
                    //     height: 50,
                    //     altitude: 0,
                    // });
                    // loca.add(outLayer);

                    // var top5 = new Loca.GeoJSONSource({
                    //     data: {
                    //         type: "FeatureCollection",
                    //         features: [
                    //             {
                    //                 geometry: {
                    //                     coordinates: [114.271389, 30.618726],
                    //                     type: "Point",
                    //                 },
                    //                 type: "Feature",
                    //                 properties: {
                    //                     h: 140,
                    //                     p: 460,
                    //                 },
                    //             },
                    //         ],
                    //     },
                    // });
                    // zMarker1 = new Loca.ZMarkerLayer({
                    //     zIndex: 120,
                    //     loca,
                    // });
                    // zMarker1.setSource(top5);
                    // zMarker1.setStyle({
                    //     content: (i, feat) => {
                    //         var people = feat.properties.p;
                    //         return `<div>
                    //             <p style="width: 400px; height: 80px; line-height: 80px; font-size: 40px; background-image:linear-gradient(to right,rgba(30,215,196,0.4),rgba(30, 215, 196, 0.3),rgba(0,0,0,0.4)); border:4px solid rgba(30, 215, 196, 0.9); color:#fff; border-radius: 20px; text-align:center; margin:0;padding:0;">
                    //             人流量: ${people}人/分
                    //             </p>
                    //         </div>
                    //         `;
                    //     },
                    //     unit: "meter",
                    //     rotation: 0,
                    //     alwaysFront: true,
                    //     size: [200 * 2, 40 * 2],
                    //     altitude: (i, feat) => {
                    //         return feat.properties.h * heightFactor;
                    //     },
                    // });
                    // var pole = new Loca.LaserLayer({
                    //     zIndex: 120,
                    //     loca,
                    //     depth: false,
                    // });
                    // pole.setSource(top5, {
                    //     unit: "meter",
                    //     height: (i, feat) => {
                    //         return feat.properties.h * heightFactor;
                    //     },
                    //     color: "rgba(30,215,196, 1)",
                    //     lineWidth: 10,
                    //     trailLength: 50000,
                    //     repeat: 0,
                    // });

                    // loca.animate.start();
                    // loca.pointLight.intensity = 0;
                    // loca.ambLight.intensity = 1;

                    // function alive() {
                    //     map.render();
                    //     requestAnimationFrame(alive);
                    // }
                    // alive();

                    //  下面代码未能实现wuwuwu
                    
                    var mask = [];

                    var opts = {
                        subdistrict: 0,
                        extensions: 'all',
                        level: 'country'
                    };
                    
                    console.log('开始执行 district.search');
                    var district = new AMap.DistrictSearch(opts);
                    console.log('开始执行 district.search');

                    district.search('中国', function(status, result) {
                        console.log(status);
                        var bounds = result.districtList[0].boundaries;
                        for(var i =0;i<bounds.length;i+=1){
                            mask.push([bounds[i]])
                        }

                        for(var i =0;i<bounds.length;i+=1){
                            new AMap.Polyline({
                                path:bounds[i],
                                strokeColor:'#99ffff',
                                strokeWeight:4,
                                map:map
                            })
                        }; 
                    });
                    console.log(mask.length);
                    console.log('end district.search');
                    

                    this.map_load_comple();
                    this.load_library();
                })
                .catch(e => {
                    console.log(e);
                });
        },
        // get_mask(){
        //     AMap.plugin('AMap.DistrictSearch', function () {
        //     var districtSearch = new AMap.DistrictSearch({
        //         // 关键字对应的行政区级别，country表示国家
        //         level: 'city',
        //         extensions: 'all',
        //         //  显示下级行政区级数，1表示返回下一级行政区
        //         subdistrict: 1
        //     })
        //     // 搜索所有省/直辖市信息
        //     districtSearch.search('武汉市', function(status, result) {
        //         // 查询成功时，result即为对应的行政区信息
        //         console.log(status);
        //     })
        //     });
        // },
        change() {
            this.height.value += 0.3;
            if (this.height.value > 75) {
                this.height.value = 0.0;
            }
            requestAnimationFrame(this.change);
        },
        load_library()
        {
            const loader = new GLTFLoader();
            loader.load("library_transform_6_24.glb", gltf => {
                // gltf.scene.traverse(model => {
                //     if (model.isMesh) {
                //         this.lib_line(model);
                //         this.black_lib(model);
                //     }
                // });
                gltf.scene.position.z = 10;
                object = gltf.scene;

                function setRotation(rotation) {
                    var x = (Math.PI / 180) * (rotation.x || 0);
                    var y = (Math.PI / 180) * (rotation.y || 0);
                    var z = (Math.PI / 180) * (rotation.z || 0);
                    object.rotation.set(x, y, z);
                }
                setRotation({ x: 90, y: 0, z: 0 });
                object.scale.set(1, 1, 1); // 设置x、y、z缩放
                scene.add(object);
            });
        },
        initGltf() {
            const loader = new GLTFLoader();
            loader.load("city_6_24.gltf", gltf => {
                gltf.scene.traverse(model => {
                    if (model.isMesh) {
                        this.city_line(model);
                        this.black_city(model);
                    }
                });
                gltf.scene.position.z = 10;
                object = gltf.scene;

                function setRotation(rotation) {
                    var x = (Math.PI / 180) * (rotation.x || 0);
                    var y = (Math.PI / 180) * (rotation.y || 0);
                    var z = (Math.PI / 180) * (rotation.z || 0);
                    object.rotation.set(x, y, z);
                }
                setRotation({ x: 90, y: 0, z: 0 });
                object.scale.set(1, 1, 1); // 设置x、y、z缩放信息
                scene.add(object);
            });
            model_3D = true;
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
                model_3D = false;
            }
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
                    uHeight: {
                        value: model.geometry.boundingBox.getSize(new THREE.Vector3()).y,
                    },
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
                    uHeight: {
                        value: model.geometry.boundingBox.getSize(new THREE.Vector3()).y,
                    },
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
            avg_tf_loca = new Loca.Container({ map });

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
                distance: 100000,
            };

            var geo = new Loca.GeoJSONSource({
                url: this.$http.defaults.baseURL + "/武汉市日均车流统计.json",
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
            traffic_flow = true;
            // 控制条
            // var dat = new Loca.Dat();
            // dat.addLight(loca.ambLight, loca, "环境光");
            // dat.addLight(loca.dirLight, loca, "平行光");
            // dat.addLight(loca.pointLight, loca, "点光");
            // dat.addLayer(ll, "车辆图层");
        },
        create_people_out_loca() {
            people_out_loca = new Loca.Container({ map });
            // 呼吸点
            var scatter = new Loca.ScatterLayer({
                people_out_loca,
                zIndex: 10,
                opacity: 0.6,
                visible: true,
                zooms: [2, 22],
            });

            var pointGeo = new Loca.GeoJSONSource({
                url: this.$http.defaults.baseURL + "/人口流出目标点.json",
            });
            scatter.setSource(pointGeo);
            scatter.setStyle({
                unit: "meter",
                size: [100000, 100000],
                borderWidth: 0,
                texture: "https://a.amap.com/Loca/static/loca-v2/demos/images/breath_red.png",
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
                url: this.$http.defaults.baseURL + "/人口流出飞线.json",
            });

            pulseLink.setSource(geo);
            pulseLink.setStyle({
                unit: "meter",
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
                    return ["rgb(255,228,105)", "rgb(255,164,105)", "rgba(1, 34, 249,1)"];
                },
                maxHeightScale: 0.3, // 弧顶位置比例
                headColor: "rgba(255, 255, 0, 1)",
                trailColor: "rgba(255, 255,0,0)",
            });
            people_out_loca.add(pulseLink);
            people_out_loca.animate.start();
            people_out = true;
        },
        immediately_road() {
            if (immediately_road) trafficLayer.hide();
            else trafficLayer.show();
            immediately_road = !immediately_road;
        },
        traffic_flow() {
            if (traffic_flow) {
                avg_tf_loca.destroy();
                avg_tf_loca = null; // 触发内存回收机制
                traffic_flow = false;
            } else {
                this.create_avg_traffic_flow_loca();
            }
        },
        model_3D() {
            if (model_3D) {
                this.removeGltf();
            } else {
                this.initGltf();
            }
        },
        people_out() {
            if (people_out) {
                people_out_loca.destroy();
                people_out_loca = null; // 触发内存回收机制
                people_out = false;
            } else {
                this.create_people_out_loca();
            }
        },
        // 系统加载动画
        async map_load_comple() {
            map.on("complete", function () {
                setTimeout(() => {
                    let progressBarBox = document.getElementsByClassName("progress-bar-box")[0];
                    if (progressBarBox) {
                        progressBarBox.classList.add("fade-out");
                        setTimeout(() => {
                            progressBarBox.remove();
                        }, 500);
                    }
                }, 3000);
            });
        },
    },
};
</script>

<style src="../assets/css/map.css"></style>
