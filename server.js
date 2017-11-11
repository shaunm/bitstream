var express = require("express");
var zlib = require('zlib')
var http = require("http");
var https = require("https");
var fs = require('fs');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ parameterLimit: 100000, limit: '25mb', extended: true })); // support encoded bodies

//app.use(bodyParser.json({limit: '25mb', type: 'application/json'}));


if (process.env.REDISTOGO_URL) {
	var rtg   = require("url").parse(process.env.REDISTOGO_URL);
	var redis = require("redis").createClient(rtg.port, rtg.hostname);
	redis.auth(rtg.auth.split(":")[1]);
} else {
    var redis = require("redis").createClient();
}




app.all("*", function(request, response, next) {
	response.writeHead(200, {
		"Content-Type": "text/html",
		"Access-Control-Allow-Origin": "*",
		"X-FRAME-OPTIONS": "ALLOW",
		"Vary": "Accept-Encoding",
		"Connection": "keep-alive",
		"Content-Encoding": "gzip"
	});
	next();
});
app.get("/store", function(request, response) {
	console.log(request.body);
	id = request.body.id;
	base64 = request.body.data;
	console.log(id + ", "+ base64);
	redis.set(id, base64);
	redis.expire(id, 600);
	zlib.gzip('{"' + id + '": "success"}', function(error, result) {
		if (error) throw error;
		response.end(result);
	})
});
app.get("/retrieve", function(request, response) {
	fileData = redis.get(request.query.id)
	var fileContents = Buffer.from(fileData, "base64");
	zlib.gzip(fileContents, function(error, result) {
		if (error) throw error;
		response.end(result);
	})
});
app.get("/", function(request, response) {
	page = '<!DOCTYPE html><html style="font-family:sans-serif;"><head><title>Bitstream</title><script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script></head><body><style>.container{width:80%; margin-left: 10%;}</style><div align="center" class="container"><h1>Please upload a document (under 25 mb)</h1><input id="inputFile" onchange="convertToBase64();" type="file"> <span id="bitstream"></span><script type="text/javascript">function convertToBase64(){var selectedFile=document.getElementById("inputFile").files; if (selectedFile.length > 0){var fileToLoad=selectedFile[0]; var fileReader=new FileReader(); var base64;var file_id; fileReader.onload=function(fileLoadedEvent){base64=fileLoadedEvent.target.result; file_id=makeid();}; basedata=fileReader.readAsDataURL(fileToLoad);$.ajax({url: "/store", dataType: "json", type: "post", contentType: "application/json", data: JSON.stringify({"id": file_id, "data": basedata}), processData: false, success: function( data, textStatus, jQxhr ){$("#bitstream").html("<a href=&quot;/retrieve?id=" + file_id + "&quot;> Copy this link (expires in 10 min) </a>")}, error: function( jqXhr, textStatus, errorThrown ){console.log( errorThrown );}});}}function makeid(){var text=""; var possible="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; for (var i=0; i < 5; i++) text +=possible.charAt(Math.floor(Math.random() * possible.length)); return text;}</script></div></body></html>';
	zlib.gzip(page, function(error, result) {
		if (error) throw error;
		response.end(result);
	})

});
app.get("*", function(request, response) {
	zlib.gzip('Error! Endpoint not found!', function(error, result) {
		if (error) throw error;
		response.end(result);
	})
});



var port = process.env.PORT || 8000;
app.listen(port);
