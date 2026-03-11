const http = require('http');

const data = JSON.stringify({
    date: new Date().toISOString().slice(0, 10),
    customer: 'Test Customer',
    items: [{ name: 'Test Medicine', quantity: 2 }],
    total: 100.50,
    branch_id: 1
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/sales-details',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(data);
req.end();
