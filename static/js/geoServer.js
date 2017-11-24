var http = require('http');
var url = require('url');
const osmGeoJson = require('osm-geojson');

http.createServer(function(req, res){
    const options = {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
    };
    res.writeHead(200, options);

    osmGeoJson.get('365331').then((GeoJson) => {
        res.write(JSON.stringify(GeoJson));
        res.end();
    })

}).listen(3000);
console.log('Server running at http://127.0.0.1:3000/');
