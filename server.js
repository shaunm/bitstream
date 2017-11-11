var express = require("express");
var zlib = require('zlib')
var http = require("http");
var https = require("https");
var fs = require('fs');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ parameterLimit: 100000, limit: '25mb', extended: true })); // support encoded bodies
app.use(bodyParser.json({limit: '25mb', type: 'application/json'}));


var client = require('redis').createClient(process.env.REDIS_URL || {host : 'localhost', port : 6379});



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
app.post("/store", function(request, response) {
	id = request.body.id;
	base64 = request.body.data;
	console.log(id + ", "+ base64);
	client.set(id, base64,'EX', 300);
	zlib.gzip('{"' + id + '": "success"}', function(error, result) {
		if (error) throw error;
		response.end(result);
	})
});
app.get("/retrieve", function(request, response) {
	//var fileContents = Buffer.from(fileData, "base64");
	client.get(request.query.id, function(error, result) {
	    if (error){
				console.log('Error: '+ error);
				zlib.gzip(error, function(error, result) {
					if (error) throw error;
					response.end(result);
				})
			}
	    else{
				zlib.gzip('<!DOCTYPE html> <html style="font-family:sans-serif; font-weight:light;" align="center"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head> <body style=" margin: 0px; overflow: hidden; "> <title>File</title> <iframe id="main" style="width:100%; height:100vh; border:0px;"></iframe></body> <script> baseString= "' + result + '"; document.getElementById("main").setAttribute("src", baseString); </script>  </html>', function(error, result) {
					if (error) throw error;
					response.end(result);
				})
			}
	});

});
app.get("/", function(request, response) {
	page = `
	<!DOCTYPE html>
<html style="overflow-x: hidden;">
<head>
	<title>Bitstream</title>
	<meta content="width=device-width, initial-scale=1" name="viewport">



</head>
<body>
	<style>
	</style>
	<div class="container">
		<div align="center">
			<h1 style=" font-size: -webkit-xxx-large;">BitStream.ml</h1>
			<div class="animation" style="width:50%; margin-bottom:12vh">
				<div class="block"></div>
			</div>
			<h3>Upload a file (under 25 mb)<br></h3>
			<form>
				<input id="inputFile" onchange="convertToBase64();" type="file">
				<p>Drag a file here or click.</p>
			</form>
		</div>
		<style>
		      body{
		          background: rgba(0,0,0,0.9);
		          color: white;
		          font-family: 'PT Mono', monospace;
		      }
		      form{
		          width: 33%;
		          height: 25%;
		          border: 4px dashed #fff;
		      }
		      form p{
		          width: 100%;
		          height: 100%;
		          text-align: center;
		          line-height: 170px;
		          color: #ffffff;
		      }
		      form input{
		          position: absolute;
							margin-left: -50%;
							margin-top: -35%;
		          padding: 0;
		          width: 100%;
		          height: 100%;
		          outline: none;
		          opacity: 0;
		      }
		      @media only screen and (max-width: 768px)  {
		          form{
		              width:100%!important;
		              height:30vh!important;
		          }

		      }
		      .block {
		          width: 6vh;
		          height: 6vh;
		          background-color: white;
		          position: relative;
		          -webkit-animation-name: stream; /* Safari 4.0 - 8.0 */
		          -webkit-animation-duration: 4s; /* Safari 4.0 - 8.0 */
		          animation-name: stream;
		          animation-duration: 4s;
		          animation-iteration-count: infinite;

		      }

		      /* Safari 4.0 - 8.0 */
		      @-webkit-keyframes stream {
		          0%   {background-color:#FFF; left:0%; top:0%}
		          25%  {background-color:#F44336; left:25%; top:0%;}
		          50%  {background-color:#FFEB3B; left:50%; top:0%;}
		          75%  {background-color:#2196F3; left:75%; top:0%;}
		          100% {background-color:#FFFF; left:100%; top:0%;}
		      }

		      /* Standard syntax */
		      @keyframes stream {
		          0%   {background-color:#FFF; left:0%; top:0%}
		          25%  {background-color:#F44336; left:25%; top:0%;}
		          50%  {background-color:#FFEB3B; left:50%; top:0%;}
		          75%  {background-color:#2196F3; left:75%; top:0%;}
		          100% {background-color:#FFFF; left:100%; top:0%;}
		      }
					input.copy{
				    min-height: 34px;
				    font-size: 13px;
				    color: #333;
				    vertical-align: middle;
				    background-color: #fff;
				    background-repeat: no-repeat;
				    width: 15%;
				    background-position: right 8px center;
				    border: 1px solid #ccc;
				    border-radius: 3px;
						z-index:100;
				    outline: none;
				    box-shadow: inset 0 1px 2px rgba(0,0,0,0.075);

					}
					button.btn{
						position: relative;
						display: inline-block;
						padding: 6px 12px;
						font-size: 13px;
						font-weight: bold;
						line-height: 20px;
						color: #333;
						white-space: nowrap;
						vertical-align: middle;
						cursor: pointer;
						background-color: #eee;
						background-image: linear-gradient(#fcfcfc,#eee);
						border: 1px solid #d5d5d5;
						border-radius: 3px;
						-webkit-user-select: none;
						-moz-user-select: none;
						-ms-user-select: none;
						user-select: none;
						-webkit-appearance: none;
						    max-height: 36px;
					}
		</style>
		<div align="center" style="margin-top:20vh;" id="bitstream">

	</div>
	<link href="https://fonts.googleapis.com/css?family=PT+Mono" rel="stylesheet">
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
	<script src="https://cdn.rawgit.com/zenorocha/clipboard.js/v1.7.1/dist/clipboard.min.js"></script>
		<script type="text/javascript">
		      var MD5 = function(s){function L(k,d){return(k<<d)|(k>>>(32-d))}function K(G,k){var I,d,F,H,x;F=(G&2147483648);H=(k&2147483648);I=(G&1073741824);d=(k&1073741824);x=(G&1073741823)+(k&1073741823);if(I&d){return(x^2147483648^F^H)}if(I|d){if(x&1073741824){return(x^3221225472^F^H)}else{return(x^1073741824^F^H)}}else{return(x^F^H)}}function r(d,F,k){return(d&F)|((~d)&k)}function q(d,F,k){return(d&k)|(F&(~k))}function p(d,F,k){return(d^F^k)}function n(d,F,k){return(F^(d|(~k)))}function u(G,F,aa,Z,k,H,I){G=K(G,K(K(r(F,aa,Z),k),I));return K(L(G,H),F)}function f(G,F,aa,Z,k,H,I){G=K(G,K(K(q(F,aa,Z),k),I));return K(L(G,H),F)}function D(G,F,aa,Z,k,H,I){G=K(G,K(K(p(F,aa,Z),k),I));return K(L(G,H),F)}function t(G,F,aa,Z,k,H,I){G=K(G,K(K(n(F,aa,Z),k),I));return K(L(G,H),F)}function e(G){var Z;var F=G.length;var x=F+8;var k=(x-(x%64))/64;var I=(k+1)*16;var aa=Array(I-1);var d=0;var H=0;while(H<F){Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=(aa[Z]| (G.charCodeAt(H)<<d));H++}Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=aa[Z]|(128<<d);aa[I-2]=F<<3;aa[I-1]=F>>>29;return aa}function B(x){var k="",F="",G,d;for(d=0;d<=3;d++){G=(x>>>(d*8))&255;F="0"+G.toString(16);k=k+F.substr(F.length-2,2)}return k}function J(k){k=k.replace(/rn/g,"n");var d="";for(var F=0;F<k.length;F++){var x=k.charCodeAt(F);if(x<128){d+=String.fromCharCode(x)}else{if((x>127)&&(x<2048)){d+=String.fromCharCode((x>>6)|192);d+=String.fromCharCode((x&63)|128)}else{d+=String.fromCharCode((x>>12)|224);d+=String.fromCharCode(((x>>6)&63)|128);d+=String.fromCharCode((x&63)|128)}}}return d}var C=Array();var P,h,E,v,g,Y,X,W,V;var S=7,Q=12,N=17,M=22;var A=5,z=9,y=14,w=20;var o=4,m=11,l=16,j=23;var U=6,T=10,R=15,O=21;s=J(s);C=e(s);Y=1732584193;X=4023233417;W=2562383102;V=271733878;for(P=0;P<C.length;P+=16){h=Y;E=X;v=W;g=V;Y=u(Y,X,W,V,C[P+0],S,3614090360);V=u(V,Y,X,W,C[P+1],Q,3905402710);W=u(W,V,Y,X,C[P+2],N,606105819);X=u(X,W,V,Y,C[P+3],M,3250441966);Y=u(Y,X,W,V,C[P+4],S,4118548399);V=u(V,Y,X,W,C[P+5],Q,1200080426);W=u(W,V,Y,X,C[P+6],N,2821735955);X=u(X,W,V,Y,C[P+7],M,4249261313);Y=u(Y,X,W,V,C[P+8],S,1770035416);V=u(V,Y,X,W,C[P+9],Q,2336552879);W=u(W,V,Y,X,C[P+10],N,4294925233);X=u(X,W,V,Y,C[P+11],M,2304563134);Y=u(Y,X,W,V,C[P+12],S,1804603682);V=u(V,Y,X,W,C[P+13],Q,4254626195);W=u(W,V,Y,X,C[P+14],N,2792965006);X=u(X,W,V,Y,C[P+15],M,1236535329);Y=f(Y,X,W,V,C[P+1],A,4129170786);V=f(V,Y,X,W,C[P+6],z,3225465664);W=f(W,V,Y,X,C[P+11],y,643717713);X=f(X,W,V,Y,C[P+0],w,3921069994);Y=f(Y,X,W,V,C[P+5],A,3593408605);V=f(V,Y,X,W,C[P+10],z,38016083);W=f(W,V,Y,X,C[P+15],y,3634488961);X=f(X,W,V,Y,C[P+4],w,3889429448);Y=f(Y,X,W,V,C[P+9],A,568446438);V=f(V,Y,X,W,C[P+14],z,3275163606);W=f(W,V,Y,X,C[P+3],y,4107603335);X=f(X,W,V,Y,C[P+8],w,1163531501);Y=f(Y,X,W,V,C[P+13],A,2850285829);V=f(V,Y,X,W,C[P+2],z,4243563512);W=f(W,V,Y,X,C[P+7],y,1735328473);X=f(X,W,V,Y,C[P+12],w,2368359562);Y=D(Y,X,W,V,C[P+5],o,4294588738);V=D(V,Y,X,W,C[P+8],m,2272392833);W=D(W,V,Y,X,C[P+11],l,1839030562);X=D(X,W,V,Y,C[P+14],j,4259657740);Y=D(Y,X,W,V,C[P+1],o,2763975236);V=D(V,Y,X,W,C[P+4],m,1272893353);W=D(W,V,Y,X,C[P+7],l,4139469664);X=D(X,W,V,Y,C[P+10],j,3200236656);Y=D(Y,X,W,V,C[P+13],o,681279174);V=D(V,Y,X,W,C[P+0],m,3936430074);W=D(W,V,Y,X,C[P+3],l,3572445317);X=D(X,W,V,Y,C[P+6],j,76029189);Y=D(Y,X,W,V,C[P+9],o,3654602809);V=D(V,Y,X,W,C[P+12],m,3873151461);W=D(W,V,Y,X,C[P+15],l,530742520);X=D(X,W,V,Y,C[P+2],j,3299628645);Y=t(Y,X,W,V,C[P+0],U,4096336452);V=t(V,Y,X,W,C[P+7],T,1126891415);W=t(W,V,Y,X,C[P+14],R,2878612391);X=t(X,W,V,Y,C[P+5],O,4237533241);Y=t(Y,X,W,V,C[P+12],U,1700485571);V=t(V,Y,X,W,C[P+3],T,2399980690);W=t(W,V,Y,X,C[P+10],R,4293915773);X=t(X,W,V,Y,C[P+1],O,2240044497);Y=t(Y,X,W,V,C[P+8],U,1873313359);V=t(V,Y,X,W,C[P+15],T,4264355552);W=t(W,V,Y,X,C[P+6],R,2734768916);X=t(X,W,V,Y,C[P+13],O,1309151649);Y=t(Y,X,W,V,C[P+4],U,4149444226);V=t(V,Y,X,W,C[P+11],T,3174756917);W=t(W,V,Y,X,C[P+2],R,718787259);X=t(X,W,V,Y,C[P+9],O,3951481745);Y=K(Y,h);X=K(X,E);W=K(W,v);V=K(V,g)}var i=B(Y)+B(X)+B(W)+B(V);return i.toLowerCase()};

		      function convertToBase64() {
		          var selectedFile = document.getElementById("inputFile").files;
		          if (selectedFile.length > 0) {
		                  var fileToLoad = selectedFile[0];
		                  var fileReader = new FileReader();
		                  var base64;
		                  var file_id;
		                  fileReader.onload = function(fileLoadedEvent) {
		                          base64 = fileLoadedEvent.target.result;
		                          console.log(base64);
		                          file_id = (MD5(base64)).substring(0, 7);
		                          console.log("File id is:" + file_id)
		                          $.ajax({
		                                  url: "/store",
		                                  dataType: "json",
		                                  type: "post",
		                                  contentType: "application/json",
		                                  data: JSON.stringify( { "id": file_id, "data": base64 } ),
		                                  processData: false,
		                                  success: function( data, textStatus, jQxhr ){
		                                      $("#bitstream").html('<p>The link stops working in 5 minutes. Copy it anywhere: </p> <input class="copy" id="foo" value="' + window.location.href + 'retrieve?id=' + file_id + '"> <button class="btn"  data-clipboard-target="#foo"> <img style="max-height: -webkit-fill-available;" src="https://cdn.rawgit.com/zenorocha/clipboard.js/gh-pages/assets/images/clippy.svg" alt="Copy"> </button>');
																					new Clipboard('.btn');
																					console.log("success");
		                                  },
		                                  error: function( jqXhr, textStatus, errorThrown ){
		                                          console.log( errorThrown );
		                                  }
		                          });

		                  };
		                  basedata = fileReader.readAsDataURL(fileToLoad);
		              }
		      }
		      $(document).ready(function(){

		        $('form input').change(function () {
		          $('form p').text(this.files[0].name + " selected");
		        });
		      });
		</script>
	</div>
</body>
</html>
	`;
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
