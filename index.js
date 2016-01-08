var express = require('express'),
    fs = require('fs'),
    xml = require('xml'),
    multer = require('multer'),
    podcast = require('podcast'),
    upload = multer({ dest: 'uploads/', limits: { fileFilter: authorize } });

function authorize(req, file, cb) {
    if (users[req.body.secret]) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

var app = express();

app.use(express.static('public'));

app.get('/xml', function (req, res) {

});

app.post('/uploadepisode', upload.single('episode-file'), function (req, res) {
    console.log(req.body, req.file);
    /* check if user exists */
    if (users[req.body.secret]) {

    } else {
        res.send('secret wrong. if u believe this is an error, please contact thollowa@ucsd.edu').end();
    }
});

app.post('/updatechannel', upload.single('channel-image'), function (req, res) {
    console.log(req.body);
});


/* init users / secrets */

var users = {};

fs.readFile('.pass', function (err, data) {
    if (!err) {
        console.log(data.toString());
        data.toString().split('\n').forEach(function(line) {
            var user_pass = line.split(' ');
            if (user_pass[0])
                users[user_pass[1]] = user_pass[0];
        });
        console.log(users);
    } else {
        console.log("Add a user in the file .pass");
        process.exit(1);
    }
});

var server = app.listen(3000);
