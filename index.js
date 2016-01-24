var express = require('express'),
    fs = require('fs'),
    xml = require('xml'),
    multer = require('multer'),
    moment = require('moment'),
    jsonfile = require('jsonfile'),
    podcast = require('podcast');


/* files pass through here and get rejected/accepted */
function authorize(req, file, cb) {
    if (users[req.body.secret]) { //password matches a user
        cb(null, true); //accept
    } else {
        cb(null, false); //reject
    }
}
var upload = multer({ dest: 'uploads/', limits: { fileFilter: authorize } });

var app = express();

var baseURL = 'https://ksdt.ucsd.edu/podcast/';

app.use(express.static('public'));

app.get('/rss/:user', function (req, res) {
    /* build feed for user */
    if (/^[a-z0-9]+$/i.test(req.params.user)) {
        if (fs.existsSync('./public/podcast/'+req.params.user+'/')) {
            if (fs.existsSync('./public/podcast/'+req.params.user+'/feed.json')) {
                var feed = jsonfile.readFileSync('./public/podcast/'+req.params.user+'/feed.json');
                if (!feed)
                    res.send('could not find channel information').end();
            } else {
                res.send('could not find channel information. please update it').end();
            }

            var userPodcast = new podcast(feed);

            var items = [];
            /* read files in items directory */
            fs.readdir('./public/podcast/'+req.params.user+'/items', function (err, files) {
                /* parse json from each file, then add to podcast feed */
                files.forEach(function (file) {
                    items.push(userPodcast.item(jsonfile.readFileSync('./public/podcast/'+req.params.user+'/items/'+file)));
                });

                res.set('Content-Type', 'application/rss+xml');
                res.send(userPodcast.xml('    '));
                res.end();
            });

        } else {
            res.send('user not found').end();
        }
    } else {
        res.send('invalid user').end();
    }
});

app.post('/uploadepisode', upload.single('episode-file'), function (req, res) {
    /* check if user exists */
    if (users[req.body.secret]) {
        console.log(req.body, req.file);
        var item = {};
        item.title = req.body['episode-title'];
        item.description = req.body['episode-description'];
        item.itunesSubtitle = req.body['episode-subtitle'];
        item.itunesSummary = req.body['episode-description'];
        item.itunesDuration = req.body['episode-duration'];
        item.date = new Date();


        /* mv uploaded file in users's folder */

        var newPath = './public/podcast/' + users[req.body.secret] + '/' + req.file.filename;

        fs.renameSync(req.file.path, newPath);

        item.enclosure = {
            url: baseURL+'podcast/'+users[req.body.secret]+'/'+req.file.filename,
            file: newPath
        }

        jsonfile.writeFile('./public/podcast/' +
                users[req.body.secret] +
                '/items/' +
                item.title +
                moment().format('M-D-YYY') +
                '.json', item, function (err) {
            console.log(err);
        });
        res.send('uploaded. check rss feed to verify').end();
    } else {
        res.send('secret wrong. if you believe this is an error, please contact thollowa@ucsd.edu').end();
    }
});

app.post('/updatechannel', upload.single('channel-image'), function (req, res) {
    if (users[req.body.secret]) {
        console.log(req.body, req.file);
        var channel = {};
        channel.title = req.body['channel-title'];
        channel.description = req.body['channel-summary'];
        channel.author = req.body['channel-author'];
        channel.feed_url = baseURL+'rss/'+users[req.body.secret];
        channel.site_url = 'https://ksdt.org';
        channel.image_url = 'https://ksdt.ucsd.edu/podcast/podcast/'+users[req.body.secret]+'/'+req.file.filename;
        channel.webMaster = 'Tennyson Holloway <thollowa@ucsd.edu>';
        channel.language = 'en-us';
        channel.categories = [req.body['channel-category']];

        channel.itunesSummary = req.body['channel-summary'];
        channel.itunesAuthor = req.body['channel-author'];
        channel.itunesExplicit = req.body['channel-explicit'];
        channel.itunesCategory = [ { text: req.body['channel-category'] } ];
        channel.itunesImage = baseURL + 'podcast/' + users[req.body.secret]+'/'+req.file.filename;

        fs.renameSync(req.file.path, './public/podcast/' + users[req.body.secret] + '/' + req.file.filename);

        jsonfile.writeFile('./public/podcast/' +
                users[req.body.secret] +
                '/feed.json', channel, function (err) {
            console.log(err);
        });
        res.send('great success. check rss feed to verify');
    } else {
        res.send('secret wrong. if you believe this is an error, please contact thollowa@ucsd.edu').end();
    }
});


/* init users / secrets */

var users = {};

if (!fs.existsSync('./.pass')) {
    console.log("No .pass file detected. See README.");
    process.exit(1);
}

fs.readFile('./.pass', function (err, data) {
    if (!err) {
        console.log(data.toString());

        if (!fs.existsSync('./public/podcast')) {
            fs.mkdirSync('./public/podcast');
        }

        /* split by line, then add users from line data */
        data.toString().split('\n').forEach(function(line) {
            var user_pass = line.split(' '); /* file is in the form: user pass */
            if (user_pass[0]) {
                users[user_pass[1]] = user_pass[0];
                /* create the user's folder if it doesn't exist*/
                if (!fs.existsSync('./public/podcast/'+user_pass[0])) {
                    fs.mkdirSync('./public/podcast/'+user_pass[0]);
                }
                if (!fs.existsSync('./public/podcast/'+user_pass[0]+'/items'))
                    fs.mkdirSync('./public/podcast/'+user_pass[0]+'/items');
            }
        });
        console.log(users);
    } else {
        console.log("Add a user in the file .pass");
        process.exit(1);
    }
});

var server = app.listen(process.env.PORT || 3000); //start express server
