<template>
    <div style="width:100%;height:100%" class="wrapper">
        <div class="panel">
            <div class="search-area">
                <input class="search-input"></input>
                <span class="search-icon"></span>
            </div>

            <div class="point-panel">
                <ul class="point-list">
                    <li class="point-item" :class="{'active': currentItem === item.id}"
                        v-for="(item, index) in mockData"
                        :key="item.id"
                        @click="handleClick(item.id)">
                        <div class="badge">{{index + 1}}</div>
                        <div class="cont">
                            <p :title="item.label">{{item.label}}</p>
                            <p :title="item.address">{{item.address}}</p>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
        <div id="map" style="width:100%;height:100%"></div>
    </div>
</template>
<script>
import L from 'leaflet';
import HeatmapOverlay from 'leaflet-heatmap';
import markerIconUrl from '../assets/single_marker.png';
import polylineMarkerIcon from '../assets/polylineMarkerIcon.png';
import { AntPath, antPath } from 'leaflet-ant-path';
import '../../static/js/leaflet-BMap.js';
import '../../static/js/BMapAPI.js';
import '../../static/js/movingMarker.js';
import '../../static/js/snakePolyline.js';
import 'lodash';

import 'leaflet-swoopy';
import 'leaflet-polylinedecorator';
import mockData from '../../static/mock/route.json';




function random(min, max, limit) {
    let num = Math.random() * (max - min + 1) + min;
    num = num.toFixed(limit);
    return num;
}
function createData(gross, radius) {
    var max = 0;                    // 单点最大值
    var points = [];                  // 点集合
    for(; gross > 0; gross--){
        var val = Math.floor(Math.random()*100);
        max = Math.max(max, val);
        var point = {
            lat: Math.random() * 3.5 + 30.3,     // 经度
            lng: Math.random() * 8.5 + 114,        // 纬度
            count: val,           // 数据量大小
            radius: radius,
        };
        points.push(point);
    }
    return {
        max,
        data: points,
    };
}
function animateFun() {
    var canvas, context;

    init();
    animate();

    function init() {

        canvas = document.createElement( 'canvas' );
        canvas.width = 256;
        canvas.height = 256;
        canvas.style.position = 'absolute';
        canvas.style.bottom = 0;
        canvas.style.zIndex = 10000;

        context = canvas.getContext( '2d' );

        document.body.appendChild( canvas );

    }

    function animate() {

        requestAnimationFrame( animate );
        draw();

    }

    function draw() {

        var time = new Date().getTime() * 0.002;
        var x = Math.sin( time ) * 96 + 128;
        var y = Math.cos( time * 0.9 ) * 96 + 128;

        context.fillStyle = 'rgb(245,245,245)';
        context.fillRect( 0, 0, 255, 255 );

        context.fillStyle = 'rgb(255,0,0)';
        context.beginPath();
        context.arc( x, y, 10, 0, Math.PI * 2, true );
        context.closePath();
        context.fill();

    }
}

