<template>
    <div style="width:100%;height:100%" class="wrapper">
        <div id="map" style="width:100%;height:100%"></div>
        <div class="tools">
            <el-button size="small" @click="antPath">antPath</el-button>
            <el-button size="small" @click="heatmap">heatmap</el-button>
            <el-button size="small" @click="ranging">测距</el-button>
            <el-button size="small" @click="drawArrowLine">DrawLine</el-button>
            <el-button size="small" @click="drawCircle">drawCircle</el-button>
            <el-button size="small" @click="dynamicTrajectory">动态轨迹</el-button>
            <el-button size="small" @click="geoJson">geoJson</el-button>
            <el-button size="small" @click="test">{{state}}</el-button>
            <el-button size="small" @click="clear">clear</el-button>
        </div>
    </div>
</template>
<script>
import L from 'leaflet';
import HeatmapOverlay from 'leaflet-heatmap';
import markerIconUrl from '../assets/single_marker.png';
import polylineMarkerIcon from '../assets/polylineMarkerIcon.png';
import pigIcon from '../assets/pig.png';
import { AntPath, antPath } from 'leaflet-ant-path';
import '../../static/js/leaflet-BMap.js';
import '../../static/js/BMapAPI.js';
import '../../static/js/animatedMarker.js';
import 'lodash';

