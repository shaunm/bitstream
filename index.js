const express = require("express");
const compression = require("compression");
const crypto = require('crypto');
const app = express();

app.use(compression());

const client = require('redis').createClient(process.env.REDIS_URL || {
    host: 'localhost',
    port: 6379
});

app.all("*", (req, res, next) => {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
    });
    next();
});

app.post("/store", async (req, res) => {
    let b64 = req.body.data;

    let id = crypto.createHash('md5').update(b64).digest("hex").toString().substring(0, 8);

    try {
        await client.set(id, b64, 300);
    }
    catch(e){
        res.status(500).json({"error": e});
    }
    res.json({"success": id});
});

app.get("/get/:file", (req, res) => {
    client.get(req.params.file, (error, result) => {
        if (error) {
            console.error('Error: ' + error);
            res.status(500).json({"error": error});
        } else {
            res.json({"data": result});
        }
    });
})

app.get("*", function(req, res) {
    res.status(404).json({"error": "endpoint not found"});
});

let port = process.env.PORT || 8000;
app.listen(port);