export default {
    data() {
        return {
            currentItem: '',
            mockData: [{
                id: '1ac4983ifj34f34',
                label: '七天酒店',
                address: '南京市秦淮区xx街道',
                lnglat: {lat: 31.89, lng: 118.112},
            }, {
                id: '2bv434j0934uj50',
                label: '网鱼网咖',
                address: '南京市鼓楼区xx街道',
                lnglat: {lat: 31.99, lng: 119.012},
            }, {
                id: '3cj4083jt93m045',
                label: '玄武湖',
                address: '南京市玄武区玄武巷1号(近洞庭路)',
                lnglat: {lat: 32.39, lng: 118.5022},
            }],
            markerList: [],
        }
    },
    mounted() {
        const self = this;
        this.$nextTick(() => {
            const center = [32.009323, 118.799246]
            this.center = center;
            const markerIcon = L.icon({
                iconUrl: markerIconUrl,
                iconSize: [25, 41],
            });
            const monvingIcon = L.icon({
                iconUrl: '/static/images/movingMarker.png',
                iconSize: [50, 50],
            });
            this.markerIcon = markerIcon;
            this.monvingIcon = monvingIcon;


            var options = {
                crs: L.CRS.EPSGB3857,
                center,
                zoom: 12,
                doubleClickZoom: false,
            };

            var baseMaps = {
                Normal: new L.TileLayer.BaiduLayer("Normal.Map"),
                satellite: new L.TileLayer.BaiduLayer("Satellite.Map"),
                road: new L.TileLayer.BaiduLayer("Satellite.Road"),
                cnormal: new L.TileLayer.BaiduLayer("CustomStyle.Map.normal"),
                light: new L.TileLayer.BaiduLayer("CustomStyle.Map.light"),
                dark: new L.TileLayer.BaiduLayer("CustomStyle.Map.dark"),
                redalert: new L.TileLayer.BaiduLayer("CustomStyle.Map.redalert"),
                googlelite: new L.TileLayer.BaiduLayer("CustomStyle.Map.googlelite"),
                grassgreen: new L.TileLayer.BaiduLayer("CustomStyle.Map.grassgreen"),
                midnight: new L.TileLayer.BaiduLayer("CustomStyle.Map.midnight"),
                pink: new L.TileLayer.BaiduLayer("CustomStyle.Map.pink"),
                darkgreen: new L.TileLayer.BaiduLayer("CustomStyle.Map.darkgreen"),
                bluish: new L.TileLayer.BaiduLayer("CustomStyle.Map.bluish"),
                grayscale: new L.TileLayer.BaiduLayer("CustomStyle.Map.grayscale"),
                hardedge: new L.TileLayer.BaiduLayer("CustomStyle.Map.hardedge"),
                tianwang: new L.TileLayer.BaiduLayer("tianwang.Map"),
            };
            this.marker = L.marker(center, {
                icon: markerIcon,
            })

            options.layers = [baseMaps.Normal];
            const map = L.map("map", options);

            this.map = map;
            const control = L.control.layers(baseMaps).addTo(map);

            this.map.on('keypress ', (e) => {
                this.map.dragging.enable()
                if(e.originalEvent.code === 'Space') {
                    if(this.map._events.click) {
                        this.map._events.click.splice(0);
                    }
                    if(this.map._events.mousemove) {
                        this.map._events.mousemove.splice(0);
                    }
                    if(this.map._events.dblclick) {
                        this.map._events.dblclick = [];
                    }
                    if(this.tempLine) {
                        this.tempLine.remove();
                    }
                }
            })
            const PanelControl = L.Control.extend({
                initialize(options) {
                    let opts = {};
                    if(!options) {
                        opts.position = 'bottomright';
                        this.imgUrl = '';
                    } else {
                        opts = options.position || 'bottomright';
                        this.imgUrl = options.imgUrl;
                    }
                    this.options = opts;
                    this.flag = false;
                },
                onAdd() {
                    this._container = L.DomUtil.create('div', 'leaflet-control-custom');
                    var legendimg = document.createElement('img');
                    legendimg.className = 'control-icon';
                    legendimg.src = this.imgUrl;
                    legendimg.style.cursor = 'pointer';
                    this._legendimg = legendimg;
                    this._container.appendChild(legendimg);
                    L.DomEvent.on(this._container, 'click', (e) => {
                        this.click();
                        e.stopPropagation();
                    })
                    return this._container;
                },
                updateUrl() {
                    this.flag = !this.flag;
                    this._legendimg.src = this.imgUrl;
                }
            })


            // clear control
            const clearControl = new PanelControl();
            clearControl.imgUrl = '/static/images/clear.png';
            clearControl.click = function() {
                self.clear();
            }
            clearControl.addTo(map);

            // moving control
            const movingControl = new PanelControl();
            movingControl.imgUrl = '/static/images/play.png';
            movingControl.click = function() {
                if(!self.map.hasLayer(self.trackMarker)) {
                    self.dynamicTrajectory();
                }

                this.imgUrl = this.flag ? '/static/images/play.png' : '/static/images/pause.png';
                this.updateUrl();
                if(this.flag) {
                    self.trackMarker.start();
                } else {
                    self.trackMarker.pause();
                }
            }
            movingControl.addTo(map);

            // geoJSON control
            const geoControl = new PanelControl();
            geoControl.imgUrl = '/static/images/geo.png';
            geoControl.click = function() {
                self.geoJson();
            }
            geoControl.addTo(map);

            // drawCircle control
            const circleControl = new PanelControl();
            circleControl.imgUrl = '/static/images/drawCircle.png';
            circleControl.click = function() {
                self.drawCircle();
            }
            circleControl.addTo(map);

            //antPath control
            const antControl = new PanelControl();
            antControl.imgUrl = '/static/images/path.png';
            antControl.click = function() {
                self.antPath();
            }
            antControl.addTo(map);

            //heatmap control
            const heatmapControl = new PanelControl();
            heatmapControl.imgUrl = '/static/images/heatmap.png';
            heatmapControl.click = function() {
                self.heatmap();
            }
            heatmapControl.addTo(map);

            //ranging control
            const rangingControl = new PanelControl();
            rangingControl.imgUrl = '/static/images/ranging.png';
            rangingControl.click = function() {
                self.ranging();
            }
            rangingControl.addTo(map);

            //DrawLine control
            const trackControl = new PanelControl();
            trackControl.imgUrl = '/static/images/track.png';
            trackControl.click = function() {
                self.trackLine();
            }
            trackControl.addTo(map);




            this.addPointToMap(this.mockData);

// **************************end***************************
        })
    },
    methods: {
        antPath() {
            this.removeEvent()
            this.map.dragging.disable();
            const self = this;
            const antLatlngs = [];
            let linePath = [];
            // Usethe constructor...
            let antPolyline = new L.Polyline.AntPath(antLatlngs,
                {
                    color: '#f68a8c',
                    weight: 5,
                    pulseColor: '#ff0000',
                    delay:454,
                    dashArray: [20, 24]
                });
            antPolyline.addTo(this.map);
            this.map.on('click', (ev) => {
                let latlng = L.latLng(ev.latlng.lat, ev.latlng.lng);
                addPath(latlng)
                linePath = [antLatlngs[antLatlngs.length - 1]];
                this.map.on('mousemove', (ev) => {
                    let latlng = L.latLng(ev.latlng.lat, ev.latlng.lng);
                    drawLine(latlng);
                })
            })

            function addPath(latlng) {
                antLatlngs.push(latlng);
                antPolyline.setLatLngs(antLatlngs);
            }
            const polyline = L.polyline(linePath).addTo(this.map);
            this.tempLine = polyline;
            function drawLine(latlng) {
                if(linePath.length === 1) {
                    linePath.push(latlng)
                } else if(linePath.length === 2) {
                    linePath.splice(-1, 1, latlng);
                }
                polyline.setLatLngs(linePath)
            }

        },
        ranging() {
            this.removeEvent();
            this.map.dragging.disable();
            const self = this;
            const latlngs = [];
            const polyline = L.polyline(latlngs, { color: '#ed3f14', opacity: 0.5 }).addTo(this.map);
            this.map.on('click', function(ev) {
                const latlng = L.latLng(ev.latlng.lat, ev.latlng.lng);
                polyline.addLatLng(latlng);
                var flag = true;
                var resLatLngs = polyline.getLatLngs();
                const icon = L.icon({
                    iconUrl: '/static/images/rangingMarker.png',
                    iconSize: [34, 32],
                })
                const startMarker = L.marker(latlng, {
                    icon,
                }).addTo(self.map);
                const endMarker = L.marker([0, 0], {
                    icon,
                }).addTo(self.map);
                endMarker.once('mousedown', function() {
                    polyline.setStyle({
                        opacity: 0.7
                    })
                    self.removeEvent();
                })
                self.map.on('mousemove', function(e) {
                    endMarker.setLatLng(L.latLng(e.latlng.lat, e.latlng.lng))
                    const distanceText = L.CRS.EPSG3857.distance(latlng, L.latLng(e.latlng.lat, e.latlng.lng))
                    if(distanceText) {
                        endMarker.bindPopup((distanceText/1000).toFixed(2)+'km').openPopup();
                    }

                    if(flag) {
                        resLatLngs.push(L.latLng(e.latlng.lat, e.latlng.lng));
                        polyline.setLatLngs(resLatLngs);
                        flag = false;
                    } else {
                        resLatLngs.splice(-1,1,L.latLng(e.latlng.lat, e.latlng.lng));
                        polyline.setLatLngs(resLatLngs);
                    }
                })

            });
        },
        trackLine() {
            var multiCoords = [
                [[31.5468, 116], [33.8068, 118.1318], [34.1242, 119.6699]]
            ];
            const plArray = [];
            for(var i=0; i<multiCoords.length; i++) {
                plArray.push(L.polyline(multiCoords[i]).addTo(this.map));
            }
            L.polylineDecorator(multiCoords, {
                patterns: [
                    {offset: 25, repeat: 100, symbol: L.Symbol.arrowHead({pixelSize: 15, pathOptions: {fillOpacity: 1, weight: 0}})}
                ]
            }).addTo(this.map);
            const swoopy = L.swoopyArrow(multiCoords[0][0], multiCoords[0][2], {
                annotation: 'Hi!',
                fontSize: 16,
                iconAnchor: [20, 10],
                iconSize: [20, 16],
                color: '#ff55aa',
                weight: '2',
            }).addTo(this.map);
            this.map.fitBounds(plArray[plArray.length - 1].getBounds());

        },
        drawPolygon() {
            this.removeEvent();
            var latlngs = [[37, 119.05],[41, 119.03],[41, 112.05],[37, 112.04]];
            var polygon = L.polygon(latlngs, {color: 'red'}).addTo(this.map);
            this.map.fitBounds(polygon.getBounds());
        },
        clear() {
            this.removeEvent()
            const self = this;
            this.map.dragging.enable();
            this.map.eachLayer(function(layer) {
                if(!layer._container) {
                    self.map.removeLayer(layer);
                }
            })
        },
        drawCircle() {
            this.removeEvent()
            const circleGroup = []
            for (let i = 0; i < 30; i++) {
                circleGroup[i] = L.circle([random(30, 31, 6),random(118, 120, 6)], {
                    color: '#ff9900',
                    fillColor: '#ed3f14',
                    fillOpacity: 0.5,
                    radius: 10000
                }).addTo(this.map);
            }
            var circleR = 0;
            for (let i = 0; i < 30; i++) {
                setInterval(() => {
                    if(circleR<10000) {
                        var time = new Date().getTime() * 0.002;
                        var x = Math.sin( time ) * 100 + 800;
                        circleR += x;
                    } else {
                        circleR = 0;
                    }
                    circleGroup[i].setRadius(circleR);
                }, 300)
            }
        },
        heatmap() {
            if(this.map.hasLayer(this.heatmapLayer)) {
                const data = createData(30000, 0.015);
                this.heatmapLayer.setData(data);
                return;
            }
            this.removeEvent()
            const statesData = createData(20000, 0.015);
            const heatmapConfig = {
                radius: 1,                  //设置每一个热力点的半径
                maxOpacity: 0.6,            //设置最大的不透明度
                minOpacity: 0.3,            //设置最小的不透明度
                scaleRadius: true,          //设置热力点是否平滑过渡
                blur: 0.95,                 //系数越高，渐变越平滑，默认是0.85,
                                            //滤镜系数将应用于所有热点数据。
                useLocalExtrema: true,      //使用局部极值
                latField: 'lat',            //纬度
                lngField: 'lng',            //经度
                valueField: 'value',        //热力点的值
                defaultGradient: {          //热力颜色
                    '0.25': 'rgb(225,200,100)',
                    '0.55': 'rgb(250,205, 70)',
                    '0.85': 'rgb(245, 135, 120)',
                    '1':'rgb(215, 100, 125)'
                }
            }
            const heatmapLayer = new HeatmapOverlay(heatmapConfig);
            this.heatmapLayer = heatmapLayer;
            heatmapLayer.addTo(this.map);
            heatmapLayer.setData(statesData);


        },
        geoJson() {
            const loading= this.$loading({
                lock: true,
                text: 'Loading',
                spinner: 'el-icon-loading',
                background: 'rgba(0, 0, 0, 0.4)'
            });
            this.$http.get('http://127.0.0.1:3000/').then((res) => {
                loading.close();
                var geojsonFeature = res.data;
                L.geoJSON(geojsonFeature).addTo(this.map);

                var myLayer = L.geoJSON().addTo(this.map);
                myLayer.addData(geojsonFeature);
                this.map.setView([32.009323, 118.799246], 5);
            }, () => {
                loading.close();
                this.$message.error('服务异常');
            })
        },
        removeEvent() {
            if(this.map._events.click) {
                this.map._events.click.splice(0);
            }
            if(this.map._events.mousemove) {
                this.map._events.mousemove.splice(0);
            }
            if(this.map._events.dblclick) {
                this.map._events.dblclick = [];
            }
        },
        handleLocate() {
            const map = this.map;
            var geolocation = new BMap.Geolocation();
            geolocation.getCurrentPosition(function(r) {
                if(this.getStatus() == BMAP_STATUS_SUCCESS){
                    var mk = new BMap.Marker(r.point);
                    map.panTo(mk.point);
                }
                else {
                    alert('failed'+this.getStatus());
                }
            },{enableHighAccuracy: true});
        },
        addPointToMap(data) {
            const pointList = [];
            _.each(data, (item, index) => {
                const lnglat = [item.lnglat.lat, item.lnglat.lng];
                pointList.push(lnglat);
                const myIcon = L.divIcon({
                    iconSize: [19, 25],
                    className: 'my-div-icon',
                    html: index + 1,
                });
                const marker = L.marker(lnglat, {
                    icon: myIcon,
                })
                marker.bindPopup(`<p>酒店编号：${item.id}</p><p>酒店名称：${item.name}</p>`);
                marker.on('click', function() {
                    this.openPopup()
                    this.map.panTo(this.getLatLng());
                })
                this.markerList.push({
                    id: item.id,
                    marker,
                    num: item.num,
                    name: item.name,
                });
            })
            this.map.fitBounds(L.polygon(pointList).getBounds());
            setTimeout(() => {
                let arr = [];
                for (let i = 0; i < pointList.length; i++) {
                    let a;
                    if(i + 1 === pointList.length) {
                        arr.push(this.markerList[i].marker);
                    } else {
                        arr.push(this.markerList[i].marker);
                        arr.push(
                            L.polyline([pointList[i], pointList[i + 1]], {
                                snakingSpeed: 1000,
                                color: '#e33c00',
                                opacity: 0.6
                            })
                        );
                        arr.push(this.markerList[i+1].marker);
                    }
                }
                var route = L.featureGroup(arr).addTo(this.map);
                let index = 1,
                i = 0;

                route.on('snake', (ev) => {
                    if(index % 2 !== 0) {
                        i++
                        if(i < this.markerList.length) {
                            this.map.panTo(this.markerList[i].marker.getLatLng())
                        }
                    }

                    index++
                });

                route.snakeIn();
            }, 1500);
        },
        dynamicTrajectory() {
            if(this.map.hasLayer(this.trackMarker)) {
                this.map.removeLayer(this.trackMarker);
                return;
            }
            const parisKievLL = [[32.050943,118.748092], [32.101855,118.817945], [32.035762, 118.820244], [32.004903,118.878886], [31.960309, 118.776263], [31.981383, 118.854739]]

            for(let i = 0; i < parisKievLL.length; i++) {
                const icon = L.icon({
                    iconUrl: '/static/images/marker.png',
                    iconSize: [19, 25],
                });
                L.marker(parisKievLL[i], {
                    icon,
                }).addTo(this.map);
            }
            const markers = [];

            // add animated marker

            const polyline = L.polyline(parisKievLL, {color: 'orange'}).addTo(this.map);
            this.map.fitBounds(polyline.getBounds());
            setTimeout(() => {
                this.trackMarker = L.Marker.movingMarker(
                    parisKievLL,
                    [2000, 2000, 2000, 2000, 2000],
                    {
                        icon: this.monvingIcon,
                        autostart: true,
                    })
                .addTo(this.map);
            }, 200);

        },
        handleClick(id) {
            this.currentItem = id;
            _.each(this.markerList, (item) => {
                if(item.id === id) {
                    item.marker.openPopup()
                    this.map.panTo(item.marker.getLatLng(), {
                        animated: true,
                        duration: .5,
                    })
                } else {
                    item.marker.closePopup();
                }
            })
        },
    }
};
</script>

