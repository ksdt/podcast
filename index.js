var express = require('express'),
    fs = require('fs'),
    xml = require('xml');

var app = express();

app.get('/xml', function (req, res) {

});

var server = app.listen(3000);
