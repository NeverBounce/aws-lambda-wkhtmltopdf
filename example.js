const lambda = require('./index.js');
const fs = require('fs');
let startTime = Date.now();
let currentTime = Date.now();

lambda.handler({
    queryStringParameters: {
        url: 'http://172.38.0.236/internal/transaction/NBTRNS-DRF8IS-20171121/invoice/html'
    }
}, {
    getRemainingTimeInMillis()
    {
        currentTime = Date.now();
        return (5000 - (currentTime - startTime));
    }
}, (err, arg) => {
    console.log(err, arg);
    if(arg && arg.body) {
        let body = JSON.parse(arg.body);
        if(body.pdf_base64) {
            let buffer = new Buffer(body.pdf_base64, 'base64');
            fs.writeFileSync('output.pdf', buffer);
        }
    }
});