<style lang="scss">
.wrapper {
    position: relative;
    &.fullscreen {
        position: absolute;
        z-index: 10000;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        height: 100%;
    }
    .panel {
        position: absolute;
        z-index: 899;
        left: 56px;
        top: 56px;
        bottom: 180px;
        width: 306px;
        padding: 16px 8px 8px;
        background: #fff;
        box-shadow: 0px 4px 18px 0px rgba(0, 0, 0, 0.48);
        .search-area {
            position: relative;
            width: 100%;
            height: 32px;
            .search-input {
                width: 100%;
                line-height: 30px;
                padding: 0 30px 0 6px;
                box-sizing: border-box;
                outline: none;
                border: 1px solid #dcdfe6;
                border-radius: 4px;
                &:hover  {
                    border-color: #c0c4cc;
                }
                &.active, &:focus {
                    border-color: #e33C00;
                    &+.search-icon {
                        background-image: url('/static/images/search-icon-focus.png')
                    }
                }
            }
            .search-icon {
                position: absolute;
                top: 0;
                right: 0;
                display: inline-block;
                width: 30px;
                height: 100%;
                background: url('/static/images/search-icon.png') no-repeat center;
                background-size: 60%;
            }
        }
        .point-panel {
            height: calc(100% - 32px);
            overflow: auto;
            .point-list {
                margin-top: 8px;
                .point-item {
                    display: flex;
                    padding: 16px;
                    cursor: pointer;
                    &.active, &:hover {
                        background-color: #e3e4e5;
                    }
                    .badge {
                        width: 28px;
                        height: 30px;
                        margin-right: 8px;
                        background: url('/static/images/badge.png') no-repeat center;
                        background-size: 100%;
                        color: #fff;
                        text-align: center;
                        line-height: 24px;
                        font-size: 12px;
                    }
                    .cont {
                        max-width: calc(100% - 38px);
                        overflow: hidden;
                        font-size: 14px;
                        p {
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }
                    }
                }
            }
        }
    }
}
.tools {
    position: absolute;
    z-index: 10000;
    bottom: 100px;
    right: 10px;
    display: flex;
    flex-direction: column;
}
.tools .el-button {
    margin-bottom: 8px;
}
.leaflet-control-custom  {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    cursor: pointer;
    &:hover {
        transform: scale(1.1);
    }
    .control-icon {
        width: 24px;
        height: 24px;
        display: inline-block;
        padding: 3px;
        border: 2px solid #ddd;
        background: #f4f4f4;
        &:hover {
            transform: scale(1.1);
        }
    }
}
.my-div-icon {
    background: url('/static/images/marker.png') center no-repeat;
    line-height: 24px;
    color: #fff;
    text-align: center;
    margin-top: -25px!important;
}
</style>
