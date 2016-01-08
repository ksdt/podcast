var express = require('express'),
    fs = require('fs'),
    xml = require('xml'),
    multer = require('multer'),
    upload = multer({ dest: 'uploads/' });

var app = express();

app.use(express.static('public'));

app.get('/xml', function (req, res) {

});

app.post('/uploadepisode', upload.single('episode-file'), function (req, res) {
    console.log(req.body, req.file);
    res.send('ok').end();
});

app.post('/updatechannel', upload.single('channel-image'), function (req, res) {
    console.log(req.body);
});

var server = app.listen(3000);