import 'leaflet-swoopy';
import 'leaflet-polylinedecorator';




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
            radius: radius
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
            state: 'start',
        }
    },
    mounted() {
        const self = this;
        this.$nextTick(() => {
            let center = [32.009323, 118.799246]
            this.center = center;
            const markerIcon = L.icon({
                iconUrl: markerIconUrl,
                iconSize: [25, 41],
            });
            const pig = L.icon({
                iconUrl: pigIcon,
                iconSize: [50, 50],
            });
            this.markerIcon = markerIcon;
            this.pig = pig;
            const renderer = L.svg({
                padding: 0.3,
                className: 'linePath'
            })


            var options = {
                crs: L.CRS.EPSGB3857,
                center,
                zoom: 12,
                doubleClickZoom: false
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
            const marker = L.marker(center, {
                icon: markerIcon,
                riseOnHover: true,
            })
            this.marker = marker;
            var overlayMaps = {
                Office: marker.bindPopup('hello world!')
            };

            options.layers = [baseMaps.Normal, overlayMaps.Office];
            const map = L.map("map", options);

            this.map = map;
            this.renderer = renderer;
            const control = L.control.layers(baseMaps, overlayMaps).addTo(map);
            marker.openPopup()

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

                }
            })

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
            let antPolyline = new L.Polyline.AntPath(antLatlngs, {color: 'red', weight: 5});
            antPolyline.addTo(this.map);
            this.map.on('click', function(ev) {
                let latlng = L.latLng(ev.latlng.lat, ev.latlng.lng);
                addPath(latlng)
                linePath = [antLatlngs[antLatlngs.length - 1]]
            })
            this.map.on('mousemove', function(ev) {
                let latlng = L.latLng(ev.latlng.lat, ev.latlng.lng);
                drawLine(latlng)
            })
            function addPath(latlng) {
                antLatlngs.push(latlng);
                antPolyline.setLatLngs(antLatlngs);
            }
            const polyline = L.polyline(linePath, { renderer: self.renderer}).addTo(this.map);
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
            this.removeEvent()
            this.map.dragging.disable();
            const self = this;
            const latlngs = [];
            const polyline = L.polyline(latlngs, { renderer: self.renderer}).addTo(this.map);
            this.map.on('click', function(ev) {
                const latlng = L.latLng(ev.latlng.lat, ev.latlng.lng);
                polyline.addLatLng(latlng);
                var flag = true;
                var resLatLngs = polyline.getLatLngs()
                self.marker.addTo(self.map);
                self.map.on('mousemove', function(e) {
                    self.marker.setLatLng(L.latLng(e.latlng.lat, e.latlng.lng))
                    const distanceText = L.CRS.EPSG3857.distance(latlng, L.latLng(e.latlng.lat, e.latlng.lng))
                    if(distanceText) {
                        self.marker.bindTooltip((distanceText/1000).toFixed(2)+'km').openTooltip();
                        self.marker.unbindPopup()
                        //self.marker.bindPopup((distanceText/1000).toFixed(2)+'km')
                    }

                    if(flag) {
                        resLatLngs.push(L.latLng(e.latlng.lat, e.latlng.lng))
                        polyline.setLatLngs(resLatLngs)
                        flag = false;
                    } else {
                        resLatLngs.splice(-1,1,L.latLng(e.latlng.lat, e.latlng.lng))
                        polyline.setLatLngs(resLatLngs)
                    }
                })
                self.marker.on('click', function() {
                    self.map.dragging.enable();
                    self.removeEvent()
                })
            });
        },
        drawArrowLine() {
            const self = this;

            var multiCoords = [
                [[31.5468, 116], [33.8068, 118.1318], [34.1242, 119.6699]]
            ];
            var plArray = [];
            for(var i=0; i<multiCoords.length; i++) {
                plArray.push(L.polyline(multiCoords[i]).addTo(self.map));
            }
            L.polylineDecorator(multiCoords, {
                patterns: [
                    {offset: 25, repeat: 100, symbol: L.Symbol.arrowHead({pixelSize: 15, pathOptions: {fillOpacity: 1, weight: 0}})}
                ]
            }).addTo(self.map);
            const swoopy = L.swoopyArrow(this.center, [33,119], {
                annotation: 'Hi!',
                fontSize: 16,
                iconAnchor: [20, 10],
                iconSize: [20, 16],
                color: '#ff55aa',
                weight: '2',
            }).addTo(this.map);

        },
        drawPolygon() {
            this.removeEvent()
            var latlngs = [[37, 119.05],[41, 119.03],[41, 112.05],[37, 112.04]];
            var polygon = L.polygon(latlngs, {color: 'red'}).addTo(this.map);
            this.map.fitBounds(polygon.getBounds());
        },
        clear() {
            this.removeEvent()
            const self = this;
            this.map.dragging.enable()
            this.map.eachLayer(function(layer) {
                if(!layer._container) {
                    self.map.removeLayer(layer)
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
                    circleGroup[i].setRadius(circleR)
                }, 300)
            }
        },
        heatmap() {
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
            heatmapLayer.addTo(this.map);
            heatmapLayer.setData(statesData);

            // 生成热力图数据
            this.map.on('click ', () => {
                this.map.dragging.enable()
                const data = createData(30000, 0.015);
                heatmapLayer.setData(data);
            })

        },
        customLine() {
            this.removeEvent()
            this.map.on('click', (ev) => {
                const latlng = L.latLng(ev.latlng.lat, ev.latlng.lng);
                const latlngs = [];
                const polyline = L.polyline(latlngs, { renderer: self.renderer}).addTo(this.map);
                polyline.addLatLng(latlng);
                var flag = true;
                var resLatLngs = polyline.getLatLngs()
                this.map.on('mousemove', function(e) {
                    resLatLngs.push(L.latLng(e.latlng.lat, e.latlng.lng))
                    polyline.setLatLngs(resLatLngs)
                    flag = false;
                    polyline.setLatLngs(resLatLngs)
                })
            })
        },
        geoJson() {
            const loading= this.$loading({
                lock: true,
                text: 'Loading',
                spinner: 'el-icon-loading',
                background: 'rgba(0, 0, 0, 0.6)'
            });
            this.$http.get('http://127.0.0.1:3000/').then((res) => {
                loading.close();
                var geojsonFeature = res.data;
                L.geoJSON(geojsonFeature).addTo(this.map);

                var myLayer = L.geoJSON().addTo(this.map);
                myLayer.addData(geojsonFeature);
                this.map.setView([32.009323, 118.799246], 5)
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
            geolocation.getCurrentPosition(function(r){
                if(this.getStatus() == BMAP_STATUS_SUCCESS){
                    var mk = new BMap.Marker(r.point);
                    map.panTo(mk.point);
                }
                else {
                    alert('failed'+this.getStatus());
                }
            },{enableHighAccuracy: true})
        },
        dynamicTrajectory() {
            if(this.map.hasLayer(this.trackMarker)) {
                this.map.removeLayer(this.trackMarker);
                return;
            }
            const self = this;
            const markerPos = [[32.050943,118.748092], [32.101855,118.817945], [32.035762, 118.820244], [32.004903,118.878886], [31.960309, 118.776263], [31.981383, 118.854739]]

            // add marker
            for(let i = 0; i < markerPos.length; i++) {
                L.marker(markerPos[i], {
                    icon: this.markerIcon
                }).addTo(this.map);
            }
            const markers = [];

            // add animated marker
            var parisKievLL = markerPos;
            var trackMarker = L.Marker.movingMarker(parisKievLL, [2000,2000,2000,2000,2000], {icon: this.pig}).addTo(self.map);
            L.polyline(parisKievLL, {color: 'red'}).addTo(self.map);
            trackMarker.once('click', function () {
                trackMarker.start();
                trackMarker.closePopup();
                trackMarker.unbindPopup();
                trackMarker.on('click', function() {
                    if (trackMarker.isRunning()) {
                        trackMarker.pause();
                    } else {
                        trackMarker.start();
                    }
                });
                setTimeout(function() {
                    trackMarker.bindPopup('<b>Click me to pause !</b>').openPopup();
                }, 2000);
            });

            trackMarker.bindPopup('<b>Click me to start !</b>').openPopup();
            this.trackMarker = trackMarker;
        },
        test() {
            if (this.trackMarker.isRunning()) {
                this.trackMarker.pause();
                this.state = 'start';
            } else {
                this.trackMarker.start();
                this.state = 'pause';
            }
        }
    }
};
</script>

<style>
.wrapper {
    position: relative;
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
</style>
