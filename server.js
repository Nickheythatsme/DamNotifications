const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const currentConditions = require('./current_conditions');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public/dist')));
app.use(express.static(path.join(__dirname, 'public/historical')));

var port = process.env.PORT || 8080;
var router = express.Router();


// API routing ===============================
router.route('/current')
    .get( (req, res) => {
        res.json(currentConditions.current);
    });

// Send all available file names as JSON
router.route('/data')
    .get( (req, res) => {
        fs.readdir( path.join(__dirname, 'public/data'), (err, files) => {
            if (err) {
                 console.log(err);
                 res.send('error');
            }
            else res.json(files);
        });
    });

// Send 
router.route('/data/:file_name')
    .get( (req, res) =>{
        console.log('get: ' + req.params);
        fs.exists( path.join(__dirname, 'public/data/' + req.params.file_name), (exists) => {
            if (exists)
                res.sendFile(path.join(__dirname, 'public/data/' + req.params.file_name));
            else {
                res.json({message:'File does not exist'});
                res.status(404);
            }
        });
    });

router.get('/', (req, res) => {
    console.log('req: ' + req.url);
    res.json({message: 'Test works!'});
});
// Enable api routing on '/api' param
app.use('/api', router);

// Route all other traffic to frontend
app.get('*', (req, res) => {
    console.log('GET: ' + req.url);
    res.sendFile(path.join(__dirname, 'public/dist/index.html'));
});

app.listen(port);
console.log('Listening on port: ' + port);