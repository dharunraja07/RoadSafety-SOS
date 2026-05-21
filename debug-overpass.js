const https = require('https');
const query = `[out:json][timeout:25];(node["amenity"="hospital"](around:5000,11.0168,76.9558);way["amenity"="hospital"](around:5000,11.0168,76.9558);relation["amenity"="hospital"](around:5000,11.0168,76.9558););out center;`;
const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(query),
    },
};
const req = https.request('https://overpass-api.de/api/interpreter', options, (res) => {
    console.log('status', res.statusCode, res.statusMessage);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('body len', data.length);
        console.log(data.slice(0, 300));
    });
});
req.on('error', (err) => {
    console.error('request error', err);
});
req.write(query);
req.end();
