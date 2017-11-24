<template>
    <div style="width:100%;height:100%" class="wrapper">
        <div id="map" style="width:100%;height:100%"></div>
        <div class="tools">
            <el-button size="small" @click="handleLocate">定位</el-button>
            <el-button size="small" @click="antPath">antPath</el-button>
            <el-button size="small" @click="heatmap">heatmap</el-button>
            <el-button size="small" @click="ranging">测距</el-button>
            <el-button size="small" @click="drawArrowLine">DrawLine</el-button>
            <el-button size="small" @click="drawPolygon">drawPolygon</el-button>
            <el-button size="small" @click="drawCircle">drawCircle</el-button>
            <el-button size="small" @click="dynamicTrajectory">动态轨迹</el-button>
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

export default {
    mounted() {
        const self = this;
        this.$nextTick(() => {

            let center = [32.009323, 118.799246]
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
                zoom: 12
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
                openStreetMap: new L.TileLayer.BaiduLayer("openStreetMap.Map"),
                mapbox: new L.TileLayer.BaiduLayer("mapbox.Map"),
            };
            const marker = L.marker(center, {
                icon: markerIcon,
                riseOnHover: true,
            })
            this.marker = marker;
            var overlayMaps = {
                Office: marker.bindPopup('I\'m working Nanjing!')
            };

            options.layers = [baseMaps.Normal, overlayMaps.Office];
            const map = L.map("map", options);

            this.map = map;
            this.renderer = renderer;
            L.control.layers(baseMaps, overlayMaps).addTo(map);
            marker.openPopup()
            // leaflet use geojson
            this.$http.get('http://127.0.0.1:3000/').then((res) => {
                var geojsonFeature = res.data;
                L.geoJSON(geojsonFeature).addTo(map);

                var myLayer = L.geoJSON().addTo(map);
                myLayer.addData(geojsonFeature);

            })
            /* var geojsonFeature = {
                "type": "Feature",
                "properties": {
                    "name": "Coors Field",
                    "amenity": "Baseball Stadium",
                    "popupContent": "This is where the Rockies play!"
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [-104.99404, 39.75621]
                }
            };
            L.geoJSON(geojsonFeature).addTo(map);
            var myLines = [{
                "type": "LineString",
                "coordinates": [[-100, 40], [-105, 45], [-110, 55]]
            }, {
                "type": "LineString",
                "coordinates": [[-105, 40], [-110, 45], [-115, 55]]
            }];
            var myLayer = L.geoJSON().addTo(map);
            myLayer.addData(geojsonFeature);
            var myLines = [{
                "type": "LineString",
                "coordinates": [[-100, 40], [-105, 45], [-110, 55]]
            }, {
                "type": "LineString",
                "coordinates": [[-105, 40], [-110, 45], [-115, 55]]
            }];

            var myStyle = {
                "color": "#ff7800",
                "weight": 5,
                "opacity": 0.65
            };

            L.geoJSON(myLines, {
                style: myStyle
            }).addTo(map); */



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








            /* var imageUrl = 'http://www.lib.utexas.edu/maps/historical/newark_nj_1922.jpg',
                imageBounds = [[32.712216, 119.22655], [32.773941, 119.12544]];
            L.imageOverlay(imageUrl, imageBounds).addTo(map); */




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

    var coordinates = [
    [21.1500, 79.0900],
    [18.948932, 72.776714],
    [28.6139, 77.2090],
    [25.6000, 85.1000],
    [17.3700, 83.4800]
];

var arrowIcon = L.icon({
    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAVlpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KTMInWQAAAdpJREFUOBGFVDtOA0EMnewGCS7ACeAYUIISEtpAxRGgRaLlFijiFkCAlgqJDokT0CAqJD7ZxLznsScT2GR35IzXnzdvbG9CWPZIKOhuS3u3lLKroWZbllbvyxIB9gB5TIGZL9kaFQltxoDdDsB8dTTPfI0YKUBCy3VA3SQ4Ke/cHrKYZFuoSFihD0AdBZtmv1L2NM9iFmIkR3YyYEYKJeUYO4XrPovVpqX3WmXGbs8ACDIx8Vrua24jy6x7APDa/UDnpSnUufJaLmFp3UNCzq5KcFJWBkjQvrHUafh/23p23wbgDAnktgaWM3bdjAVr52C+T9QSr+4d/8NyvrO3Buj1ciDfCeW+nGWa3YAh9bnrNbBzUDL35SwVowBYge9ibEU9sb1Se3wRbBMT6iTAzlaqhxBziKH2Gbt+OjN2kx3lMJOVL+q00Zd3PLHM2R3biV/KAV8edha7JUGeKNTNRh/ZfkL4xFy/KU7z2uW1oc4GHSJ1DbIK/QAyguTsfBLi/yXhEXAN8fWOD22Iv61t+uoe+LYQfQF5S1lSXmksDAMaCyleIGdgsjkHwhqz2FG0k8kvYQM5p5BnAx608HKOgNdpmF6iQh8aHOeS9atgi511lDofSlKE4ggh679ecGIXq+UAsgAAAABJRU5ErkJggg==',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [-3, -76]
});

for (var i = 1; i < coordinates.length; i++) {

    //Drawing simple line
   /*  L.polyline([coordinates[0], coordinates[i]], {
        color: 'green'
    }).addTo(map); */

    //Code for putting arrow with appropriate rotation
    var firstPoint = coordinates[0].slice(),
        secondPoint = coordinates[i].slice(),
        slope = ((secondPoint[1] - firstPoint[1]) / (secondPoint[0] - firstPoint[0])),
        angle = Math.atan(slope),
        rotation;

    //Shifting the graph Origin to point of start point
    secondPoint[0] = secondPoint[0] - firstPoint[0];
    secondPoint[1] = secondPoint[1] - firstPoint[1];

	//Fourth quadrant
    if (secondPoint[0] > 0 && secondPoint[1] < 0) {
        rotation = (angle * 180/Math.PI)/2;
    }
    //Second quadrant
    else if (secondPoint[0] < 0 && secondPoint[1] > 0) {
        rotation = 180 + (angle * 180/Math.PI);
    }
    //Third quadrant
    else if (secondPoint[0] < 0 && secondPoint[1] < 0) {
        rotation =  180 + (angle * 180/Math.PI);
    }
    //First quadrant
    else if (secondPoint[0] > 0 && secondPoint[1] > 0) {
        rotation = (angle * 180/Math.PI);
    }

	// L.marker(coordinates[i], {icon: arrowIcon,iconAngle: rotation}).addTo(map);
}






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
                console.log(polyline)
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
                        self.marker.bindPopup((distanceText/1000).toFixed(2)+'km')
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
            });

        },
        drawArrowLine() {
            const self = this;

            var multiCoords1 = [
                [[31.5468, 116], [33.8068, 118.1318], [34.1242, 119.6699]]
            ];
            var plArray = [];
            for(var i=0; i<multiCoords1.length; i++) {
                plArray.push(L.polyline(multiCoords1[i]).addTo(self.map));
            }
            L.polylineDecorator(multiCoords1, {
                patterns: [
                    {offset: 25, repeat: 100, symbol: L.Symbol.arrowHead({pixelSize: 15, pathOptions: {fillOpacity: 1, weight: 0}})}
                ]
            }).addTo(self.map);
            const swoopy = L.swoopyArrow(center, [33,119], {
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
           /*  var layout = L.layerGroup(circleGroup)
                .addLayer(this.polyline)
                .addTo(this.map); */
        },
        heatmap() {
            console.log(this.map.hasLayer(heatmapLayer))
            this.map.eachLayer(function(layer) {
                console.log(layer)
            })
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
            const map = this.map
            map.locate({
                setView: true,
            })
        },
        dynamicTrajectory() {
            const self = this;
            let marker;
            const markerPos = [[32.050943,118.748092], [32.101855,118.817945], [32.035762, 118.820244], [32.004903,118.878886], [31.960309, 118.776263], [31.981383, 118.854739]]
            for(let i = 0; i < markerPos.length; i++) {
                if(i > 0) {
                    L.layerGroup([L.marker(markerPos[i], {
                        icon: this.markerIcon
                    })])
                    .addLayer(marker)
                    .addTo(this.map);
                } else {
                    marker = L.marker(markerPos[i], {
                        icon: this.markerIcon
                    }).addTo(this.map)
                }
            }
            var multiCoords1 = [
                markerPos
            ];
            var plArray = [];
            for(var i=0; i<multiCoords1.length; i++) {
                plArray.push(L.polyline(multiCoords1[i]).addTo(self.map));
            }
            L.polylineDecorator(multiCoords1, {
                patterns: [
                    {offset: 25, repeat: 100, symbol: L.Symbol.arrowHead({pixelSize: 15, pathOptions: {fillOpacity: 1, weight: 0}})}
                ]
            }).addTo(self.map);
            _.each(markerPos, function(routeLine) {
                var pig = L.animatedMarker(routeLine.getLatLngs(), {
                    icon: this.pig,
                    autoStart: true,
                    onEnd: function() {
                        $(this._shadow).fadeOut();
                        $(this._icon).fadeOut(3000, function(){
                            map.removeLayer(this);
                        });
                    }
                })
            })
            map.addLayer(marker);
            const markers = [];
            markers.push(marker);
            _.each()
            _.each(markers, function(marker) {
                marker.start();
            });
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
