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

function handleError(req, res, err){
    console.log(req.url + err)
    res.send('Error');
}

// API routing ===============================
router.get('/data/all', (req, res) => {
    currentConditions.data_point
    .find( {})
    .sort(
    {
        "dateTime": -1
    })
    .exec((err, data_points) => {
        if(err) {
            return handleError(req, res, err);
        }
        else {
            res.json(data_points);
        }
    });
});

router.get('/current', (req, res) => {
    res.json(currentConditions.current);
});

// Send all available file names as JSON
router.get('/data', (req, res) => {
    fs.readdir( path.join(__dirname, 'public/data'), (err, files) => {
        if (err) {
                console.log(err);
                res.send('error');
        }
        else res.json(files);
    });
});


// Send 
router.route('/data/:file_name', (req, res) =>{
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

// Add api routing to the app on the '/api' param
app.use('/api', router);

// Route all other traffic to frontend
app.get('*', (req, res) => {
    console.log('GET: ' + req.url);
    res.sendFile(path.join(__dirname, 'public/dist/index.html'));
});

console.log('port: ' + port);
app.listen(port);
console.log('Listening on port: ' + port);